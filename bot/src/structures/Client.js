const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const { Kazagumo } = require("kazagumo");
const { Connectors } = require("shoukaku");
const Spotify = require("kazagumo-spotify");
const config = require("../config");
const fs = require("fs");
const path = require("path");
const AutoMemeSystem = require("../utils/AutoMemeSystem");
const ConfigManager = require("../utils/ConfigManager");
const NodeHealthMonitor = require("../utils/NodeHealthMonitor");

const TRACK_NEGATIVE_KEYWORDS = [
    "live",
    "karaoke",
    "cover",
    "slowed",
    "sped up",
    "nightcore",
    "remix",
    "reverb",
    "concert",
    "performance",
    "fanmade",
    "reaction"
];

function normalizeText(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}

function scoreResolvedCandidate(target, candidate) {
    const targetTitle = normalizeText(target.title);
    const targetAuthor = normalizeText(target.author);

    const candidateTitle = normalizeText(candidate?.title);
    const candidateAuthor = normalizeText(candidate?.author);

    let score = 0;

    if (candidateTitle === targetTitle) score += 45;
    else if (candidateTitle.includes(targetTitle)) score += 25;
    else if (targetTitle.includes(candidateTitle)) score += 15;

    if (targetAuthor && candidateAuthor.includes(targetAuthor)) score += 30;
    if (targetAuthor && candidateAuthor.includes(`${targetAuthor} - topic`)) score += 10;

    const targetLength = Number(target.length || 0);
    const candidateLength = Number(candidate?.length || 0);
    if (targetLength > 0 && candidateLength > 0) {
        const diff = Math.abs(targetLength - candidateLength);
        if (diff <= 2000) score += 30;
        else if (diff <= 5000) score += 20;
        else if (diff <= 10000) score += 10;
        else if (diff >= 30000) score -= 20;
    }

    if (candidateTitle.includes("official audio") || candidateTitle.endsWith(" audio")) {
        score += 8;
    }

    for (const keyword of TRACK_NEGATIVE_KEYWORDS) {
        if (candidateTitle.includes(keyword)) score -= 25;
    }

    return score;
}

