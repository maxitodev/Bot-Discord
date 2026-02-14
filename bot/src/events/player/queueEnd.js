const { EmbedBuilder } = require("discord.js");

const SPOTIFY_COLOR = 0x1DB954;

module.exports = {
    name: "playerEmpty",
    async execute(player, client) {
        console.log(`[Queue] Cola vacía para guild: ${player.guildId}`);

        // Verificar que el player existe y no está destruido
        if (!player || player.state === 'DESTROYED' || player.state === 'DISCONNECTED') {
            return;
        }

        const channel = client.channels.cache.get(player.textId);
        if (!channel) return;

        // --- LÓGICA DE AUTOPLAY CON SPOTIFY ---
        const isAutoplayEnabled = player.data?.autoplay === true;

        if (isAutoplayEnabled && player.queue.previous) {
            try {
                let previousTrack = player.queue.previous;
                if (Array.isArray(previousTrack)) {
                    previousTrack = previousTrack[previousTrack.length - 1];
                }

                if (!previousTrack) return;

                // Limpiar nombre del artista
                const artist = (previousTrack.author || '')
                    .replace(/\s*-\s*topic$/gi, '')
                    .replace(/vevo$/gi, '')
                    .trim();

                console.log(`[Autoplay] Buscando canciones populares de: ${artist}`);

                // Historial de canciones ya reproducidas (evitar repeticiones)
                player.data.autoplayHistory = player.data.autoplayHistory || [];
                // Guardar la última canción en el historial
                if (previousTrack.title) {
                    player.data.autoplayHistory.push(previousTrack.title.toLowerCase());
                    // Mantener solo las últimas 20 canciones en el historial
                    if (player.data.autoplayHistory.length > 20) {
                        player.data.autoplayHistory = player.data.autoplayHistory.slice(-20);
                    }
                }

                let nextTrack = null;

                // === ESTRATEGIA 1: Buscar por artista en Spotify (canciones populares) ===
                if (artist) {
                    try {
                        const spotifyRes = await client.manager.search(artist, {
                            requester: client.user,
                            engine: 'spotify'
                        });

                        if (spotifyRes && spotifyRes.tracks && spotifyRes.tracks.length > 0) {
                            // Filtrar: no repetir canciones del historial
                            const availableTracks = spotifyRes.tracks.filter(t => {
                                const titleLower = t.title.toLowerCase();
                                return !player.data.autoplayHistory.includes(titleLower) &&
                                    t.identifier !== previousTrack.identifier;
                            });

                            if (availableTracks.length > 0) {
                                // Elegir una de las primeras 5 (las más populares en Spotify)
                                const topTracks = availableTracks.slice(0, 5);
                                nextTrack = topTracks[Math.floor(Math.random() * topTracks.length)];
                                console.log(`[Autoplay] Spotify encontró: ${nextTrack.title} - ${nextTrack.author}`);
                            }
                        }
                    } catch (e) {
                        console.warn(`[Autoplay] Spotify search falló: ${e.message}`);
                    }
                }

                // === ESTRATEGIA 2: Buscar "artista popular songs" en Spotify ===
                if (!nextTrack && artist) {
                    try {
                        const spotifyRes2 = await client.manager.search(`${artist} top hits`, {
                            requester: client.user,
                            engine: 'spotify'
                        });

                        if (spotifyRes2 && spotifyRes2.tracks && spotifyRes2.tracks.length > 0) {
                            const availableTracks = spotifyRes2.tracks.filter(t => {
                                const titleLower = t.title.toLowerCase();
                                return !player.data.autoplayHistory.includes(titleLower) &&
                                    t.identifier !== previousTrack.identifier;
                            });

                            if (availableTracks.length > 0) {
                                const topTracks = availableTracks.slice(0, 5);
                                nextTrack = topTracks[Math.floor(Math.random() * topTracks.length)];
                                console.log(`[Autoplay] Spotify fallback encontró: ${nextTrack.title}`);
                            }
                        }
                    } catch (e) {
                        console.warn(`[Autoplay] Spotify fallback search falló: ${e.message}`);
                    }
                }

                // === ESTRATEGIA 3: Buscar "título + artista" en Spotify (canción similar) ===
                if (!nextTrack) {
                    try {
                        const cleanTitle = previousTrack.title
                            .replace(/\(.*?\)/g, '')
                            .replace(/\[.*?\]/g, '')
                            .trim();

                        const spotifyRes3 = await client.manager.search(`${cleanTitle} ${artist}`, {
                            requester: client.user,
                            engine: 'spotify'
                        });

                        if (spotifyRes3 && spotifyRes3.tracks && spotifyRes3.tracks.length > 1) {
                            // Saltar el primer resultado (probablemente la misma canción)
                            const availableTracks = spotifyRes3.tracks.filter(t => {
                                const titleLower = t.title.toLowerCase();
                                return !player.data.autoplayHistory.includes(titleLower) &&
                                    t.identifier !== previousTrack.identifier;
                            });

                            if (availableTracks.length > 0) {
                                nextTrack = availableTracks[0];
                                console.log(`[Autoplay] Similar encontró: ${nextTrack.title}`);
                            }
                        }
                    } catch (e) {
                        console.warn(`[Autoplay] Similar search falló: ${e.message}`);
                    }
                }

                // === REPRODUCIR ===
                if (nextTrack) {
                    // Agregar al historial
                    player.data.autoplayHistory.push(nextTrack.title.toLowerCase());

                    player.queue.add(nextTrack);
                    player.play();

                    const embed = new EmbedBuilder()
                        .setColor(SPOTIFY_COLOR)
                        .setAuthor({
                            name: "♾️ Autoplay — Spotify",
                            iconURL: 'https://i.imgur.com/qvdqySa.png'
                        })
                        .setDescription(`🎵 **${nextTrack.title}**\n👤 ${nextTrack.author || 'Desconocido'}`)
                        .setThumbnail(nextTrack.artworkUrl || nextTrack.thumbnail || null)
                        .setFooter({ text: `Canción popular de ${artist || 'artista'} • Autoplay` })
                        .setTimestamp();

                    channel.send({ embeds: [embed] }).catch(() => { });
                    console.log(`[Autoplay] ▶ Reproduciendo: ${nextTrack.title} - ${nextTrack.author}`);
                    return;
                }

                console.log(`[Autoplay] No se encontraron más canciones para recomendar`);

            } catch (error) {
                console.error(`[Autoplay] Error: ${error.message}`);
            }
        }

        // Si llegamos aquí, no hubo autoplay o falló
        const embed = new EmbedBuilder()
            .setColor(client.config.colors.warning || 0xFFA500)
            .setAuthor({ name: "Cola Finalizada", iconURL: client.user.displayAvatarURL() })
            .setDescription(`${client.config.emojis.music || '🎵'} La cola de reproducción ha terminado.`)
            .setFooter({ text: "Desconectando en 5 minutos si no hay actividad..." })
            .setTimestamp();

        channel.send({ embeds: [embed] }).catch(() => { });

        // Limpiar timeout anterior si existe
        if (player.disconnectTimeout) clearTimeout(player.disconnectTimeout);

        // Timeout de 5 minutos
        player.disconnectTimeout = setTimeout(() => {
            if (player && player.state !== 'DESTROYED' && player.queue.size === 0 && !player.playing) {
                player.destroy();
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(client.config.colors.error || 0xFF0000)
                    .setDescription("💤 **Desconectado por inactividad.**");
                channel.send({ embeds: [timeoutEmbed] }).catch(() => { });
            }
        }, 5 * 60 * 1000);
    }
};
