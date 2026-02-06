const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "playerEmpty",
    async execute(player, client) {
        const channel = client.channels.cache.get(player.textId);
        if (!channel) return;

        // Check for Autoplay
        // Check for Autoplay (Defaults to TRUE if not expressly disabled)
        // User request: "active default" and "same last search context"
        const musicConfig = client.configManager.load('music_settings') || {};
        const guildConfig = musicConfig[player.guildId] || {};
        // Default to TRUE unless explicitly set to false
        const autoplayEnabled = guildConfig.autoplay !== false;

        if (autoplayEnabled) {
            const previousTrack = player.queue.previous[player.queue.previous.length - 1];

            if (previousTrack) {
                try {
                    // Smart recommendation: Search for Mix or Author+Title
                    // "related:" is good but sometimes returns random stuff. 
                    // User wants "algo relacionado no algo random".
                    // Let's try searching for the track title + author:
                    const searchQuery = `ytsearch:${previousTrack.title} ${previousTrack.author}`;
                    let res = await client.manager.search(searchQuery, { requester: client.user });

                    if (res && res.tracks && res.tracks.length > 0) {
                        // Avoid playing the exact same track
                        let trackToPlay = res.tracks.find(t => t.uri !== previousTrack.uri) || res.tracks[0];

                        // Fallback logic
                        if (trackToPlay.uri === previousTrack.uri && res.tracks.length > 1) {
                            trackToPlay = res.tracks[1];
                        }

                        if (trackToPlay) {
                            player.queue.add(trackToPlay);
                            player.play();

                            const embed = new EmbedBuilder()
                                .setColor(client.config.colors.music)
                                .setDescription(`♾️ **Autoplay:** Reproduciendo recomendación: [${trackToPlay.title}](${trackToPlay.uri})`);

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

        // 5 Minutes Timeout
        if (player.disconnectTimeout) clearTimeout(player.disconnectTimeout);

        player.disconnectTimeout = setTimeout(() => {
            if (player && player.queue.size === 0 && !player.playing) {
                player.destroy();
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(client.config.colors.error)
                    .setDescription("💤 **Desconectado por inactividad.**");
                channel.send({ embeds: [timeoutEmbed] }).catch(() => { });
            }
        }, 5 * 60 * 1000);
    }
};
