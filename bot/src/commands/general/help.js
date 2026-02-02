const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("📚 Muestra la lista de comandos disponibles"),

    async execute(interaction, client) {
        const musicCommands = [
            { name: "/play", description: "Reproduce una canción o playlist" },
            { name: "/stop", description: "Detiene la música y limpia la cola" },
            { name: "/skip", description: "Salta a la siguiente canción" },
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

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.main)
            .setAuthor({ 
                name: `${client.user.username} - Centro de Ayuda`, 
                iconURL: client.user.displayAvatarURL() 
            })
            .setDescription(
                `¡Hola! Soy un bot de música que usa **Lavalink** para reproducir música de alta calidad.\n\n` +
                `**Prefijo:** Comandos Slash (/)\n` +
                `**Servidores:** ${client.guilds.cache.size}\n` +
                `**Comandos:** ${client.commands.size}`
            )
            .addFields(
                {
                    name: "🎵 Comandos de Música",
                    value: musicCommands.map(cmd => `\`${cmd.name}\` - ${cmd.description}`).join("\n")
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
