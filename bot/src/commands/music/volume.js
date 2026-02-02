const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("volume")
        .setDescription("🔊 Ajusta el volumen de la reproducción")
        .addIntegerOption(option =>
            option
                .setName("porcentaje")
                .setDescription("Nivel de volumen (0-150)")
                .setMinValue(0)
                .setMaxValue(150)
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const { member, guild } = interaction;
        const player = client.manager.players.get(guild.id);
        const volume = interaction.options.getInteger("porcentaje");

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

        // If no volume specified, show current volume
        if (volume === null) {
            const currentVolume = player.volume;
            const volumeEmoji = currentVolume === 0 ? client.config.emojis.volumeMute : client.config.emojis.volume;
            const volumeBar = createVolumeBar(currentVolume);
            
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.music)
                        .setDescription(`${volumeEmoji} Volumen actual: **${currentVolume}%**\n${volumeBar}`)
                ]
            });
        }

        const oldVolume = player.volume;
        await player.setVolume(volume);

        const volumeEmoji = volume === 0 ? client.config.emojis.volumeMute : client.config.emojis.volume;
        const volumeBar = createVolumeBar(volume);

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.success)
            .setDescription(
                `${volumeEmoji} Volumen ajustado de **${oldVolume}%** a **${volume}%**\n${volumeBar}`
            )
            .setFooter({ text: `Ajustado por ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};

function createVolumeBar(volume) {
    const filled = Math.round(volume / 10);
    const empty = 15 - filled;
    return `${"▰".repeat(Math.min(filled, 15))}${"▱".repeat(Math.max(empty, 0))}`;
}
