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
     * Detiene el sistema de auto-memes para un servidor
     * @param {string} guildId - ID del servidor
     */
    stop(guildId) {
        if (this.intervals.has(guildId)) {
            clearInterval(this.intervals.get(guildId));
            this.intervals.delete(guildId);
            console.log(`🛑 Auto-Memes detenido para servidor ${guildId}`);
        }
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

        // Cargar historial de memes para evitar repeticiones tras reinicio
        if (this.lastMemes.size === 0) {
            this.lastMemes = this.client.configManager.load('meme_history') || new Map();
        }

        const label = config.intervalLabel || `${config.interval / 60000} minutos`;
        console.log(`🎭 Auto-Memes iniciado para servidor ${guildId} (cada ${label})`);

        // Crear nuevo intervalo
        const interval = setInterval(async () => {
            await this.postMeme(guildId);
        }, config.interval);

        this.intervals.set(guildId, interval);

        // Publicar primer meme inmediatamente (opcional)
        // setTimeout(() => this.postMeme(guildId), 5000);
    }

    // ... (omitted code) ...

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
            // Usar meme-api.com
            const url = `https://meme-api.com/gimme/${selectedSubreddit}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Meme API error: ${response.status}`);
            }

            const data = await response.json();

            if (!data || !data.url) {
                return null;
            }

            const meme = {
                title: data.title || 'Meme Random',
                url: data.url,
                ups: data.ups || 0,
                nsfw: data.nsfw || false,
                subreddit: data.subreddit || selectedSubreddit,
                postLink: data.postLink || 'https://reddit.com',
                author: data.author || 'unknown'
            };

            // Evitar duplicados recientes
            let guildLastMemes = this.lastMemes.get(guildId);
            if (!Array.isArray(guildLastMemes)) {
                // Si venía de JSON puede que necesite conversión o inicialización
                guildLastMemes = [];
            }

            // Si este meme ya se publicó recientemente, intentar obtener otro
            if (guildLastMemes.includes(meme.url)) {
                // Intentar una vez más con otro subreddit de la categoría
                const retrySubreddit = subredditList[Math.floor(Math.random() * subredditList.length)];
                const retryUrl = `https://meme-api.com/gimme/${retrySubreddit}`;
                const retryResponse = await fetch(retryUrl);

                if (retryResponse.ok) {
                    const retryData = await retryResponse.json();
                    if (retryData && retryData.url && !guildLastMemes.includes(retryData.url)) {
                        const retryMeme = {
                            title: retryData.title || 'Meme Random',
                            url: retryData.url,
                            ups: retryData.ups || 0,
                            nsfw: retryData.nsfw || false,
                            subreddit: retryData.subreddit || retrySubreddit,
                            postLink: retryData.postLink || 'https://reddit.com',
                            author: retryData.author || 'unknown'
                        };

                        // Actualizar historial
                        guildLastMemes.push(retryMeme.url);
                        if (guildLastMemes.length > 50) {
                            guildLastMemes.shift();
                        }
                        this.lastMemes.set(guildId, guildLastMemes);
                        this.client.configManager.save('meme_history', this.lastMemes); // GUARDAR
                        return retryMeme;
                    }
                }
            }

            // Actualizar historial de memes (mantener últimos 50)
            guildLastMemes.push(meme.url);
            if (guildLastMemes.length > 50) {
                guildLastMemes.shift();
            }
            this.lastMemes.set(guildId, guildLastMemes);
            this.client.configManager.save('meme_history', this.lastMemes); // GUARDAR

            return meme;

        } catch (error) {
            console.error("Error fetching meme from meme-api.com:", error);
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
