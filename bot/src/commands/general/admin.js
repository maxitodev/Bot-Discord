const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("admin")
        .setDescription("🛡️ Muestra los comandos de administración y configuración")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction, client) {
        // Safe color access
        const color = (client.config && client.config.colors && client.config.colors.main)
            ? client.config.colors.main
            : 0xFFD700; // Gold for admins

        const minecraftCommands = [
            { name: "/minecraft setup", description: "Configura el monitor del servidor de Minecraft" },
            { name: "/minecraft eventos", description: "Configura qué eventos notificar (Muerte, Join, etc.)" },
            { name: "/minecraft toggle", description: "Activa/Desactiva el monitor" },
            { name: "/minecraft status", description: "Verifica el estado del monitor" }
        ];

        const gtaCommands = [
            { name: "/gta setup", description: "Configura e inicia el Radar de GTA V" },
            { name: "/gta disable", description: "Desactiva el radar" },
            { name: "/gta status", description: "Verifica si el radar está activo" }
        ];

        const moderationCommands = [
            { name: "/purge [cantidad]", description: "Elimina X cantidad de mensajes" },
            { name: "/purge [cantidad] [usuario]", description: "Elimina mensajes de un usuario específico" },
            { name: "/autoclean setup", description: "Configura borrado automático en un canal" },
            { name: "/autoclean disable", description: "Desactiva el auto-borrado" },
            { name: "/autoclean list", description: "Lista canales con limpieza activa" }
        ];

        const funConfigs = [
            { name: "/automeme setup", description: "Configura la publicación automática de memes" },
            { name: "/automeme stop", description: "Detiene la publicación automática" },
            { name: "/automeme status", description: "Estado/Configuración actual de memes" }
        ];

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle("🛡️ Panel de Administración")
            .setDescription("Panel de control para configurar los sistemas del bot.")
            .addFields(
                {
                    name: "🎮 Minecraft Monitor",
                    value: minecraftCommands.map(cmd => `**${cmd.name}**\n*${cmd.description}*`).join("\n")
                },
                {
                    name: "🔫 GTA V Radar",
                    value: gtaCommands.map(cmd => `**${cmd.name}**\n*${cmd.description}*`).join("\n")
                },
                {
                    name: "🧹 Limpieza y Moderación",
                    value: moderationCommands.map(cmd => `**${cmd.name}**\n*${cmd.description}*`).join("\n")
                },
                {
                    name: "😂 Configuración de Memes",
                    value: funConfigs.map(cmd => `**${cmd.name}**\n*${cmd.description}*`).join("\n")
                }
            )
            .setFooter({ text: "Solo visible para administradores", iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        // Responder como ephemeral para no ensuciar el chat y por privacidad
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
