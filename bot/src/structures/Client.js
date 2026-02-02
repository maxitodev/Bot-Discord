const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const { Kazagumo } = require("kazagumo");
const { Connectors } = require("shoukaku");
const config = require("../config");
const fs = require("fs");
const path = require("path");

class MusicBot extends Client {
    constructor() {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ],
            partials: [Partials.Channel]
        });

        this.commands = new Collection();
        this.config = config;
        
        // Initialize Kazagumo Manager with Shoukaku
        this.manager = new Kazagumo({
            defaultSearchEngine: "youtube",
            send: (guildId, payload) => {
                const guild = this.guilds.cache.get(guildId);
                if (guild) guild.shard.send(payload);
            }
        }, new Connectors.DiscordJS(this), config.nodes);

        this.loadCommands();
        this.loadEvents();
        this.loadPlayerEvents();
    }

    loadCommands() {
        const commandsPath = path.join(__dirname, "..", "commands");
        const commandFolders = fs.readdirSync(commandsPath);

        for (const folder of commandFolders) {
            const folderPath = path.join(commandsPath, folder);
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));

            for (const file of commandFiles) {
                const filePath = path.join(folderPath, file);
                const command = require(filePath);
                
                if ("data" in command && "execute" in command) {
                    this.commands.set(command.data.name, command);
                    console.log(`✅ Comando cargado: ${command.data.name}`);
                } else {
                    console.log(`⚠️ El comando en ${filePath} no tiene las propiedades requeridas.`);
                }
            }
        }
    }

    loadEvents() {
        const eventsPath = path.join(__dirname, "..", "events", "client");
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);
            
            if (event.once) {
                this.once(event.name, (...args) => event.execute(...args, this));
            } else {
                this.on(event.name, (...args) => event.execute(...args, this));
            }
            console.log(`✅ Evento del cliente cargado: ${event.name}`);
        }
    }

    loadPlayerEvents() {
        const eventsPath = path.join(__dirname, "..", "events", "player");
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

        for (const file of eventFiles) {
            const filePath = path.join(eventsPath, file);
            const event = require(filePath);
            
            // Kazagumo uses shoukaku for node events
            if (event.name.startsWith("node")) {
                const shoukakuEvent = event.name === "nodeConnect" ? "ready" : 
                                      event.name === "nodeError" ? "error" : 
                                      event.name.replace("node", "").toLowerCase();
                this.manager.shoukaku.on(shoukakuEvent, (...args) => event.execute(...args, this));
            } else {
                this.manager.on(event.name, (...args) => event.execute(...args, this));
            }
            console.log(`✅ Evento del player cargado: ${event.name}`);
        }
    }

    async start() {
        try {
            await this.login(config.token);
        } catch (error) {
            console.error("❌ Error al iniciar el bot:", error);
            process.exit(1);
        }
    }
}

module.exports = MusicBot;
