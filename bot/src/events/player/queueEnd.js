const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "playerEmpty",
    async execute(player, client) {
        console.log(`[DEBUG] playerEmpty event triggered for guild: ${player.guildId}`);

        // Verificar que el player existe y no está destruido
        if (!player || player.state === 'DESTROYED' || player.state === 'DISCONNECTED') {
            console.log(`[DEBUG] Player skipped due to state: ${player ? player.state : 'No Player'}`);
            return;
        }

        const channel = client.channels.cache.get(player.textId);
        if (!channel) {
            console.log(`[DEBUG] No text channel found: ${player.textId}`);
            return;
        }

        // Check for Autoplay
        // Priority: Player Session Autoplay -> False (Default)
        // If player.autoplay is undefined, it is considered FALSE.
        // It is only true if explicitly set to true.
        const autoplayEnabled = player.autoplay === true;
        console.log(`[DEBUG] Autoplay enabled: ${autoplayEnabled} (Value: ${player.autoplay})`);

        if (autoplayEnabled) {
            const previousTrack = player.queue.previous.length > 0 ? player.queue.previous[player.queue.previous.length - 1] : null;
            console.log(`[DEBUG] Previous track: ${previousTrack ? previousTrack.title : 'None'}`);

            if (previousTrack) {
                try {
                    // Verificar player antes de continuar
                    if (!player || player.state === 'DESTROYED') return;

                    // Historial para evitar repeticiones
                    if (!player.playedHistory) player.playedHistory = [];
                    player.playedHistory.push(previousTrack.uri);
                    if (player.playedHistory.length > 20) player.playedHistory.shift();

                    console.log(`[DEBUG] History length: ${player.playedHistory.length}`);

                    // Limpiar título para mejor búsqueda (quitar paréntesis, corchetes, ft., etc)
                    const cleanTitle = previousTrack.title
                        .replace(/[\(\[\{].*?[\)\]\}]/g, '') // Quitar (...) [...] {...}
                        .replace(/(ft|feat)\..*/i, '')      // Quitar ft. ...
                        .trim();

                    console.log(`[DEBUG] Cleaned title: ${cleanTitle}`);

                    // Estrategias de búsqueda mejoradas
                    const strategies = [
                        `ytsearch:${previousTrack.author} ${cleanTitle} similar`,
                        `ytsearch:${previousTrack.author} ${cleanTitle} mix`,
                        `ytsearch:${previousTrack.author} best songs`
                    ];

                    let trackToPlay = null;

                    for (const query of strategies) {
                        // Verificar player antes de cada búsqueda
                        if (!player || player.state === 'DESTROYED') return;

                        console.log(`[DEBUG] Searching strategy: ${query}`);

                        try {
                            const res = await client.manager.search(query, { requester: client.user });

                            if (res && res.tracks && res.tracks.length > 0) {
                                console.log(`[DEBUG] Found ${res.tracks.length} tracks for query: ${query}`);
                                const candidates = res.tracks.filter(t =>
                                    t.uri !== previousTrack.uri &&
                                    t.identifier !== previousTrack.identifier &&
                                    !player.playedHistory?.includes(t.uri) &&
                                    // Evitar la misma canción con mismo título (e.g. Video vs Audio)
                                    t.title.toLowerCase() !== previousTrack.title.toLowerCase()
                                );

                                console.log(`[DEBUG] Candidates after filtering: ${candidates.length}`);

                                if (candidates.length > 0) {
                                    // Tomar random de los mejores 3 resultados para variar
                                    const maxIndex = Math.min(candidates.length, 3);
                                    const randomIndex = Math.floor(Math.random() * maxIndex);
                                    trackToPlay = candidates[randomIndex];
                                    console.log(`[DEBUG] Selected track: ${trackToPlay.title}`);
                                    break;
                                }
                            } else {
                                console.log(`[DEBUG] No tracks found for query: ${query}`);
                            }
                        } catch (searchError) {
                            console.error(`[DEBUG] Search error for ${query}:`, searchError);
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
