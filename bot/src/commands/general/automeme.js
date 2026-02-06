const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("automeme")
        .setDescription("⚙️ Configura la publicación automática de memes")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName("setup")
                .setDescription("Configura el canal y frecuencia de memes automáticos")
                .addChannelOption(option =>
                    option
                        .setName("canal")
                        .setDescription("Canal donde se publicarán los memes")
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
                .addStringOption(option =>
                    option
                        .setName("intervalo")
                        .setDescription("Frecuencia de publicación")
                        .setRequired(true)
                        .addChoices(
                            { name: "30 Minutos", value: "30m" },
                            { name: "1 Hora", value: "1h" },
                            { name: "2 Horas", value: "2h" },
                            { name: "6 Horas", value: "6h" },
                            { name: "12 Horas", value: "12h" },
                            { name: "24 Horas (1 Día)", value: "24h" }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName("categoria")
                        .setDescription("Categoría de memes a publicar")
                        .setRequired(false)
                        .addChoices(
                            { name: "🎭 Memes Generales", value: "memes" },
                            { name: "😂 Dank Memes", value: "dankmemes" },
                            { name: "🎮 Gaming", value: "gaming" },
                            { name: "📱 Tecnología", value: "ProgrammerHumor" },
                            { name: "🐶 Animales", value: "aww" },
                            { name: "🌎 Español", value: "MAAU" }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("stop")
                .setDescription("Detiene la publicación automática de memes")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("status")
                .setDescription("Muestra el estado de la configuración actual")
        ),

    async execute(interaction, client) {
        try {
            const subcommand = interaction.options.getSubcommand();

            // Safe color access
            const color = (client.config && client.config.colors && client.config.colors.main)
                ? client.config.colors.main
                : 0xFF4500;

            if (subcommand === "setup") {
                const canal = interaction.options.getChannel("canal");
                const intervaloStr = interaction.options.getString("intervalo");
                const categoria = interaction.options.getString("categoria") || "memes";

                // Verificar permisos del bot en el canal
                const permissions = canal.permissionsFor(client.user);
                if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.EmbedLinks)) {
                    return interaction.reply({
                        content: "❌ No tengo permisos para enviar mensajes o embeds en ese canal.",
                        ephemeral: true
                    });
                }

                // Convertir intervalo a ms
                const msMap = {
                    '30m': 30 * 60 * 1000,
                    '1h': 60 * 60 * 1000,
                    '2h': 2 * 60 * 60 * 1000,
                    '6h': 6 * 60 * 60 * 1000,
                    '12h': 12 * 60 * 60 * 1000,
                    '24h': 24 * 60 * 60 * 1000
                };

                // Fallback para backward compatibility o valores custom si se permitieran en el futuro
                let intervalMs = msMap[intervaloStr] || 30 * 60 * 1000;

                // Guardar configuración
                if (!client.autoMemeConfig) {
                    client.autoMemeConfig = new Map();
                }

                client.autoMemeConfig.set(interaction.guildId, {
                    channelId: canal.id,
                    interval: intervalMs,
                    intervalLabel: intervaloStr,
                    category: categoria,
                    enabled: true
                });

                // Iniciar el sistema de auto-memes
                if (client.startAutoMeme) {
                    client.startAutoMeme(interaction.guildId);
                }

                // Guardar configuración
                client.saveAutoMemeConfig();

                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle("✅ Auto-Memes Configurado")
                    .setDescription("El sistema de publicación automática ha sido configurado correctamente.")
                    .addFields(
                        { name: "📍 Canal", value: `${canal}`, inline: true },
                        { name: "⏱️ Frecuencia", value: intervaloStr, inline: true },
                        { name: "🎭 Categoría", value: categoria, inline: true }
                    )
                    .setFooter({ text: `Configurado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });

            } else if (subcommand === "stop") {
                if (!client.autoMemeConfig || !client.autoMemeConfig.has(interaction.guildId)) {
                    return interaction.reply({
                        content: "❌ No hay ninguna configuración de auto-memes activa en este servidor.",
                        ephemeral: true
                    });
                }

                // Detener el sistema
                if (client.stopAutoMeme) {
                    client.stopAutoMeme(interaction.guildId);
                }

                client.autoMemeConfig.delete(interaction.guildId);

                // Guardar configuración
                client.saveAutoMemeConfig();

                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle("🛑 Auto-Memes Detenido")
                    .setDescription("La publicación automática de memes ha sido detenida.")
                    .setFooter({ text: `Detenido por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });

            } else if (subcommand === "status") {
                if (!client.autoMemeConfig || !client.autoMemeConfig.has(interaction.guildId)) {
                    return interaction.reply({
                        content: "ℹ️ No hay ninguna configuración de auto-memes activa en este servidor.\nUsa `/automeme setup` para configurarlo.",
                        ephemeral: true
                    });
                }

                const config = client.autoMemeConfig.get(interaction.guildId);
                const canal = interaction.guild.channels.cache.get(config.channelId);

                // Calcular label si no existe (backward compatibility)
                let freqLabel = config.intervalLabel;
                if (!freqLabel) {
                    const mins = config.interval / 60000;
                    freqLabel = mins >= 60 ? `${(mins / 60).toFixed(1)}h` : `${mins}m`;
                }

                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle("📊 Estado de Auto-Memes")
                    .addFields(
                        { name: "📍 Canal", value: canal ? `${canal}` : "❌ Canal no encontrado", inline: true },
                        { name: "⏱️ Frecuencia", value: freqLabel, inline: true },
                        { name: "🎭 Categoría", value: config.category, inline: true },
                        { name: "🟢 Estado", value: config.enabled ? "Activo" : "Inactivo", inline: true }
                    )
                    .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            }

        } catch (error) {
            console.error("Error en automeme command:", error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "❌ Ocurrió un error al ejecutar el comando.",
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: "❌ Ocurrió un error al ejecutar el comando."
                });
            }
        }
    }
};
