module.exports = {
    // Bot Configuration
    token: process.env.DISCORD_TOKEN || "TU_TOKEN_AQUI",
    clientId: process.env.CLIENT_ID || "TU_CLIENT_ID_AQUI",

    // Lavalink Configuration
    nodes: [
        {
            name: "Local Lavalink",
            url: "lavalinkv4.serenetia.com:443",
            auth: "https://dsc.gg/ajidevserver",
            secure: true
        }
    ],

    // Bot Settings
    defaultVolume: 80,
    maxQueueSize: 500,

    // Embed Colors - "Miko Style" (Dark Background blend, Red Accents)
    colors: {
        main: 0x000001,      // Almost Black (Looks like full black/transparent)
        success: 0xFF0000,   // Red for success
        error: 0x550000,     // Dark Red
        warning: 0xFFA500,   // Orange
        music: 0xFF0000      // Red
    },

    // Emojis (Standard)
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
        warning: "⚠️",
        autoplay: "♾️"
    }
};
