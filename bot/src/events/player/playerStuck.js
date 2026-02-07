const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "playerStuck",
    async execute(player, context, client) {
        const channel = client.channels.cache.get(player.textId);
        if (!channel) return;

        console.warn(`⚠️ Player Stuck en ${player.guildId}. Threshold: ${context.thresholdMs}ms. Type: ${context.type}`);

        // Intentar saltar la canción atascada para que la música no pare
        const embed = new EmbedBuilder()
            .setColor(client.config.colors.warning)
            .setDescription(`${client.config.emojis.warning} **La canción se ha atascado.** (Problema de conexión con YouTube/Nodo)\nSaltando a la siguiente...`);

        try {
            // Solo enviar alerta si no es un "Finished" normal mal interpretado
            if (context.type !== "TrackFinishedEvent") {
                await channel.send({ embeds: [embed] });
                player.skip();
            }
        } catch (err) {
            console.error("Error en playerStuck:", err);
        }
    }
};
