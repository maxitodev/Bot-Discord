const { EmbedBuilder } = require("discord.js");

/**
 * Sistema de publicación automática de memes
 * Se ejecuta en intervalos configurados por servidor
 */

class AutoMemeSystem {
    constructor(client) {
        this.client = client;
        this.intervals = new Map(); // Almacena los intervalos por guildId
        this.lastMemes = new Map(); // Evita duplicados recientes
    }

    /**
     * Inicia el sistema de auto-memes para un servidor
     * @param {string} guildId - ID del servidor
     */
    start(guildId) {
        // Detener intervalo existente si hay uno
        this.stop(guildId);

        const config = this.client.autoMemeConfig?.get(guildId);
        if (!config || !config.enabled) return;

        console.log(`🎭 Auto-Memes iniciado para servidor ${guildId} (cada ${config.interval / 60000} minutos)`);

        // Crear nuevo intervalo
        const interval = setInterval(async () => {
            await this.postMeme(guildId);
        }, config.interval);

        this.intervals.set(guildId, interval);

        // Publicar primer meme inmediatamente (opcional, comentar si no se desea)
        // setTimeout(() => this.postMeme(guildId), 5000);
    }

    /**
     * Detiene el sistema de auto-memes para un servidor
     * @param {string} guildId - ID del servidor
     */
    stop(guildId) {
        const interval = this.intervals.get(guildId);
        if (interval) {
            clearInterval(interval);
            this.intervals.delete(guildId);
            console.log(`🛑 Auto-Memes detenido para servidor ${guildId}`);
        }
    }

    /**
     * Publica un meme en el canal configurado
     * @param {string} guildId - ID del servidor
     */
    async postMeme(guildId) {
        try {
            const config = this.client.autoMemeConfig?.get(guildId);
            if (!config || !config.enabled) {
                this.stop(guildId);
                return;
            }

            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) {
                console.error(`❌ Servidor ${guildId} no encontrado`);
                this.stop(guildId);
                return;
            }

            const channel = guild.channels.cache.get(config.channelId);
            if (!channel) {
                console.error(`❌ Canal ${config.channelId} no encontrado en servidor ${guild.name}`);
                this.stop(guildId);
                return;
            }

            // Obtener meme
            const meme = await this.fetchMeme(config.category, guildId);
            if (!meme) {
                console.error(`❌ No se pudo obtener meme para ${guild.name}`);
                return;
            }

            // Verificar NSFW
            if (meme.nsfw && !channel.nsfw) {
                console.warn(`⚠️ Meme NSFW omitido en canal no-NSFW (${guild.name})`);
                return;
            }

            // Safe color access
            const color = (this.client.config && this.client.config.colors && this.client.config.colors.main)
                ? this.client.config.colors.main
                : 0xFF4500;

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(meme.title.length > 256 ? meme.title.substring(0, 253) + "..." : meme.title)
                .setImage(meme.url)
                .setFooter({
                    text: `👍 ${meme.ups} upvotes | r/${meme.subreddit} | Auto-Meme`,
                    iconURL: this.client.user.displayAvatarURL()
                })
                .setTimestamp()
                .setURL(meme.postLink);

            await channel.send({ embeds: [embed] });
            console.log(`✅ Meme publicado en ${guild.name} (#${channel.name})`);

        } catch (error) {
            console.error(`❌ Error al publicar meme en servidor ${guildId}:`, error);
        }
    }

    /**
     * Obtiene un meme aleatorio de Reddit
     * @param {string} category - Categoría del meme
     * @param {string} guildId - ID del servidor (para evitar duplicados)
     * @returns {Promise<Object|null>}
     */
    async fetchMeme(category, guildId) {
        const subreddits = {
            memes: ["memes", "dankmemes", "me_irl"],
            dankmemes: ["dankmemes", "dankvideos"],
            gaming: ["gaming", "gamingmemes"],
            ProgrammerHumor: ["ProgrammerHumor", "programmerreactions"],
            aww: ["aww", "rarepuppers", "AnimalsBeingDerps"],
            MAAU: ["MAAU", "MemesEnEspanol", "yo_elvr"]
        };

        const subredditList = subreddits[category] || subreddits.memes;
        const selectedSubreddit = subredditList[Math.floor(Math.random() * subredditList.length)];

        try {
            const response = await fetch(`https://www.reddit.com/r/${selectedSubreddit}/hot.json?limit=100`, {
                headers: {
                    'User-Agent': 'Discord-Meme-Bot/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`Reddit API error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.data || !data.data.children || data.data.children.length === 0) {
                return null;
            }

            // Filtrar solo posts con imágenes
            const imagePosts = data.data.children.filter(post => {
                const postData = post.data;
                return (
                    !postData.is_video &&
                    !postData.stickied &&
                    postData.post_hint === "image" &&
                    (postData.url.endsWith('.jpg') ||
                        postData.url.endsWith('.png') ||
                        postData.url.endsWith('.gif') ||
                        postData.url.includes('i.redd.it') ||
                        postData.url.includes('i.imgur.com'))
                );
            });

            if (imagePosts.length === 0) {
                return null;
            }

            // Evitar duplicados recientes
            const guildLastMemes = this.lastMemes.get(guildId) || [];
            const availablePosts = imagePosts.filter(post =>
                !guildLastMemes.includes(post.data.id)
            );

            const postsToChooseFrom = availablePosts.length > 0 ? availablePosts : imagePosts;
            const randomPost = postsToChooseFrom[Math.floor(Math.random() * postsToChooseFrom.length)].data;

            // Actualizar historial de memes (mantener últimos 50)
            guildLastMemes.push(randomPost.id);
            if (guildLastMemes.length > 50) {
                guildLastMemes.shift();
            }
            this.lastMemes.set(guildId, guildLastMemes);

            return {
                title: randomPost.title,
                url: randomPost.url,
                ups: randomPost.ups,
                nsfw: randomPost.over_18,
                subreddit: randomPost.subreddit,
                postLink: `https://reddit.com${randomPost.permalink}`
            };

        } catch (error) {
            console.error("Error fetching meme from Reddit:", error);
            return null;
        }
    }

    /**
     * Inicializa todos los auto-memes guardados al iniciar el bot
     */
    initializeAll() {
        if (!this.client.autoMemeConfig) return;

        for (const [guildId, config] of this.client.autoMemeConfig.entries()) {
            if (config.enabled) {
                this.start(guildId);
            }
        }

        console.log(`🎭 ${this.intervals.size} sistemas de Auto-Memes inicializados`);
    }

    /**
     * Detiene todos los intervalos (útil al apagar el bot)
     */
    stopAll() {
        for (const guildId of this.intervals.keys()) {
            this.stop(guildId);
        }
    }
}

module.exports = AutoMemeSystem;
