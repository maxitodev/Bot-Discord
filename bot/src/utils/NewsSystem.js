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

        // Agrupar suscripciones por categoría para no hacer peticiones duplicadas
        const categoriesToCheck = new Set();
        for (const sub of subscriptions.values()) {
            if (sub.enabled) categoriesToCheck.add(sub.category);
        }

        for (const category of categoriesToCheck) {
            await this.processFeed(category, subscriptions);
        }

        // Guardar historial actualizado
        this.client.configManager.save('news_history', this.lastNews);
    }

    async processFeed(category, subscriptions) {
        const source = this.sources[category];
        if (!source) return;

        try {
            const feed = await this.parser.parseURL(source.url);
            if (!feed || !feed.items || feed.items.length === 0) return;

            // Obtener la última noticia guardada para esta categoría
            const lastProcessedId = this.lastNews.get(category);

            // Filtrar noticias nuevas
            // Tomamos las últimas 3 para no saturar si es la primera vez
            const latestItems = feed.items.slice(0, 3);

            // Encontrar noticias que sean más nuevas que la última guardada
            // (Comparando GUID o Link o Título)
            const newItems = [];

            for (const item of latestItems) {
                const itemId = item.guid || item.link || item.title;
                if (itemId === lastProcessedId) break; // Ya llegamos a la que habíamos visto
                newItems.unshift(item); // Agregar al principio (orden cronológico)
            }

            // Si hay noticias nuevas
            if (newItems.length > 0) {
                // Actualizar puntero de última noticia
                const newestItem = newItems[newItems.length - 1];
                this.lastNews.set(category, newestItem.guid || newestItem.link || newestItem.title);

                // Enviar a todos los canales suscritos
                for (const [guildId, config] of subscriptions.entries()) {
                    if (config.category === category && config.enabled) {
                        await this.sendNewsToGuild(guildId, config.channelId, newItems, source);
                    }
                }
            }

        } catch (error) {
            console.error(`❌ Error procesando feed ${category}:`, error.message);
        }
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
