const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

// Simple time parser function
function parseTime(input) {
    const unit = input.slice(-1);
    const value = parseInt(input.slice(0, -1));

    if (isNaN(value)) return null;

    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("autoclean")
        .setDescription("🧹 Configura el borrado automático de mensajes en un canal")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(subcommand =>
            subcommand
                .setName("setup")
                .setDescription("Activa el auto-borrado en un canal")
                .addChannelOption(option =>
                    option
                        .setName("canal")
                        .setDescription("El canal a limpiar automáticamente")
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
                .addStringOption(option =>
                    option
                        .setName("tiempo")
                        .setDescription("Edad máxima de los mensajes (ej: 1h, 30m, 24h)")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("disable")
                .setDescription("Desactiva el auto-borrado en un canal")
                .addChannelOption(option =>
                    option
                        .setName("canal")
                        .setDescription("El canal para desactivar")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("Lista los canales con auto-borrado activo")
        ),

    async execute(interaction, client) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        // Inicializar config
        if (!client.autoCleanConfig) {
            client.autoCleanConfig = new Map();
        }

        // Obtener config del servidor
        let guildConfig = client.autoCleanConfig.get(guildId) || [];

        if (subcommand === "setup") {
            const channel = interaction.options.getChannel("canal");
            const timeStr = interaction.options.getString("tiempo");
            const duration = parseTime(timeStr);

            if (!duration || duration < 60000) { // Mínimo 1 minuto
                return interaction.editReply("❌ Formato de tiempo inválido o muy corto. Usa formato como `30m`, `1h`, `24h` (Mínimo 1m).");
            }

            // Verificar permisos
            const permissions = channel.permissionsFor(client.user);
            if (!permissions.has(PermissionFlagsBits.ManageMessages) || !permissions.has(PermissionFlagsBits.ReadMessageHistory)) {
                return interaction.editReply(`❌ No tengo permisos para gestionar mensajes en ${channel}.`);
            }

            // Eliminar config anterior para este canal si existe
            guildConfig = guildConfig.filter(c => c.channelId !== channel.id);

            // Agregar nueva config
            guildConfig.push({
                channelId: channel.id,
                maxAge: duration,
                lastCheck: Date.now()
            });

            client.autoCleanConfig.set(guildId, guildConfig);
            client.saveAutoCleanConfig();

            // Iniciar o reiniciar el sistema si es necesario
            if (client.autoCleanSystem) client.autoCleanSystem.checkGuild(guildId);

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle("🧹 Auto-Limpieza Configurada")
                .setDescription(`Se ha activado la limpieza automática en ${channel}.`)
                .addFields(
                    { name: "Tiempo de vida", value: timeStr, inline: true },
                    { name: "Acción", value: "Borrar mensajes viejos automáticamente", inline: true }
                )
                .setFooter({ text: "Los mensajes se verificarán cada 5 minutos." });

            return interaction.editReply({ embeds: [embed] });

        } else if (subcommand === "disable") {
            const channel = interaction.options.getChannel("canal");

            const exists = guildConfig.some(c => c.channelId === channel.id);
            if (!exists) {
                return interaction.editReply(`❌ No hay auto-limpieza activa en ${channel}.`);
            }

            guildConfig = guildConfig.filter(c => c.channelId !== channel.id);

            if (guildConfig.length > 0) {
                client.autoCleanConfig.set(guildId, guildConfig);
            } else {
                client.autoCleanConfig.delete(guildId);
            }
            client.saveAutoCleanConfig();

            return interaction.editReply(`✅ Auto-limpieza desactivada en ${channel}.`);

        } else if (subcommand === "list") {
            if (guildConfig.length === 0) {
                return interaction.editReply("ℹ️ No hay canales configurados para auto-limpieza.");
            }

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle("🧹 Canales con Auto-Limpieza")
                .setDescription(guildConfig.map(c => {
                    const channel = interaction.guild.channels.cache.get(c.channelId);
                    const minutes = Math.floor(c.maxAge / 60000);
                    return `• ${channel ? channel : `#${c.channelId}`} - Borrar después de **${minutes} min**`;
                }).join("\n"));

            return interaction.editReply({ embeds: [embed] });
        }
    }
};
