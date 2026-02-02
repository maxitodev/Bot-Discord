const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("🏓 Muestra la latencia del bot"),

    async execute(interaction, client) {
        const sent = await interaction.deferReply({ fetchReply: true });
        
        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const websocket = client.ws.ping;
        
        // Get Lavalink node info
        const node = client.manager.nodes.first();
        const nodeStats = node?.stats;

        let nodeInfo = "No conectado";
        if (nodeStats) {
            nodeInfo = `${nodeStats.players} reproductores activos`;
        }

        const getLatencyEmoji = (ms) => {
            if (ms < 100) return "🟢";
            if (ms < 200) return "🟡";
            return "🔴";
        };

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.main)
            .setTitle("🏓 Pong!")
            .addFields(
                { 
                    name: "📡 Latencia de Mensaje", 
                    value: `${getLatencyEmoji(roundtrip)} \`${roundtrip}ms\``, 
                    inline: true 
                },
                { 
                    name: "💓 Latencia de API", 
                    value: `${getLatencyEmoji(websocket)} \`${websocket}ms\``, 
                    inline: true 
                },
                { 
                    name: "🎵 Lavalink", 
                    value: `🟢 ${nodeInfo}`, 
                    inline: true 
                }
            )
            .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
