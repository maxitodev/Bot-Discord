const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "voiceStateUpdate",
    async execute(oldState, newState, client) {
        // Obtenemos el player del servidor
        const player = client.manager.players.get(newState.guild.id);
        if (!player) return;

        const botChannelId = player.voiceId;
        const botChannel = newState.guild.channels.cache.get(botChannelId);

        // Si el bot no está en un canal (o el canal no existe), salir
        if (!botChannel) return;

        // Si el bot fue desconectado manualmente
        if (oldState.member.id === client.user.id) {
            if (!newState.channelId) {
                if (player) player.destroy();
                return;
            }
        }

        // Simplemente verificamos el canal del bot cada vez que alguien se mueve
        // Solo nos importa si el cambio afectó al canal donde está el bot
        if (oldState.channelId === botChannelId || newState.channelId === botChannelId) {

            // Contamos humanos (no bots)
            const humans = botChannel.members.filter(m => !m.user.bot);

            if (humans.size === 0) {
                // Si ya hay un timeout corriendo, no crear otro
                if (player.emptyTimeout) return;

                console.log(`⏳ Inactividad detectada en ${newState.guild.name}. Iniciando cuenta atrás.`);

                // Crear timeout de 2 minutos
                player.emptyTimeout = setTimeout(() => {
                    const currentPlayer = client.manager.players.get(newState.guild.id);
                    if (currentPlayer && currentPlayer.voiceId === botChannelId) {
                        const currentChannel = newState.guild.channels.cache.get(botChannelId);
                        const currentHumans = currentChannel?.members.filter(m => !m.user.bot);

                        // Doble chequeo final
                        if (currentHumans && currentHumans.size === 0) {
                            currentPlayer.destroy();

                            const textChannel = client.channels.cache.get(currentPlayer.textId);
                            if (textChannel) {
                                const embed = new EmbedBuilder()
                                    .setColor(client.config.colors.warning)
                                    .setDescription("💤 **Desconectado por inactividad.** (Nadie en el canal de voz)");
                                textChannel.send({ embeds: [embed] }).catch(() => { });
                            }
                        }
                    }
                    delete player.emptyTimeout;
                }, 2 * 60 * 1000); // 2 Minutos

            } else {
                // Si volvió alguien, cancelamos la cuenta atrás
                if (player.emptyTimeout) {
                    console.log(`👤 Actividad detectada en ${newState.guild.name}. Cancelando desconexión.`);
                    clearTimeout(player.emptyTimeout);
                    delete player.emptyTimeout;
                }
            }
        }
    }
};
