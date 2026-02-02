module.exports = {
    // Bot Configuration
    token: process.env.DISCORD_TOKEN || "TU_TOKEN_AQUI",
    clientId: process.env.CLIENT_ID || "TU_CLIENT_ID_AQUI",

    // Lavalink Configuration (Shoukaku format)
    nodes: [
        {
            name: "Serenetia Lavalink",
            url: "lavalinkv4.serenetia.com:443",
            auth: "https://dsc.gg/ajidevserver",
            secure: true
        }
    ],

    // Bot Settings
    defaultVolume: 80,
    maxQueueSize: 500,

    // Embed Colors
    colors: {
        main: 0x5865F2,      // Discord Blurple
        success: 0x00FF7F,   // Spring Green
        error: 0xFF2E2E,     // Vivid Red
        warning: 0xFFD700,   // Gold
        music: 0x00F7FF      // Neon Cyan
    },

    // Emojis
    emojis: {
        play: "▶️",
        pause: "⏸️",
        stop: "⏹️",
        skip: "⏭️",
        previous: "⏮️",
        queue: "📜",
        music: "🎵",
        volume: "🔊",
        volumeMute: "🔇",
        loop: "🔁",
        loopOne: "🔂",
        shuffle: "🔀",
        loading: "⏳",
        success: "✅",
        error: "❌",
        warning: "⚠️"
    }
};
