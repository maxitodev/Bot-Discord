const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gta")
        .setDescription("🔫 Configura el Radar de GTA V")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName("setup")
                .setDescription("Configura el canal para avisos de GTA V")
                .addChannelOption(option =>
                    option
                        .setName("canal")
                        .setDescription("Canal donde se avisará cuando alguien juegue")
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("disable")
                .setDescription("Desactiva el radar de GTA V")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("status")
                .setDescription("Muestra el estado del radar")
        ),

    async execute(interaction, client) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        // Inicializar config si no existe
        if (!client.gtaConfig) {
            client.gtaConfig = new Map();
        }

        if (subcommand === "setup") {
            const channel = interaction.options.getChannel("canal");

            // Verificar permisos
            const permissions = channel.permissionsFor(client.user);
            if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.EmbedLinks)) {
                return interaction.editReply("❌ No tengo permisos para enviar mensajes en ese canal.");
            }

            const config = {
                enabled: true,
                channelId: channel.id
            };

            client.gtaConfig.set(guildId, config);
            client.saveGtaConfig();

            const embed = new EmbedBuilder()
                .setColor(0x3AB136) // Verde GTA
                .setTitle("🔫 Radar de GTA V Activado")
                .setDescription(`Ahora avisaré en ${channel} cuando alguien entre a Los Santos.`)
                .setImage('https://media.tenor.com/2Xy3Kz2X1pAAAAAM/gta-wasted.gif')
                .setFooter({ text: "¡Cuidado con la chota!", iconURL: interaction.user.displayAvatarURL() });

            return interaction.editReply({ embeds: [embed] });

        } else if (subcommand === "disable") {
            if (!client.gtaConfig.has(guildId)) {
                return interaction.editReply("❌ El radar ya estaba desactivado.");
            }

            client.gtaConfig.delete(guildId);
            client.saveGtaConfig();

            return interaction.editReply("🛑 Radar de GTA V desactivado. Ya pueden jugar en secreto.");

        } else if (subcommand === "status") {
            const config = client.gtaConfig.get(guildId);

            if (!config) {
                return interaction.editReply("❌ El radar no está configurado.");
            }

            const channel = interaction.guild.channels.cache.get(config.channelId);

            const embed = new EmbedBuilder()
                .setColor(0x3AB136)
                .setTitle("📡 Estado del Radar GTA V")
                .addFields(
                    { name: "Estado", value: "✅ Activo", inline: true },
                    { name: "Canal", value: channel ? `${channel}` : "Desconocido", inline: true }
                );

            return interaction.editReply({ embeds: [embed] });
        }
    }
};
