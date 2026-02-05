const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("minecraft")
        .setDescription("🎮 Configura las notificaciones del servidor de Minecraft")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName("setup")
                .setDescription("Configura el monitor de Minecraft")
                .addChannelOption(option =>
                    option
                        .setName("canal")
                        .setDescription("Canal donde se enviarán las notificaciones")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("ruta_log")
                        .setDescription("Ruta al archivo latest.log del servidor (ej: /home/minecraft/logs/latest.log)")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("eventos")
                .setDescription("Configura qué eventos se notificarán")
                .addBooleanOption(option =>
                    option
                        .setName("conexiones")
                        .setDescription("Notificar cuando jugadores se conecten/desconecten")
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option
                        .setName("muertes")
                        .setDescription("Notificar cuando jugadores mueran")
                        .setRequired(false)
                )
                .addBooleanOption(option =>
                    option
                        .setName("logros")
                        .setDescription("Notificar cuando jugadores consigan logros/avances")
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("toggle")
                .setDescription("Activa o desactiva el monitor de Minecraft")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("status")
                .setDescription("Muestra el estado actual de la configuración")
        ),

    async execute(interaction, client) {
        // Defer reply IMMEDIATELY to prevent timeout
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guild.id;

        switch (subcommand) {
            case 'setup':
                await handleSetup(interaction, client, guildId);
                break;
            case 'eventos':
                await handleEventos(interaction, client, guildId);
                break;
            case 'toggle':
                await handleToggle(interaction, client, guildId);
                break;
            case 'status':
                await handleStatus(interaction, client, guildId);
                break;
        }
    }
};

async function handleSetup(interaction, client, guildId) {
    const channel = interaction.options.getChannel("canal");
    const logPath = interaction.options.getString("ruta_log");

    // Verificar que el canal sea de texto
    if (!channel.isTextBased()) {
        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription("❌ El canal debe ser un canal de texto.")
            ]
        });
    }

    // Verificar que el archivo existe (solo en producción, en desarrollo puede no existir aún)
    if (!fs.existsSync(logPath)) {
        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setTitle("⚠️ Advertencia")
                    .setDescription(
                        `El archivo de log no se encontró en:\n\`${logPath}\`\n\n` +
                        `**Asegúrate de que:**\n` +
                        `• La ruta sea correcta\n` +
                        `• El bot tenga permisos de lectura\n` +
                        `• El servidor de Minecraft esté corriendo\n\n` +
                        `La configuración se guardará de todos modos.`
                    )
            ]
        });
    }

    // Guardar configuración
    const config = client.minecraftConfig.get(guildId) || {
        enabled: false,
        events: {
            join: true,
            leave: true,
            death: true,
            achievement: true,
            challenge: true,
            goal: true
        }
    };

    config.channelId = channel.id;
    config.logPath = logPath;
    config.enabled = true;

    client.minecraftConfig.set(guildId, config);

    // Guardar configuración
    client.saveMinecraftConfig();

    // Iniciar monitor
    client.minecraftMonitor.start(guildId);

    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle("✅ Monitor de Minecraft configurado")
        .setDescription(
            `**Canal:** ${channel}\n` +
            `**Ruta del log:** \`${logPath}\`\n` +
            `**Estado:** Activo 🟢\n\n` +
            `El bot ahora monitoreará el servidor de Minecraft y enviará notificaciones a ${channel}.`
        )
        .setFooter({ text: "Usa /minecraft eventos para configurar qué eventos notificar" });

    return interaction.editReply({ embeds: [embed] });
}

async function handleEventos(interaction, client, guildId) {
    const config = client.minecraftConfig.get(guildId);

    if (!config) {
        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription("❌ Primero debes configurar el monitor con `/minecraft setup`")
            ]
        });
    }

    const conexiones = interaction.options.getBoolean("conexiones");
    const muertes = interaction.options.getBoolean("muertes");
    const logros = interaction.options.getBoolean("logros");

    // Actualizar solo los eventos que se especificaron
    if (conexiones !== null) {
        config.events.join = conexiones;
        config.events.leave = conexiones;
    }
    if (muertes !== null) {
        config.events.death = muertes;
    }
    if (logros !== null) {
        config.events.achievement = logros;
        config.events.challenge = logros;
        config.events.goal = logros;
    }

    client.minecraftConfig.set(guildId, config);

    // Guardar configuración
    client.saveMinecraftConfig();

    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle("✅ Eventos actualizados")
        .setDescription(
            `**Conexiones/Desconexiones:** ${config.events.join ? '✅ Activado' : '❌ Desactivado'}\n` +
            `**Muertes:** ${config.events.death ? '✅ Activado' : '❌ Desactivado'}\n` +
            `**Logros/Avances:** ${config.events.achievement ? '✅ Activado' : '❌ Desactivado'}`
        );

    return interaction.editReply({ embeds: [embed] });
}

async function handleToggle(interaction, client, guildId) {
    const config = client.minecraftConfig.get(guildId);

    if (!config) {
        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setDescription("❌ Primero debes configurar el monitor con `/minecraft setup`")
            ]
        });
    }

    config.enabled = !config.enabled;
    client.minecraftConfig.set(guildId, config);

    // Guardar configuración
    client.saveMinecraftConfig();

    if (config.enabled) {
        client.minecraftMonitor.start(guildId);
    } else {
        client.minecraftMonitor.stop(guildId);
    }

    const embed = new EmbedBuilder()
        .setColor(config.enabled ? 0x00FF00 : 0xFF0000)
        .setTitle(config.enabled ? "✅ Monitor activado" : "❌ Monitor desactivado")
        .setDescription(
            config.enabled
                ? "El bot ahora monitoreará el servidor de Minecraft."
                : "El bot ha dejado de monitorear el servidor de Minecraft."
        );

    return interaction.editReply({ embeds: [embed] });
}

async function handleStatus(interaction, client, guildId) {
    const config = client.minecraftConfig.get(guildId);

    if (!config) {
        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setTitle("⚠️ Monitor no configurado")
                    .setDescription("Usa `/minecraft setup` para configurar el monitor de Minecraft.")
            ]
        });
    }

    const channel = interaction.guild.channels.cache.get(config.channelId);
    const logExists = fs.existsSync(config.logPath);

    const embed = new EmbedBuilder()
        .setColor(config.enabled ? 0x00FF00 : 0xFF0000)
        .setTitle("🎮 Estado del Monitor de Minecraft")
        .addFields(
            { name: "Estado", value: config.enabled ? "🟢 Activo" : "🔴 Inactivo", inline: true },
            { name: "Canal", value: channel ? channel.toString() : "❌ No encontrado", inline: true },
            { name: "Archivo de log", value: logExists ? "✅ Encontrado" : "❌ No encontrado", inline: false },
            { name: "Ruta", value: `\`${config.logPath}\``, inline: false },
            {
                name: "Eventos configurados",
                value:
                    `• Conexiones: ${config.events.join ? '✅' : '❌'}\n` +
                    `• Muertes: ${config.events.death ? '✅' : '❌'}\n` +
                    `• Logros: ${config.events.achievement ? '✅' : '❌'}`,
                inline: false
            }
        )
        .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
}
