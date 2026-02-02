const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("🏓 Muestra la latencia del bot"),

    async execute(interaction, client) {
        try {
            await interaction.deferReply();
            const sent = await interaction.fetchReply();

            const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
            const websocket = client.ws.ping;
            const totalLatency = roundtrip + websocket;

            const getLatencyEmoji = (ms) => {
                if (ms < 100) return "🟢";
                if (ms < 200) return "🟡";
                return "🔴";
            };

            // Safe color access
            const color = (client.config && client.config.colors && client.config.colors.main) ? client.config.colors.main : 0x00FF00;

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle("🏓 Pong!")
                .addFields(
                    {
                        name: "📡 Latencia Total",
                        value: `${getLatencyEmoji(totalLatency)} \`${totalLatency}ms\``,
                        inline: false
                    },
                    {
                        name: "📨 Mensaje",
                        value: `\`${roundtrip}ms\``,
                        inline: true
                    },
                    {
                        name: "💓 API",
                        value: `\`${websocket}ms\``,
                        inline: true
                    }
                )
                .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Error en ping command:", error);
            // Fallback response if everything fails
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: "🏓 Pong! (Error detallado en consola)", ephemeral: true });
            } else {
                await interaction.editReply({ content: "🏓 Pong! (Error detallado en consola)" });
            }
        }
    }
};
