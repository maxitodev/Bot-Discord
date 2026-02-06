const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("news")
        .setDescription("📰 Configura el sistema de noticias automáticas")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName("subscribe")
                .setDescription("Suscribe un canal a una categoría de noticias")
                .addStringOption(option =>
                    option
                        .setName("categoria")
                        .setDescription("Categoría de noticias")
                        .setRequired(true)
                        .addChoices(
                            { name: "🇲🇽 Noticias México", value: "mexico" },
                            { name: "🤖 Inteligencia Artificial", value: "ai" },
                            { name: "📱 Tecnología General", value: "tech" },
                            { name: "🎮 Videojuegos", value: "gaming" }
                        )
                )
                .addChannelOption(option =>
                    option
                        .setName("canal")
                        .setDescription("Canal donde se publicarán las noticias")
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
                .addStringOption(option =>
                    option
                        .setName("intervalo")
                        .setDescription("Frecuencia de actualización (Default: 30 min)")
                        .addChoices(
                            { name: "30 Minutos", value: "30m" },
                            { name: "1 Hora", value: "1h" },
                            { name: "2 Horas", value: "2h" },
                            { name: "6 Horas", value: "6h" },
                            { name: "12 Horas", value: "12h" },
                            { name: "24 Horas (1 Día)", value: "24h" },
                            { name: "48 Horas (2 Días)", value: "48h" }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("unsubscribe")
                .setDescription("Cancela la suscripción a noticias en este servidor")
                .addStringOption(option =>
                    option
                        .setName("categoria")
                        .setDescription("Categoría a cancelar (opcional, si no se especifica se cancelan todas)")
                        .addChoices(
                            { name: "🇲🇽 Noticias México", value: "mexico" },
                            { name: "🤖 Inteligencia Artificial", value: "ai" },
                            { name: "📱 Tecnología General", value: "tech" },
                            { name: "🎮 Videojuegos", value: "gaming" }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("status")
                .setDescription("Verifica el estado de las noticias")
        ),

    async execute(interaction, client) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        // Cargar suscripciones
        if (!client.newsSubscriptions) {
            client.newsSubscriptions = client.configManager.load('news_subs') || new Map();
        }

        if (subcommand === "subscribe") {
            const category = interaction.options.getString("categoria");
            const channel = interaction.options.getChannel("canal");
            const intervalStr = interaction.options.getString("intervalo") || "30m";

            // Convertir intervalo a ms
            const msMap = {
                '30m': 30 * 60 * 1000,
                '1h': 60 * 60 * 1000,
                '2h': 2 * 60 * 60 * 1000,
                '6h': 6 * 60 * 60 * 1000,
                '12h': 12 * 60 * 60 * 1000,
                '24h': 24 * 60 * 60 * 1000,
                '48h': 48 * 60 * 60 * 1000
            };
            const interval = msMap[intervalStr];

            // Verificar permisos
            const permissions = channel.permissionsFor(client.user);
            if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.EmbedLinks)) {
                return interaction.editReply(`❌ No tengo permisos para publicar en ${channel}.`);
            }

            const newConfig = {
                id: `${guildId}-${category}`, // ID único
                enabled: true,
                channelId: channel.id,
                category: category,
                interval: interval,
                intervalLabel: intervalStr,
                lastCheck: 0,
                addedBy: interaction.user.id,
                date: Date.now()
            };

            // Obtener suscripciones existentes del servidor
            let guildSubs = client.newsSubscriptions.get(guildId);
            if (!Array.isArray(guildSubs)) {
                // Migración de formato antiguo si era objeto
                guildSubs = [];
            }

            // Eliminar suscripción previa de la misma categoría si existe
            guildSubs = guildSubs.filter(sub => sub.category !== category);

            // Agregar nueva
            guildSubs.push(newConfig);

            client.newsSubscriptions.set(guildId, guildSubs);
            client.configManager.save('news_subs', client.newsSubscriptions);

            // Trigger manual del fetch para probar
            if (client.newsSystem) {
                // Forzar chequeo en breve
                setTimeout(() => client.newsSystem.checkFeeds(), 1000);
            }

            const categoryNames = {
                'mexico': 'Noticias México 🇲🇽',
                'ai': 'Inteligencia Artificial 🤖',
                'tech': 'Tecnología 📱',
                'gaming': 'Videojuegos 🎮'
            };

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle("📰 Suscripción Exitosa")
                .setDescription(`Ahora llegarán las noticias de **${categoryNames[category]}** al canal ${channel}.`)
                .addFields({ name: "Frecuencia", value: intervalStr, inline: true })
                .setFooter({ text: "Las noticias se revisan automáticamente." });

            return interaction.editReply({ embeds: [embed] });

        } else if (subcommand === "unsubscribe") {
            const category = interaction.options.getString("categoria");

            if (!client.newsSubscriptions.has(guildId)) {
                return interaction.editReply("❌ Este servidor no tiene suscripciones de noticias activas.");
            }

            let guildSubs = client.newsSubscriptions.get(guildId);
            if (!Array.isArray(guildSubs)) guildSubs = [];

            if (category) {
                const initialLength = guildSubs.length;
                guildSubs = guildSubs.filter(sub => sub.category !== category);

                if (guildSubs.length === initialLength) {
                    return interaction.editReply(`ℹ️ No se encontró suscripción para la categoría **${category}**.`);
                }

                if (guildSubs.length === 0) {
                    client.newsSubscriptions.delete(guildId);
                } else {
                    client.newsSubscriptions.set(guildId, guildSubs);
                }

                client.configManager.save('news_subs', client.newsSubscriptions);
                return interaction.editReply(`✅ Suscripción a **${category}** cancelada.`);
            } else {
                client.newsSubscriptions.delete(guildId);
                client.configManager.save('news_subs', client.newsSubscriptions);
                return interaction.editReply("✅ Todas las suscripciones han sido canceladas.");
            }

        } else if (subcommand === "status") {
            const guildSubs = client.newsSubscriptions.get(guildId);

            if (!guildSubs || !Array.isArray(guildSubs) || guildSubs.length === 0) {
                return interaction.editReply("ℹ️ No hay noticias configuradas en este servidor.");
            }

            const categoryNames = {
                'mexico': 'Noticias México 🇲🇽',
                'ai': 'Inteligencia Artificial 🤖',
                'tech': 'Tecnología 📱',
                'gaming': 'Videojuegos 🎮'
            };

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle("📰 Estado de Noticias Activas");

            guildSubs.forEach(config => {
                const channel = interaction.guild.channels.cache.get(config.channelId);
                embed.addFields({
                    name: `${categoryNames[config.category] || config.category}`,
                    value: `📝 **Canal:** ${channel ? channel : "#desconocido"}\n⏱️ **Frecuencia:** ${config.intervalLabel || '30m'}\n✅ **Activo**`,
                    inline: false
                });
            });

            return interaction.editReply({ embeds: [embed] });
        }
    }
};
