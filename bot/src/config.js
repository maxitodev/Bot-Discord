module.exports = {
    // Bot Configuration
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,

    // Lavalink Configuration
    nodes: [
        {
            name: "lavalink.jirayu.net",
            url: "lavalink.jirayu.net:443",
            auth: "youshallnotpass",
            secure: true
        },
    ],

    // Bot Settings
    defaultVolume: 80,
    maxQueueSize: 500,

    // Audio Quality Settings (Optimizado para reducir lag)
    audioSettings: {
        // Buffer settings - Aumentar para conexiones inestables
        bufferDuration: 400,        // Duración del buffer en ms (default: 400)
        frameBufferDuration: 5000,  // Buffer de frames (5 segundos)

        // Calidad de audio
        opusQuality: 10,            // Calidad Opus (0-10, 10 = mejor)
        resamplingQuality: "HIGH",  // HIGH, MEDIUM, LOW

        // Configuración de reproducción
        trackStuckThreshold: 10000, // Tiempo antes de considerar track atascado (10s)
        playerUpdateInterval: 5,    // Intervalo de actualización del player (5s)

        // Optimizaciones
        useSeekGhosting: true,      // Mejora el seeking
        gcWarnings: false           // Desactivar warnings de garbage collector
    },

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
