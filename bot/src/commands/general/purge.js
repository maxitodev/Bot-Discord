const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("purge")
        .setDescription("🧹 Elimina mensajes del canal actual")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(option =>
            option
                .setName("cantidad")
                .setDescription("Número de mensajes a eliminar (máx 100)")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addUserOption(option =>
            option
                .setName("usuario")
                .setDescription("Eliminar solo mensajes de este usuario (opcional)")
                .setRequired(false)
        ),

    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });

        const amount = interaction.options.getInteger("cantidad");
        const targetUser = interaction.options.getUser("usuario");
        const channel = interaction.channel;

        // Validar permisos del bot
        if (!channel.permissionsFor(client.user).has(PermissionFlagsBits.ManageMessages)) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription("❌ No tengo permisos para gestionar mensajes en este canal.");
            return interaction.editReply({ embeds: [errorEmbed] });
        }

        try {
            // Obtener mensajes
            const messages = await channel.messages.fetch({ limit: amount });
            let messagesToDelete = messages;

            // Filtrar por usuario si se especificó
            if (targetUser) {
                messagesToDelete = messages.filter(msg => msg.author.id === targetUser.id);
            }

            // Filtrar mensajes viejos (más de 14 días no se pueden borrar en bulk)
            const now = Date.now();
            const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);

            const validMessages = messagesToDelete.filter(msg => msg.createdTimestamp > fourteenDaysAgo);
            const oldMessages = messagesToDelete.size - validMessages.size;

            if (validMessages.size === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xFFA500)
                    .setDescription(targetUser
                        ? `⚠️ No encontré mensajes recientes de **${targetUser.tag}** para borrar.`
                        : "⚠️ No hay mensajes recientes para borrar (mayores a 14 días no se pueden borrar masivamente).");
                return interaction.editReply({ embeds: [embed] });
            }

            // Borrar mensajes
            await channel.bulkDelete(validMessages, true);

            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setDescription(targetUser
                    ? `🧹 Se eliminaron **${validMessages.size}** mensajes de **${targetUser.tag}**.`
                    : `🧹 Se eliminaron **${validMessages.size}** mensajes.`
                );

            if (oldMessages > 0) {
                successEmbed.setFooter({ text: `⚠️ ${oldMessages} mensajes eran demasiado viejos para borrarlos.` });
            }

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error("Error en purge:", error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setDescription("❌ Ocurrió un error al intentar borrar los mensajes.");
            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
};
