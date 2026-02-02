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
            { name: "🔥 High Quality Music", type: ActivityType.Listening },
            { name: "💻 Dev: MaxitoDev", type: ActivityType.Watching },
            { name: "🚀 /play para empezar", type: ActivityType.Playing },
            { name: "✨ Nueva UI Moderna", type: ActivityType.Playing }
        ];

        let index = 0;
        setInterval(() => {
            const status = statuses[index];
            client.user.setActivity(status.name, { type: status.type });
            index = (index + 1) % statuses.length;
        }, 10000); // Cambia cada 10 segundos

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
