const { EmbedBuilder } = require("discord.js");
const { formatDuration } = require('../../utils/formatDuration');

module.exports = {
    name: "presenceUpdate",
    async execute(oldPresence, newPresence, client) {
        if (!newPresence || !newPresence.member) return;

        const guildId = newPresence.guild.id;
        const config = client.gtaConfig?.get(guildId);

        // Si no hay configuración para este server, ignorar
        if (!config || !config.enabled) return;

        const channel = client.channels.cache.get(config.channelId);
        if (!channel) return;

        const member = newPresence.member;
        const userId = member.id;

        // Detectar si está jugando GTA V
        const newActivity = newPresence.activities.find(act =>
            act.name === "Grand Theft Auto V" ||
            act.name === "GTA V" ||
            (act.name === "FiveM" && act.type === 0)
        );

        // Detectar estado anterior
        const oldActivity = oldPresence?.activities.find(act =>
            act.name === "Grand Theft Auto V" ||
            act.name === "GTA V" ||
            (act.name === "FiveM" && act.type === 0)
        );

        // CASO 1: Empezó a jugar
        if (newActivity && !oldActivity) {
            // Guardar hora de inicio
            if (!client.gtaSessions) client.gtaSessions = new Map();
            client.gtaSessions.set(userId, Date.now());

            const startMessages = [
                `🚔 **ALERTA DE DESMADRE** 🚔\nEl **${member.displayName}** ya prendió el GTA V. ¡Escóndanlo todo!`,
                `🔫 **${member.displayName}** entró a Los Santos. ¡Ya valió madre!`,
                `🚗💨 **${member.displayName}** anda suelto en GTA V. ¡Cuidado en la calle!`,
                `🤑 **${member.displayName}** se fue a robar bancos al GTA V.`,
                `🚓 ¡Llamen a la chota! **${member.displayName}** se conectó a GTA V.`
            ];

            const embed = new EmbedBuilder()
                .setColor(0x3AB136)
                .setDescription(startMessages[Math.floor(Math.random() * startMessages.length)])
                .setThumbnail(member.user.displayAvatarURL());

            try {
                await channel.send({ embeds: [embed] });
            } catch (error) {
                console.error(`Error enviando alerta GTA V en ${guildId}:`, error);
            }
        }

        // CASO 2: Dejó de jugar
        else if (!newActivity && oldActivity) {
            // Calcular tiempo jugado
            const startTime = client.gtaSessions?.get(userId);
            let durationText = "";

            if (startTime) {
                const durationMs = Date.now() - startTime;
                client.gtaSessions.delete(userId);

                // Formatear duración (asumiendo que formatDuration devuelve "Xm Ys" o similar)
                // Haremos un formateo simple aquí por si acaso
                const hours = Math.floor(durationMs / 3600000);
                const minutes = Math.floor((durationMs % 3600000) / 60000);

                if (hours > 0) durationText = `${hours} horas y ${minutes} minutos`;
                else durationText = `${minutes} minutos`;
            }

            const stopMessages = [
                `🛑 **${member.displayName}** se desconectó de GTA V.`,
                `😴 **${member.displayName}** ya se cansó de matar gente en GTA.`,
                `🚓 **${member.displayName}** se peló de Los Santos.`,
                `💸 **${member.displayName}** terminó su sesión de GTA.`
            ];

            const embed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setDescription(`${stopMessages[Math.floor(Math.random() * stopMessages.length)]}`)
                .setFooter({ text: durationText ? `Jugó por: ${durationText}` : "Sesión finalizada" });

            try {
                await channel.send({ embeds: [embed] });
            } catch (error) {
                console.error(`Error enviando despedida GTA V en ${guildId}:`, error);
            }
        }
    }
};
