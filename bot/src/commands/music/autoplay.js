const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("autoplay")
        .setDescription("♾️ Activa o desactiva el autoplay (activado por defecto)"),

    async execute(interaction, client) {
        const { member, guild } = interaction;
        const player = client.manager.players.get(guild.id);

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

        if (!member.voice.channel || member.voice.channel.id !== player.voiceId) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} Debes estar en el mismo canal de voz que el bot.`)
                ],
                ephemeral: true
            });
        }

        // Toggle autoplay
        player.autoplay = !player.autoplay;

        const embed = new EmbedBuilder()
            .setColor(player.autoplay ? client.config.colors.success : client.config.colors.error)
            .setTitle(player.autoplay ? "♾️ Autoplay Activado" : "♾️ Autoplay Desactivado")
            .setDescription(player.autoplay
                ? "El bot reproducirá automáticamente canciones recomendadas al terminar la cola."
                : "El bot se detendrá al terminar la cola de reproducción.")
            .setFooter({ text: `Solicitado por ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
