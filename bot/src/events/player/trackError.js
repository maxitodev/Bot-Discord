const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "playerError",
    async execute(player, error, client) {
        const channel = client.channels.cache.get(player.textId);
        if (!channel) return;

        console.error(`Error en player:`, error);

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.error)
            .setDescription(`${client.config.emojis.error} Error en la reproducción. Saltando a la siguiente canción...`)
            .setTimestamp();

        try {
            await channel.send({ embeds: [embed] });
        } catch (err) {
            console.error("Error al enviar mensaje de playerError:", err);
        }
    }
};
