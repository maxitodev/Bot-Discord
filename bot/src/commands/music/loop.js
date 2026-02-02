const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("🔁 Configura el modo de repetición")
        .addStringOption(option =>
            option
                .setName("modo")
                .setDescription("Modo de repetición")
                .setRequired(true)
                .addChoices(
                    { name: "🔂 Canción - Repite la canción actual", value: "track" },
                    { name: "🔁 Cola - Repite toda la cola", value: "queue" },
                    { name: "❌ Desactivar - Sin repetición", value: "off" }
                )
        ),

    async execute(interaction, client) {
        const { member, guild } = interaction;
        const player = client.manager.players.get(guild.id);
        const mode = interaction.options.getString("modo");

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

        let description;
        let emoji;

        switch (mode) {
            case "track":
                player.setLoop("track");
                emoji = client.config.emojis.loopOne;
                description = "Repitiendo la **canción actual** en bucle.";
                break;
            case "queue":
                player.setLoop("queue");
                emoji = client.config.emojis.loop;
                description = "Repitiendo la **cola completa** en bucle.";
                break;
            case "off":
                player.setLoop("none");
                emoji = "❌";
                description = "Modo de repetición **desactivado**.";
                break;
        }

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.success)
            .setDescription(`${emoji} ${description}`)
            .setFooter({ text: `Configurado por ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
