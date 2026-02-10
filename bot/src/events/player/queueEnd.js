const { EmbedBuilder } = require("discord.js");

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

        // --- LÓGICA DE AUTOPLAY ---
        // Verificar si autoplay está activado en la metadata del player (o por defecto false)
        const isAutoplayEnabled = player.data?.autoplay === true; // Default false

        // Intentar Autoplay solo si hay una canción previa
        if (isAutoplayEnabled && player.queue.previous) {
            try {
                // Kazagumo guarda previous como un array, obtenemos el último
                let previousTrack = player.queue.previous;
                if (Array.isArray(previousTrack)) {
                    previousTrack = previousTrack[previousTrack.length - 1];
                }

                if (!previousTrack) return;

                console.log(`[Autoplay] Buscando recomendaciones para: ${previousTrack.title}`);

                // Usamos la búsqueda de relación/mix de youtube
                let query;
                const isYoutube = previousTrack.sourceName === 'youtube';

                if (isYoutube && previousTrack.identifier) {
                    // Mix basado en ID
                    query = `https://www.youtube.com/watch?v=${previousTrack.identifier}&list=RD${previousTrack.identifier}`;
                } else {
                    // Búsqueda relacionada por texto
                    query = `ytsearch:${previousTrack.title} ${previousTrack.author}`;
                }

                // Realizamos la búsqueda como el usuario (client.user)
                const res = await client.manager.search(query, { requester: client.user });

                if (res && res.tracks && res.tracks.length > 0) {
                    // Filtramos para NO repetir la misma canción inmediatamente
                    let nextTrack = res.tracks.find(t => t.identifier !== previousTrack.identifier && t.title !== previousTrack.title);

                    // Si no encontramos distinta (o era la única), tomamos la segunda o al azar
                    if (!nextTrack && res.tracks.length > 1) {
                        nextTrack = res.tracks[1];
                    } else if (!nextTrack) {
                        nextTrack = res.tracks[0];
                    }

                    if (nextTrack) {
                        player.queue.add(nextTrack);
                        player.play();

                        const embed = new EmbedBuilder()
                            .setColor(client.config.colors.music || 0xFF0000)
                            .setAuthor({ name: "Autoplay: Reproducción Automática", iconURL: client.user.displayAvatarURL() })
                            .setDescription(`🎵 **Reproduciendo sugerencia:** [${nextTrack.title}](${nextTrack.uri})`)
                            .setFooter({ text: "Agregado automáticamente por el sistema de Autoplay" });

                        channel.send({ embeds: [embed] }).catch(() => { });
                        console.log(`[Autoplay] Reproduciendo: ${nextTrack.title}`);

                        // IMPORTANTE: Salimos aquí para NO ejecutar la lógica de desconexión
                        return;
                    }
                }
            } catch (error) {
                console.error(`[Autoplay] Error al buscar canción relacionada: ${error.message}`);
            }
        }
        // -------------------------

        // Si llegamos aquí, es porque no hubo autoplay o falló.
        // Mensaje de cola terminada y lógica de desconexión normal.

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
