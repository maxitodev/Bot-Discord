const Parser = require('rss-parser');
const { EmbedBuilder } = require('discord.js');

class NewsSystem {
    constructor(client) {
        this.client = client;
        this.parser = new Parser();
        this.feeds = new Map();

        // Definición de fuentes RSS
        this.sources = {
            'mexico': {
                name: 'Noticias México 🇲🇽',
                url: 'https://news.google.com/rss?hl=es-419&gl=MX&ceid=MX:es-419',
                color: 0x009C3B, // Verde México
                icon: 'https://flagcdn.com/w320/mx.png'
            },
            'tech': {
                name: 'Tecnología 📱',
                url: 'https://www.xataka.com.mx/index.xml',
                color: 0x0066CC, // Azul Tech
                icon: 'https://i.imgur.com/8QZ8x4w.png' // Icono genérico tech
            },
            'ai': {
                name: 'Inteligencia Artificial 🤖',
                url: 'https://www.genbeta.com/tag/inteligencia-artificial/rss2.xml',
                color: 0x9932CC, // Púrpura AI
                icon: 'https://i.imgur.com/p5Q5z7w.png' // Icono cerebro AI
            },
            'gaming': {
                name: 'Videojuegos 🎮',
                url: 'https://vandal.elespanol.com/xml.cgi',
                color: 0xFF4500, // Naranja Gaming
                icon: 'https://vandal.elespanol.com/favicon.ico' // Icono Vandal
            }
        };

        this.checkInterval = 30 * 60 * 1000; // Revisar cada 30 minutos
    }

    start() {
        console.log("📰 Sistema de Noticias iniciado");
        // Cargar estado de últimas noticias enviadas para no repetir
        this.lastNews = this.client.configManager.load('news_history') || new Map();

        // Iniciar ciclo de revisión
        this.interval = setInterval(() => this.checkFeeds(), this.checkInterval);

        // Primera revisión (con un pequeño delay para dejar al bot iniciar)
        setTimeout(() => this.checkFeeds(), 10000);
    }

    async checkFeeds() {
        // Obtener configuraciones de suscripción
        const subscriptions = this.client.configManager.load('news_subs');
        if (!subscriptions || subscriptions.size === 0) return;

        // Identificar qué categorías necesitan revisión (si al menos una sub lo requiere)
        const categoriesToFetch = new Set();
        const pendingSubs = [];

        for (const [guildId, guildSubs] of subscriptions.entries()) {
            // Manejar tanto array como objeto simple (migración)
            const subsList = Array.isArray(guildSubs) ? guildSubs : [guildSubs];

            for (const sub of subsList) {
                if (!sub.enabled) continue;

                // Verificar intervalo (default 30m si no existe)
                const interval = sub.interval || 30 * 60 * 1000;
                const lastCheck = sub.lastCheck || 0;

                if (Date.now() - lastCheck >= interval) {
                    categoriesToFetch.add(sub.category);
                    pendingSubs.push({ guildId, sub });
                }
            }
        }

        if (categoriesToFetch.size === 0) return;

        // Fetch de las feeds necesarias
        const feedCache = new Map();
        for (const category of categoriesToFetch) {
            const source = this.sources[category];
            if (source) {
                try {
                    const feed = await this.parser.parseURL(source.url);
                    feedCache.set(category, feed);
                } catch (error) {
                    console.error(`❌ Error fetching feed ${category}:`, error.message);
                }
            }
        }

        // Procesar suscripciones pendientes
        let updates = false;
        for (const { guildId, sub } of pendingSubs) {
            const feed = feedCache.get(sub.category);
            if (!feed || !feed.items || feed.items.length === 0) continue;

            const source = this.sources[sub.category];

            // Determinar noticias nuevas para esta suscripción
            const latestItems = feed.items.slice(0, 5); // Mirar las últimas 5
            const newItems = [];

            // Si es la primera vez (no lastItemId), enviamos solo la más reciente
            if (!sub.lastItemId) {
                newItems.push(latestItems[0]);
            } else {
                // Buscar noticias más nuevas que la última guardada
                for (const item of latestItems) {
                    const itemId = item.guid || item.link || item.title;
                    if (itemId === sub.lastItemId) break;
                    newItems.unshift(item); // Orden cronológico
                }
            }

            if (newItems.length > 0) {
                await this.sendNewsToGuild(guildId, sub.channelId, newItems, source);

                // Actualizar puntero
                const newestItem = newItems[newItems.length - 1];
                sub.lastItemId = newestItem.guid || newestItem.link || newestItem.title;
            }

            // Actualizar tiempo de chequeo
            sub.lastCheck = Date.now();
            updates = true;
        }

        if (updates) {
            this.client.configManager.save('news_subs', subscriptions);
        }
    }

    async processFeed(category, subscriptions) {
        // Deprecated in favor of logic in checkFeeds
    }

    async sendNewsToGuild(guildId, channelId, items, source) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(channelId);
        if (!channel) return;

        for (const item of items) {
            // Limpiar contenido HTML básico si existe
            let content = item.contentSnippet || item.content || '';
            if (content.length > 200) content = content.substring(0, 197) + '...';

            // Extraer imagen si existe en el content (básico)
            let imageUrl = null;
            const imgMatch = item.content?.match(/src="([^"]+)"/);
            if (imgMatch) imageUrl = imgMatch[1];
            if (!imageUrl && item.enclosure?.url) imageUrl = item.enclosure.url;

            // Corregir URLs relativas al protocolo (empezando con //)
            if (imageUrl && imageUrl.startsWith("//")) {
                imageUrl = "https:" + imageUrl;
            }

            const embed = new EmbedBuilder()
                .setColor(source.color)
                .setAuthor({ name: source.name, iconURL: source.icon })
                .setTitle(item.title)
                .setURL(item.link)
                .setDescription(content)
                .setTimestamp(new Date(item.pubDate));

            if (imageUrl) embed.setImage(imageUrl);

            embed.setFooter({ text: '📰 Noticia Automática' });

            try {
                await channel.send({ embeds: [embed] });
            } catch (error) {
                console.error(`Error enviando noticia a ${guild.name}:`, error);
            }
        }
    }
}

module.exports = NewsSystem;
