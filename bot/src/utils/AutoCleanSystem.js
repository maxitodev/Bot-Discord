const { PermissionFlagsBits } = require("discord.js");

class AutoCleanSystem {
    constructor(client) {
        this.client = client;
        this.interval = null;
        this.checkInterval = 5 * 60 * 1000; // Verificar cada 5 minutos
    }

    start() {
        if (this.interval) return;

        console.log("🧹 Sistema de Auto-Limpieza iniciado");
        this.interval = setInterval(() => this.runCleanup(), this.checkInterval);

        // Ejecutar una limpieza inicial a los 10 segundos de iniciar
        setTimeout(() => this.runCleanup(), 10000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    // Método público para forzar chequeo de un servidor
    checkGuild(guildId) {
        // En una implementación real, podríamos filtrar solo ese guild, 
        // pero por simplicidad esperaremos al siguiente ciclo o lo forzamos todo.
        this.runCleanup();
    }

    async runCleanup() {
        if (!this.client.autoCleanConfig) return;

        for (const [guildId, channels] of this.client.autoCleanConfig.entries()) {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) continue;

            for (const config of channels) {
                try {
                    const channel = guild.channels.cache.get(config.channelId);
                    if (!channel) continue;

                    // Verificar permisos
                    if (!channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.ManageMessages) ||
                        !channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.ReadMessageHistory)) {
                        console.log(`⚠️ Perdí permisos para auto-limpiar en ${channel.name} (${guild.name})`);
                        continue;
                    }

                    // Calcular el timestamp límite
                    const now = Date.now();
                    const limitTimestamp = now - config.maxAge;
                    const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);

                    // Si el límite es más antiguo que 14 días, Discord API no permite bulkDelete
                    // Así que solo borraremos hasta 14 días de antigüedad de forma masiva

                    const fetchLimit = Math.max(limitTimestamp, fourteenDaysAgo);

                    // Obtener mensajes (máximo 100 por lote API)
                    const messages = await channel.messages.fetch({ limit: 100 });

                    const messagesToDelete = messages.filter(msg =>
                        !msg.pinned && // No borrar mensajes fijados
                        msg.createdTimestamp < limitTimestamp && // Más viejos que el límite
                        msg.createdTimestamp > fourteenDaysAgo // Más nuevos que 14 días (para bulk delete)
                    );

                    if (messagesToDelete.size > 0) {
                        await channel.bulkDelete(messagesToDelete, true);
                        console.log(`🧹 [AutoClean] Borrados ${messagesToDelete.size} mensajes en ${channel.name}`);
                    }

                } catch (error) {
                    console.error(`❌ Error en AutoClean para canal ${config.channelId}:`, error);
                }
            }
        }
    }
}

module.exports = AutoCleanSystem;
