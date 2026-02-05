const { ActivityType, REST, Routes } = require("discord.js");

module.exports = {
    name: "ready",
    once: true,
    async execute(client) {
        console.log(`\n${"═".repeat(50)}`);
        console.log(`🎵 Bot de Música iniciado correctamente`);
        console.log(`📛 Usuario: ${client.user.tag}`);
        console.log(`🏠 Servidores: ${client.guilds.cache.size}`);
        console.log(`👥 Usuarios: ${client.users.cache.size}`);
        console.log(`${"═".repeat(50)}\n`);

        // --- SISTEMA DE ESTADO ROTATIVO ---
        const statuses = [
            { name: "💻 Dev: MaxitoDev", type: ActivityType.Watching },
            { name: "🚀 /play para empezar", type: ActivityType.Playing }
        ];

        let index = 0;
        setInterval(() => {
            // Verificar si hay jugadores de Minecraft online
            let mcPlayers = 0;
            if (client.minecraftMonitor && client.minecraftMonitor.onlinePlayers) {
                for (const players of client.minecraftMonitor.onlinePlayers.values()) {
                    mcPlayers += players.size;
                }
            }

            // Si hay jugadores, el MinecraftMonitor maneja el estado
            if (mcPlayers > 0) return;

            // Si no hay jugadores, rotar estados normales
            const status = statuses[index];
            client.user.setActivity(status.name, { type: status.type });
            index = (index + 1) % statuses.length;
        }, 10000); // Cambia cada 10 segundos

        // Initialize Auto-Meme System
        if (client.autoMemeSystem) {
            client.autoMemeSystem.initializeAll();
        }

        // Initialize Minecraft Monitor
        if (client.minecraftMonitor) {
            const MinecraftMonitor = require('../../utils/MinecraftMonitor');
            if (!client.minecraftMonitor) {
                client.minecraftMonitor = new MinecraftMonitor(client);
            }
            client.minecraftMonitor.initializeAll();
        }

        // Register slash commands (Silent refresh)
        await registerCommands(client);
    }
};

async function registerCommands(client) {
    const commands = client.commands.map(cmd => cmd.data.toJSON());
    const rest = new REST({ version: "10" }).setToken(client.config.token);

    try {
        console.log("🔄 Registrando comandos slash...");
        await rest.put(
            Routes.applicationCommands(client.config.clientId),
            { body: commands }
        );
        console.log(`✅ ${commands.length} comandos slash registrados con éxito.`);
    } catch (error) {
        console.error("❌ Error al registrar comandos:", error);
    }
}
