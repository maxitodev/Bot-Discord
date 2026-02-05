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
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("unsubscribe")
                .setDescription("Cancela la suscripción a noticias en este servidor")
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

            // Verificar permisos
            const permissions = channel.permissionsFor(client.user);
            if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.EmbedLinks)) {
                return interaction.editReply(`❌ No tengo permisos para publicar en ${channel}.`);
            }

            const config = {
                enabled: true,
                channelId: channel.id,
                category: category,
                addedBy: interaction.user.id,
                date: Date.now()
            };

            // Guardar (actualmente soporta 1 suscripción por servidor para simplificar, 
            // si quieren más se puede cambiar a array)
            // Para "Professional Enhanced", permitiremos sobrescribir la categoría.
            client.newsSubscriptions.set(guildId, config);
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
                .setFooter({ text: "Las noticias se revisan cada 30 minutos." });

            return interaction.editReply({ embeds: [embed] });

        } else if (subcommand === "unsubscribe") {
            if (!client.newsSubscriptions.has(guildId)) {
                return interaction.editReply("❌ Este servidor no tiene suscripciones de noticias activas.");
            }

            client.newsSubscriptions.delete(guildId);
            client.configManager.save('news_subs', client.newsSubscriptions);

            return interaction.editReply("✅ Suscripción cancelada. Ya no recibirás noticias.");

        } else if (subcommand === "status") {
            const config = client.newsSubscriptions.get(guildId);

            if (!config) {
                return interaction.editReply("ℹ️ No hay noticias configuradas en este servidor.");
            }

            const channel = interaction.guild.channels.cache.get(config.channelId);
            const categoryNames = {
                'mexico': 'Noticias México 🇲🇽',
                'ai': 'Inteligencia Artificial 🤖',
                'tech': 'Tecnología 📱',
                'gaming': 'Videojuegos 🎮'
            };

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle("📰 Estado de Noticias")
                .addFields(
                    { name: "Categoría", value: categoryNames[config.category] || config.category, inline: true },
                    { name: "Canal", value: channel ? `${channel}` : "Desconocido", inline: true },
                    { name: "Estado", value: "✅ Activo", inline: true }
                );

            return interaction.editReply({ embeds: [embed] });
        }
    }
};