async function resolveSpotifyTrackWithMusicSearch(options) {
    if (!this?.kazagumo) return false;
    if (this.sourceName !== "spotify") return false;

    const query = [this.author, this.title].filter(Boolean).join(" - ");
    if (!query) return false;

    const requester = options?.player?.data?.requester ?? this.requester;

    const result = options?.player
        ? await options.player.search(query, {
            source: "ytmsearch:",
            requester
        }).catch(() => null)
        : await this.kazagumo.search(query, {
            engine: "youtube_music",
            requester
        }).catch(() => null);

    if (!result?.tracks?.length) return false;

    const ranked = result.tracks
        .slice(0, 10)
        .map(track => ({
            track,
            score: scoreResolvedCandidate(this, track)
        }))
        .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (!best || best.score < 15) return false;

    const raw = best.track.getRaw()._raw;
    if (!raw?.encoded) return false;

    this.track = raw.encoded;
    this.realUri = raw.info.uri;
    this.length = raw.info.length;
    return true;
}


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

        // Initialize Config Manager
        this.configManager = new ConfigManager();

        // Initialize Auto-Meme System with saved config
        this.autoMemeConfig = this.configManager.load('automeme');
        this.autoMemeSystem = new AutoMemeSystem(this);

        // Initialize Minecraft Monitor config and system
        this.minecraftConfig = this.configManager.load('minecraft');
        const MinecraftMonitor = require("../utils/MinecraftMonitor");
        this.minecraftMonitor = new MinecraftMonitor(this);

        // Initialize GTA V Radar config
        this.gtaConfig = this.configManager.load('gta');
        this.gtaSessions = new Map(); // Para trackear tiempo de juego: userId -> startTime

        // Initialize AutoClean System
        this.autoCleanConfig = this.configManager.load('autoclean');
        const AutoCleanSystem = require("../utils/AutoCleanSystem");
        this.autoCleanSystem = new AutoCleanSystem(this);
        this.autoCleanSystem.start();

        // Initialize News System
        this.newsSubscriptions = this.configManager.load('news_subs');
        const NewsSystem = require("../utils/NewsSystem");
        this.newsSystem = new NewsSystem(this);
        this.newsSystem.start();

        // Build Lavalink nodes list (supports both config.nodes and legacy config.node)
        const rawNodes = Array.isArray(config.nodes) && config.nodes.length
            ? config.nodes
            : (config.node ? [config.node] : []);

        if (!rawNodes.length) {
            throw new Error("No hay nodos Lavalink configurados en config.js");
        }

        this.lavalinkNodes = rawNodes.map((node, index) => ({
            name: node.name || `node-${index + 1}`,
            host: node.host,
            port: node.port,
            password: node.password,
            secure: Boolean(node.secure)
        }));

        // Manual node selection per guild (no automatic failover)
        this.defaultNodeName = this.lavalinkNodes[0].name;
        this.guildNodeSelection = new Map();
        this.nodeRestBlocks = new Map();

        const nodes = this.lavalinkNodes.map(node => ({
            name: node.name,
            url: `${node.host}:${node.port}`,
            auth: node.password,
            secure: node.secure
        }));

        // Initialize Spotify Plugin
        const spotifyPlugins = [];
        if (config.spotify && config.spotify.clientId && config.spotify.clientSecret) {
            spotifyPlugins.push(
                new Spotify({
                    clientId: config.spotify.clientId,
                    clientSecret: config.spotify.clientSecret,
                    playlistPageLimit: config.spotify.playlistPageLimit || 3,
                    albumPageLimit: config.spotify.albumPageLimit || 2,
                    searchLimit: config.spotify.searchLimit || 10,
                    searchMarket: config.spotify.searchMarket || 'US',
                })
            );
            console.log("🟢 Spotify plugin cargado correctamente");
        } else {
            console.warn("⚠️ Spotify credentials no encontradas. Spotify deshabilitado.");
        }

        // Initialize Kazagumo Manager with Shoukaku + Spotify
        this.manager = new Kazagumo({
            // Use YouTube Music for fallback resolution to avoid generic full-video matches.
            defaultSearchEngine: "youtube_music",
            trackResolver: resolveSpotifyTrackWithMusicSearch,
            plugins: spotifyPlugins,
            send: (guildId, payload) => {
                const guild = this.guilds.cache.get(guildId);
                if (guild) guild.shard.send(payload);
            }
        }, new Connectors.DiscordJS(this), nodes, {
            moveOnDisconnect: false,
            resume: true,
            resumeTimeout: 30,
            reconnectTries: 5,
            reconnectInterval: 5000,
            restTimeout: 10000
        });

        // Initialize Node Health Monitor (auto-reconnects disconnected nodes)
        this.nodeHealthMonitor = new NodeHealthMonitor(this, {
            checkInterval: 30_000,      // Check every 30 seconds
            maxReconnectAttempts: 0,    // Unlimited retries
            reconnectCooldown: 15_000   // Start with 15s between attempts (exponential backoff)
        });

        console.log(`🌐 Nodos Lavalink cargados: ${this.lavalinkNodes.map(n => n.name).join(", ")}`);
        console.log(`🎯 Nodo por defecto: ${this.defaultNodeName} (seleccion manual por servidor)`);

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
                        event.name === "nodeDisconnect" ? "close" :
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
            // Start health monitor after login so Shoukaku has initialized
            this.nodeHealthMonitor.start();
        } catch (error) {
            console.error("❌ Error al iniciar el bot:", error);
            process.exit(1);
        }
    }

    getConfiguredNodes() {
        return [...this.lavalinkNodes];
    }

    registerNodeRestBlock(nodeName, seconds, reason) {
        const cooldownSeconds = Number(seconds);
        if (!Number.isFinite(cooldownSeconds) || cooldownSeconds <= 0) return;

        const expiresAt = Date.now() + (cooldownSeconds * 1000);
        this.nodeRestBlocks.set(nodeName, {
            expiresAt,
            reason: reason || "Rate limit"
        });
    }

    clearNodeRestBlock(nodeName) {
        this.nodeRestBlocks.delete(nodeName);
    }

    getNodeBlockInfo(nodeName) {
        const info = this.nodeRestBlocks.get(nodeName);
        if (!info) return null;

        const remainingMs = info.expiresAt - Date.now();
        if (remainingMs <= 0) {
            this.nodeRestBlocks.delete(nodeName);
            return null;
        }

        return {
            reason: info.reason,
            remainingMs,
            remainingSeconds: Math.ceil(remainingMs / 1000)
        };
    }

    getNodeForGuild(guildId) {
        const selected = this.guildNodeSelection.get(guildId);
        const isValid = this.lavalinkNodes.some(node => node.name === selected);
        return isValid ? selected : this.defaultNodeName;
    }

    setNodeForGuild(guildId, nodeName) {
        const exists = this.lavalinkNodes.some(node => node.name === nodeName);
        if (!exists) return false;
        this.guildNodeSelection.set(guildId, nodeName);
        return true;
    }

    async switchNodeForGuild(guildId, nodeName) {
        const exists = this.lavalinkNodes.some(node => node.name === nodeName);
        if (!exists) {
            return { success: false, reason: "not-found" };
        }

        const blockInfo = this.getNodeBlockInfo(nodeName);
        if (blockInfo) {
            return {
                success: false,
                reason: "rest-blocked",
                currentNode: this.getNodeForGuild(guildId),
                blockedNode: nodeName,
                blockInfo
            };
        }

        const previousNode = this.getNodeForGuild(guildId);
        this.guildNodeSelection.set(guildId, nodeName);

        const player = this.manager.players.get(guildId);
        if (!player) {
            return {
                success: true,
                hadPlayer: false,
                moved: false,
                previousNode,
                currentNode: nodeName
            };
        }

        const currentPlayerNode = player.shoukaku?.node?.name;
        if (currentPlayerNode === nodeName) {
            return {
                success: true,
                hadPlayer: true,
                moved: false,
                alreadyOnNode: true,
                previousNode,
                currentNode: nodeName
            };
        }

        try {
            const moved = await player.shoukaku.move(nodeName);
            if (!moved) {
                this.guildNodeSelection.set(guildId, previousNode);
                return {
                    success: false,
                    reason: "move-failed",
                    hadPlayer: true,
                    moved: false,
                    previousNode,
                    currentNode: previousNode
                };
            }

            return {
                success: true,
                hadPlayer: true,
                moved: true,
                previousNode,
                currentNode: nodeName
            };
        } catch (error) {
            this.guildNodeSelection.set(guildId, previousNode);
            return {
                success: false,
                reason: "move-error",
                error,
                hadPlayer: true,
                moved: false,
                previousNode,
                currentNode: previousNode
            };
        }
    }

    // Auto-Meme System Methods
    startAutoMeme(guildId) {
        if (this.autoMemeSystem) {
            this.autoMemeSystem.start(guildId);
        }
    }

    stopAutoMeme(guildId) {
        if (this.autoMemeSystem) {
            this.autoMemeSystem.stop(guildId);
        }
    }

    // Configuration Persistence Methods
    saveAutoMemeConfig() {
        if (this.configManager && this.autoMemeConfig) {
            this.configManager.save('automeme', this.autoMemeConfig);
        }
    }

    saveMinecraftConfig() {
        if (this.configManager && this.minecraftConfig) {
            this.configManager.save('minecraft', this.minecraftConfig);
        }
    }

    saveGtaConfig() {
        if (this.configManager && this.gtaConfig) {
            this.configManager.save('gta', this.gtaConfig);
        }
    }

    saveAutoCleanConfig() {
        if (this.configManager && this.autoCleanConfig) {
            this.configManager.save('autoclean', this.autoCleanConfig);
        }
    }
}

module.exports = MusicBot;
