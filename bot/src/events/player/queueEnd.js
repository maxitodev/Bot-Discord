const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "playerEmpty",
    async execute(player, client) {
        // Verificar que el player existe y no está destruido
        if (!player || player.state === 'DESTROYED' || player.state === 'DISCONNECTED') return;

        const channel = client.channels.cache.get(player.textId);
        if (!channel) return;

        // Check for Autoplay
        const musicConfig = client.configManager.load('music_settings') || {};
        const guildConfig = musicConfig[player.guildId] || {};
        const autoplayEnabled = guildConfig.autoplay !== false;

        if (autoplayEnabled) {
            const previousTrack = player.queue.previous?.[player.queue.previous.length - 1];

            if (previousTrack) {
                try {
                    // Verificar player antes de continuar
                    if (!player || player.state === 'DESTROYED') return;

                    // Historial para evitar repeticiones
                    if (!player.playedHistory) player.playedHistory = [];
                    player.playedHistory.push(previousTrack.uri);
                    if (player.playedHistory.length > 20) player.playedHistory.shift();

                    // Estrategias de búsqueda
                    const strategies = [
                        `ytsearch:${previousTrack.author} ${previousTrack.title} mix`,
                        `ytsearch:${previousTrack.author} songs`,
                        `ytsearch:${previousTrack.title} similar`
                    ];

                    let trackToPlay = null;

                    for (const query of strategies) {
                        // Verificar player antes de cada búsqueda
                        if (!player || player.state === 'DESTROYED') return;

                        try {
                            const res = await client.manager.search(query, { requester: client.user });

                            if (res && res.tracks && res.tracks.length > 0) {
                                const candidates = res.tracks.filter(t =>
                                    t.uri !== previousTrack.uri &&
                                    t.identifier !== previousTrack.identifier &&
                                    !player.playedHistory?.includes(t.uri)
                                );

                                if (candidates.length > 0) {
                                    const maxIndex = Math.min(candidates.length, 5);
                                    const randomIndex = Math.floor(Math.random() * maxIndex);
                                    trackToPlay = candidates[randomIndex];
                                    break;
                                }
                            }
                        } catch (searchError) {
                            // Ignorar errores de búsqueda individual
                            continue;
                        }
                    }

                    // Verificar player antes de reproducir
                    if (!player || player.state === 'DESTROYED') return;

                    if (trackToPlay) {
                        player.queue.add(trackToPlay);

                        // Verificar una última vez antes de play()
                        if (player && player.state !== 'DESTROYED') {
                            await player.play();

                            const embed = new EmbedBuilder()
                                .setColor(client.config.colors.music)
                                .setDescription(`${client.config.emojis.autoplay} **Autoplay:** [${trackToPlay.title}](${trackToPlay.uri})`);

                            return channel.send({ embeds: [embed] }).catch(() => { });
                        }
                    }
                } catch (e) {
                    // Ignorar errores de autoplay silenciosamente
                    if (!e.message?.includes('destroyed')) {
                        console.error("Autoplay error:", e.message);
                    }
                }
            }
        }

        // Verificar player antes de enviar mensaje
        if (!player || player.state === 'DESTROYED') return;

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.warning)
            .setDescription(`${client.config.emojis.music} La cola ha terminado.`)
            .setFooter({ text: "Desconectando en 5 minutos si no hay actividad..." })
            .setTimestamp();

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            // Ignorar error de envío
        }

        // 5 Minutes Timeout
        if (player.disconnectTimeout) clearTimeout(player.disconnectTimeout);

        player.disconnectTimeout = setTimeout(() => {
            try {
                if (player && player.state !== 'DESTROYED' && player.queue.size === 0 && !player.playing) {
                    player.destroy();
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription("💤 **Desconectado por inactividad.**");
                    channel.send({ embeds: [timeoutEmbed] }).catch(() => { });
                }
            } catch (e) {
                // Player ya destruido, ignorar
            }
        }, 5 * 60 * 1000);
    }
};
