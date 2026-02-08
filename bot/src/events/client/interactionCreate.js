const { EmbedBuilder, MessageFlags } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    once: false,
    async execute(interaction, client) {
        // Handle Autocomplete
        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.autocomplete(interaction, client);
            } catch (error) {
                // Silently ignore expected errors (user typing fast, interaction expired)
                if (error.code === 10062 || error.code === 40060) return;
                console.error("Error en autocomplete:", error);
            }
            return;
        }

        // Handle Chat Commands
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            return interaction.reply({
                content: "❌ Este comando no existe.",
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`Error ejecutando comando ${interaction.commandName}:`, error);

            const errorEmbed = new EmbedBuilder()
                .setColor(client.config.colors.error)
                .setDescription(`${client.config.emojis.error} Ha ocurrido un error al ejecutar este comando.`);

            // Check if interaction is already handled
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true }).catch(() => { });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => { });
            }
        }
    }
};
