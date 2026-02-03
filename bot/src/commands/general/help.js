const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("📚 Muestra la lista de comandos disponibles"),

    async execute(interaction, client) {
        const musicCommands = [
            { name: "/play", description: "Reproduce una canción o playlist" },
            { name: "/stop", description: "Detiene la música y limpia la cola" },
            { name: "/skip", description: "Salta a la siguiente canción" },
            { name: "/jump", description: "Salta a una canción específica de la cola" },
            { name: "/pause", description: "Pausa la reproducción" },
            { name: "/resume", description: "Reanuda la reproducción" },
            { name: "/queue", description: "Muestra la cola de reproducción" },
            { name: "/nowplaying", description: "Muestra la canción actual" },
            { name: "/volume", description: "Ajusta el volumen" },
            { name: "/loop", description: "Configura el modo de repetición" },
            { name: "/shuffle", description: "Mezcla la cola aleatoriamente" },
            { name: "/seek", description: "Salta a un punto de la canción" },
            { name: "/remove", description: "Elimina una canción de la cola" },
            { name: "/clear", description: "Limpia toda la cola" }
        ];

        const memeCommands = [
            { name: "/meme", description: "Obtiene un meme aleatorio de Reddit" },
            { name: "/automeme setup", description: "Configura publicación automática de memes" },
            { name: "/automeme stop", description: "Detiene la publicación automática" },
            { name: "/automeme status", description: "Muestra el estado de auto-memes" }
        ];

        const generalCommands = [
            { name: "/help", description: "Muestra este mensaje de ayuda" },
            { name: "/ping", description: "Muestra la latencia del bot" }
        ];

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.main)
            .setAuthor({
                name: `${client.user.username} - Centro de Ayuda`,
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription(
                `¡Hola! Soy un bot creado por MaxitoDev para reproducir música de alta calidad y entretenimiento.\n\n` +
                `**Prefijo:** Comandos Slash (/)\n` +
                `**Servidores:** ${client.guilds.cache.size}\n` +
                `**Comandos:** ${client.commands.size}`
            )
            .addFields(
                {
                    name: "🎵 Comandos de Música",
                    value: musicCommands.map(cmd => `\`${cmd.name}\` - ${cmd.description}`).join("\n"),
                    inline: false
                },
                {
                    name: "🎭 Comandos de Memes",
                    value: memeCommands.map(cmd => `\`${cmd.name}\` - ${cmd.description}`).join("\n"),
                    inline: false
                },
                {
                    name: "⚙️ Comandos Generales",
                    value: generalCommands.map(cmd => `\`${cmd.name}\` - ${cmd.description}`).join("\n"),
                    inline: false
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
