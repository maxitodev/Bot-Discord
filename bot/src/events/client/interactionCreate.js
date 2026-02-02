const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    once: false,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            return interaction.reply({
                content: "❌ Este comando no existe.",
                ephemeral: true
            });
        }

        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(`Error ejecutando comando ${interaction.commandName}:`, error);

            const errorEmbed = new EmbedBuilder()
                .setColor(client.config.colors.error)
                .setDescription(`${client.config.emojis.error} Ha ocurrido un error al ejecutar este comando.`);

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
            } else {
                await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
    }
};
