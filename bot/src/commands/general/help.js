const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("📚 Muestra la lista de comandos disponibles"),

    async execute(interaction, client) {
        // Safe color access
        const color = (client.config && client.config.colors && client.config.colors.main)
            ? client.config.colors.main
            : 0x0099ff;

        const musicCommands = [
            { name: "/play", description: "Reproduce una canción o playlist" },
            { name: "/stop", description: "Detiene la música y limpia la cola" },
            { name: "/skip", description: "Salta la canción actual" },
            { name: "/skipto", description: "Salta a una canción específica en la cola" },
            { name: "/pause", description: "Pausa/Reanuda la reproducción" },
            { name: "/queue", description: "Muestra la cola de reproducción" },
            { name: "/volume", description: "Ajusta el volumen (0-150)" },
            { name: "/lyrics", description: "Muestra la letra de la canción" },
            { name: "/shuffle", description: "Mezcla la cola aleatoriamente" },
            { name: "/loop", description: "Cambia el modo de repetición" },
            { name: "/nowplaying", description: "Muestra la canción actual" }
        ];

        const memeCommands = [
            { name: "/meme", description: "Obtiene un meme aleatorio de Reddit" }
        ];

        const generalCommands = [
            { name: "/help", description: "Muestra este mensaje de ayuda" },
            { name: "/ping", description: "Muestra la latencia del bot" }
        ];

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle("🎵 Comandos del Bot")
            .setDescription("Aquí tienes la lista de comandos disponibles para todos los usuarios.")
            .addFields(
                {
                    name: "🎶 Música",
                    value: musicCommands.map(cmd => `**${cmd.name}** - ${cmd.description}`).join("\n")
                },
                {
                    name: "😂 Diversión",
                    value: memeCommands.map(cmd => `**${cmd.name}** - ${cmd.description}`).join("\n")
                },
                {
                    name: "ℹ️ General",
                    value: generalCommands.map(cmd => `**${cmd.name}** - ${cmd.description}`).join("\n")
                }
            )
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .setFooter({
                text: `Solicitado por ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
