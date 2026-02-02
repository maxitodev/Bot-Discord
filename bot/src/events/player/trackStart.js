const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { formatDuration } = require("../../utils/formatDuration");

module.exports = {
    name: "playerStart",
    async execute(player, track, client) {
        const channel = client.channels.cache.get(player.textId);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.music)
            .setTitle(`🎶 ${track.title}`)
            .setURL(track.uri)
            .setThumbnail(track.thumbnail || null)
            .addFields(
                {
                    name: "👤 Artista",
                    value: `\`${track.author || "Desconocido"}\``,
                    inline: true
                },
                {
                    name: "⏱️ Duración",
                    value: `\`${track.isStream ? "🔴 En vivo" : formatDuration(track.length)}\``,
                    inline: true
                },
                {
                    name: "🎧 Pedido por",
                    value: track.requester ? `<@${track.requester.id}>` : "Sistema",
                    inline: true
                }
            )
            .setFooter({
                text: `🔊 Vol: ${player.volume}% • Cola: ${player.queue.length} canciones`
            })
            .setTimestamp();

        // Fila 1: Controles de Reproducción (Flujo Lógico)
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("music_previous")
                    .setEmoji("⏮️")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("music_pause")
                    .setEmoji("⏯️") // Play/Pause toggle emoji
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("music_skip")
                    .setEmoji("⏭️")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("music_loop")
                    .setEmoji("🔁")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("music_shuffle")
                    .setEmoji("🔀")
                    .setStyle(ButtonStyle.Secondary)
            );

        // Fila 2: Gestión y Stop
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("music_stop")
                    .setEmoji("⏹️")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId("music_queue")
                    .setLabel("Ver Cola")
                    .setEmoji("📜")
                    .setStyle(ButtonStyle.Primary)
            );

        try {
            const message = await channel.send({ embeds: [embed], components: [row1, row2] });
            player.nowPlayingMessage = message;
        } catch (error) {
            console.error("Error al enviar mensaje de trackStart:", error);
        }
    }
};
