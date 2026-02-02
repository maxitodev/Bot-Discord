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

        // Set bot activity
        client.user.setActivity("/play", { type: ActivityType.Listening });

        // Register slash commands
        await registerCommands(client);
    }
};

async function registerCommands(client) {
    const commands = client.commands.map(cmd => cmd.data.toJSON());
    const rest = new REST({ version: "10" }).setToken(client.config.token);

    try {
        console.log("🔄 Registrando comandos slash...");

        // Register commands globally
        await rest.put(
            Routes.applicationCommands(client.config.clientId),
            { body: commands }
        );

        console.log(`✅ ${commands.length} comandos slash registrados correctamente`);
    } catch (error) {
        console.error("❌ Error al registrar comandos:", error);
    }
}
