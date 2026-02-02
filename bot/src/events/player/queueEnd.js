const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "playerEmpty",
    async execute(player, client) {
        const channel = client.channels.cache.get(player.textId);
        if (!channel) return;

        // Check for Autoplay
        if (player.autoplay) {
            const previousTrack = player.queue.previous[player.queue.previous.length - 1];

            if (previousTrack) {
                try {
                    // Try to find a related track. 
                    // Note: 'related:' only works well with YouTube sources.
                    // Fallback to searching the author if related fails or isn't supported.
                    let search = `related:${previousTrack.uri}`;
                    let res = await client.manager.search(search, { requester: client.user });

                    if (!res || !res.tracks || res.tracks.length === 0) {
                        // Fallback: mix of the previous track
                        search = `ytsearch:${previousTrack.author} ${previousTrack.title} mix`;
                        res = await client.manager.search(search, { requester: client.user });
                    }

                    if (res && res.tracks && res.tracks.length > 0) {
                        // Filter out tracks that were recently played to avoid loops (basic)
                        // Or just pick the second one if the first one is the same (often happens with mix/search)

                        let trackToPlay = res.tracks[1] || res.tracks[0];
                        // If we are using 'related', tracks[1] is usually a good recommendation. 
                        // If we used a search, tracks[0] might be the same song, so track[1] is better.

                        if (trackToPlay) {
                            player.queue.add(trackToPlay);
                            player.play();

                            const embed = new EmbedBuilder()
                                .setColor(client.config.colors.music)
                                .setDescription(`♾️ **Autoplay:** Añadida [${trackToPlay.title}](${trackToPlay.uri})`);

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
            .setFooter({ text: "Desconectando por inactividad..." })
            .setTimestamp();

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("Error al enviar mensaje de queueEnd:", error);
        }

        // Auto disconnect logic
        player.destroy();
    }
};
