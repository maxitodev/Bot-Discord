const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "playerEmpty",
    async execute(player, client) {
        const channel = client.channels.cache.get(player.textId);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.warning)
            .setDescription(`${client.config.emojis.music} La cola ha terminado. ¡Añade más canciones con \`/play\`!`)
            .setFooter({ text: "Me desconectaré en 5 minutos si no hay actividad" })
            .setTimestamp();

        try {
            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error("Error al enviar mensaje de queueEnd:", error);
        }

        // Auto disconnect after 5 minutes of inactivity
        setTimeout(() => {
            const currentPlayer = client.manager.players.get(player.guildId);
            if (currentPlayer && !currentPlayer.playing && currentPlayer.queue.length === 0) {
                currentPlayer.destroy();
            }
        }, 5 * 60 * 1000);
    }
};
