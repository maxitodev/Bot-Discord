const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "playerEmpty",
    async execute(player, client) {
        const channel = client.channels.cache.get(player.textId);
        if (!channel) return;

        // Check for Autoplay
        const musicConfig = client.configManager.load('music_settings') || {};
        const guildConfig = musicConfig[player.guildId] || {};
        // Default to TRUE unless explicitly set to false
        const autoplayEnabled = guildConfig.autoplay !== false;

        if (autoplayEnabled) {
            const previousTrack = player.queue.previous[player.queue.previous.length - 1];

            if (previousTrack) {
                try {
                    // Smart recommendation: Use YouTube Music search for better "related" tracks
                    // Search for the artist and title to fulfill "related not random"
                    const searchQuery = `ytmsearch:${previousTrack.title} ${previousTrack.author}`;
                    let res = await client.manager.search(searchQuery, { requester: client.user });

                    if (!res || res.tracks.length === 0) {
                        // Fallback to standard YouTube search if YTM fails
                        const fallbackQuery = `ytsearch:${previousTrack.author} ${previousTrack.title} related`;
                        res = await client.manager.search(fallbackQuery, { requester: client.user });
                    }

                    if (res && res.tracks && res.tracks.length > 0) {
                        // Filter out the previous track and exact title matches to avoid loops
                        // Also filter out tracks that are too long (e.g. > 15 mins) to avoid compilations if desired, but let's stick to simple filters for now
                        const uniqueTracks = res.tracks.filter(t =>
                            t.uri !== previousTrack.uri &&
                            t.identifier !== previousTrack.identifier &&
                            t.title !== previousTrack.title // Strict title check
                        );

                        // If we have unique tracks, pick one. 
                        // To add variety, pick random from top 5 (or fewer if less results)
                        let trackToPlay;
                        if (uniqueTracks.length > 0) {
                            const maxIndex = Math.min(uniqueTracks.length, 5);
                            const randomIndex = Math.floor(Math.random() * maxIndex);
                            trackToPlay = uniqueTracks[randomIndex];
                        } else {
                            // If all filtered out (unlikely), pick the second result of original search
                            trackToPlay = res.tracks[1] || res.tracks[0];
                        }

                        if (trackToPlay) {
                            player.queue.add(trackToPlay);
                            player.play();

                            const embed = new EmbedBuilder()
                                .setColor(client.config.colors.music)
                                .setDescription(`${client.config.emojis.autoplay} **Autoplay:** Reproduciendo recomendación: [${trackToPlay.title}](${trackToPlay.uri})`);

                            return channel.send({ embeds: [embed] });
                        }
                    }
                } catch (e) {
                    console.error("Autoplay error:", e);
                }
            }
        }

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.warning)
            .setDescription(`${client.config.emojis.music} La cola ha terminado.`)
            .setFooter({ text: "Desconectando en 5 minutos si no hay actividad..." })
            .setTimestamp();

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("Error al enviar mensaje de queueEnd:", error);
        }

        // 5 Minutes Timeout for Queue Empty
        if (player.disconnectTimeout) clearTimeout(player.disconnectTimeout);

        player.disconnectTimeout = setTimeout(() => {
            if (player && player.queue.size === 0 && !player.playing) {
                player.destroy();
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(client.config.colors.error)
                    .setDescription("💤 **Desconectado por inactividad.** (Cola vacía)");
                channel.send({ embeds: [timeoutEmbed] }).catch(() => { });
            }
        }, 5 * 60 * 1000);
    }
};
