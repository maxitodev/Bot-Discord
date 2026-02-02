const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("⏹️ Detiene la reproducción y limpia la cola"),

    async execute(interaction, client) {
        const { member, guild } = interaction;
        const player = client.manager.players.get(guild.id);

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
        if (!player) {
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

        // Stop and destroy the player
        await player.destroy();

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.success)
            .setDescription(`${client.config.emojis.stop} Reproducción detenida y cola limpiada.`)
            .setFooter({ text: `Detenido por ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
