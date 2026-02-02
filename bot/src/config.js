module.exports = {
    // Bot Configuration
    token: process.env.DISCORD_TOKEN || "TU_TOKEN_AQUI",
    clientId: process.env.CLIENT_ID || "TU_CLIENT_ID_AQUI",
    
    // Lavalink Configuration (Shoukaku format)
    nodes: [
        {
            name: "Main Node",
            url: "127.0.0.1:2333",
            auth: "tuPasswordSegura",
            secure: false
        }
    ],

    // Bot Settings
    defaultVolume: 80,
    maxQueueSize: 500,
    
    // Embed Colors
    colors: {
        main: 0x5865F2,      // Discord Blurple
        success: 0x57F287,   // Green
        error: 0xED4245,     // Red
        warning: 0xFEE75C,   // Yellow
        music: 0xEB459E      // Pink/Fuchsia
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
