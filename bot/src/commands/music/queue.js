const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { formatDuration, truncateText } = require("../../utils/formatDuration");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("📜 Muestra la cola de reproducción")
        .addIntegerOption(option =>
            option
                .setName("pagina")
                .setDescription("Número de página")
                .setMinValue(1)
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const { member, guild } = interaction;
        const player = client.manager.players.get(guild.id);
        const page = interaction.options.getInteger("pagina") || 1;

        // Check if there's an active player
        if (!player || !player.queue.current) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} No hay música reproduciéndose.`)
                ],
                ephemeral: true
            });
        }

        const queue = player.queue;
        const current = queue.current;
        const tracksPerPage = 10;
        const totalPages = Math.ceil(queue.length / tracksPerPage) || 1;

        if (page > totalPages) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} Solo hay ${totalPages} página(s) en la cola.`)
                ],
                ephemeral: true
            });
        }

        const start = (page - 1) * tracksPerPage;
        const end = start + tracksPerPage;
        const tracks = queue.slice(start, end);

        // Build queue list
        let queueList = "";
        if (tracks.length > 0) {
            queueList = tracks
                .map((track, index) => {
                    const position = start + index + 1;
                    const title = truncateText(track.title, 40);
                    const duration = track.isStream ? "🔴 LIVE" : formatDuration(track.length);
                    return `\`${position}.\` [${title}](${track.uri}) - \`${duration}\``;
                })
                .join("\n");
        } else {
            queueList = "*No hay más canciones en la cola*";
        }

        // Calculate total duration
        const totalDuration = queue.reduce((acc, track) => acc + (track.length || 0), 0) + (current.length || 0);

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.music)
            .setAuthor({ 
                name: `Cola de ${guild.name}`, 
                iconURL: guild.iconURL() 
            })
            .setDescription(
                `**${client.config.emojis.music} Reproduciendo ahora:**\n` +
                `[${truncateText(current.title, 50)}](${current.uri}) - \`${current.isStream ? "🔴 LIVE" : formatDuration(current.length)}\`\n` +
                `Solicitado por: ${current.requester ? `<@${current.requester.id}>` : "Desconocido"}\n\n` +
                `**${client.config.emojis.queue} Cola (${queue.length} canciones):**\n${queueList}`
            )
            .addFields(
                { 
                    name: "⏱️ Duración total", 
                    value: formatDuration(totalDuration), 
                    inline: true 
                },
                { 
                    name: "🔊 Volumen", 
                    value: `${Math.round(player.volume * 100)}%`, 
                    inline: true 
                },
                { 
                    name: "🔁 Loop", 
                    value: player.loop === "track" ? "Canción" : player.loop === "queue" ? "Cola" : "Desactivado", 
                    inline: true 
                }
            )
            .setFooter({ text: `Página ${page} de ${totalPages} • ${queue.length} canciones en cola` })
            .setTimestamp();

        // Create pagination buttons if needed
        if (totalPages > 1) {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("queue_first")
                        .setEmoji("⏮️")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 1),
                    new ButtonBuilder()
                        .setCustomId("queue_prev")
                        .setEmoji("◀️")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === 1),
                    new ButtonBuilder()
                        .setCustomId("queue_page")
                        .setLabel(`${page}/${totalPages}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId("queue_next")
                        .setEmoji("▶️")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(page === totalPages),
                    new ButtonBuilder()
                        .setCustomId("queue_last")
                        .setEmoji("⏭️")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === totalPages)
                );

            return interaction.reply({ embeds: [embed], components: [row] });
        }

        return interaction.reply({ embeds: [embed] });
    }
};
