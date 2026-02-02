const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { truncateText } = require("../../utils/formatDuration");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("remove")
        .setDescription("🗑️ Elimina una canción de la cola")
        .addIntegerOption(option =>
            option
                .setName("posicion")
                .setDescription("Posición de la canción en la cola")
                .setMinValue(1)
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const { member, guild } = interaction;
        const player = client.manager.players.get(guild.id);
        const position = interaction.options.getInteger("posicion");

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

        // Check if position is valid
        if (position > player.queue.length) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} La posición especificada no existe. La cola tiene **${player.queue.length}** canciones.`)
                ],
                ephemeral: true
            });
        }

        const removedTrack = player.queue.remove(position - 1);

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.success)
            .setDescription(`🗑️ Eliminado de la cola: **${truncateText(removedTrack.title, 50)}**`)
            .setFooter({ text: `Eliminado por ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
