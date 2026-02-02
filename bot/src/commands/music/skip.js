const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("⏭️ Salta a la siguiente canción")
        .addIntegerOption(option =>
            option
                .setName("cantidad")
                .setDescription("Número de canciones a saltar")
                .setMinValue(1)
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const { member, guild } = interaction;
        const player = client.manager.players.get(guild.id);
        const amount = interaction.options.getInteger("cantidad") || 1;

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

        const currentTrack = player.queue.current;

        // Skip multiple tracks if specified
        if (amount > 1 && player.queue.length >= amount - 1) {
            for (let i = 0; i < amount - 1; i++) {
                player.queue.remove(0);
            }
        }

        await player.skip();

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.success)
            .setDescription(`${client.config.emojis.skip} Saltando **${amount > 1 ? `${amount} canciones` : currentTrack.title}**`)
            .setFooter({ text: `Saltado por ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
