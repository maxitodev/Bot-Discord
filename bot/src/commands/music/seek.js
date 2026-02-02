const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { formatDuration } = require("../../utils/formatDuration");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("seek")
        .setDescription("⏩ Salta a un punto específico de la canción")
        .addStringOption(option =>
            option
                .setName("tiempo")
                .setDescription("Tiempo al que saltar (ej: 1:30, 90, 2:15:30)")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const { member, guild } = interaction;
        const player = client.manager.players.get(guild.id);
        const timeInput = interaction.options.getString("tiempo");

        // Check if user is in a voice channel
        if (!member.voice.channel) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} Debes estar en un canal de voz.`)
                ],
                ephemeral: true
            });
        }

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

        // Check if user is in the same voice channel
        if (member.voice.channel.id !== player.voiceId) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} Debes estar en el mismo canal de voz que yo.`)
                ],
                ephemeral: true
            });
        }

        // Check if track is a stream
        if (player.queue.current.isStream) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} No puedes hacer seek en un stream en vivo.`)
                ],
                ephemeral: true
            });
        }

        // Parse time input
        const position = parseTime(timeInput);
        
        if (position === null) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} Formato de tiempo inválido. Usa: \`1:30\`, \`90\` (segundos), o \`1:23:45\``)
                ],
                ephemeral: true
            });
        }

        // Check if position is within track duration
        if (position > player.queue.current.length) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} El tiempo especificado excede la duración de la canción (${formatDuration(player.queue.current.length)}).`)
                ],
                ephemeral: true
            });
        }

        await player.shoukaku.seekTo(position);

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.success)
            .setDescription(`⏩ Saltando a **${formatDuration(position)}** / ${formatDuration(player.queue.current.length)}`)
            .setFooter({ text: `Solicitado por ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};

/**
 * Parse time string to milliseconds
 * Supports: "90" (seconds), "1:30" (mm:ss), "1:23:45" (hh:mm:ss)
 */
function parseTime(input) {
    // Remove spaces
    input = input.trim();

    // If it's just a number, treat as seconds
    if (/^\d+$/.test(input)) {
        return parseInt(input) * 1000;
    }

    // Split by colon
    const parts = input.split(":").map(p => parseInt(p));

    // Check if all parts are valid numbers
    if (parts.some(isNaN)) return null;

    if (parts.length === 2) {
        // mm:ss
        const [minutes, seconds] = parts;
        if (seconds >= 60) return null;
        return (minutes * 60 + seconds) * 1000;
    } else if (parts.length === 3) {
        // hh:mm:ss
        const [hours, minutes, seconds] = parts;
        if (minutes >= 60 || seconds >= 60) return null;
        return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }

    return null;
}
