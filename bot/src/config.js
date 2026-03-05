module.exports = {
    // Bot Configuration
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,

    // Spotify Configuration
    spotify: {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
        playlistPageLimit: 3,       // 100 tracks per page (up to 300 tracks)
        albumPageLimit: 2,          // 50 tracks per page (up to 100 tracks)
        searchLimit: 10,            // Max search results
        searchMarket: 'MX',        // Mexico market for regional content
    },

    // Lavalink Nodes Configuration (seleccion manual, sin switch automatico)
    nodes: [
        {
            name: "local",
            host: "localhost",
            port: 2333,
            password: "maxitodev",
            secure: false
        },
        {
            name: "serenetia",
            host: "lavalinkv4.serenetia.com",
            port: 443,
            password: "https://dsc.gg/ajidevserver",
            secure: true
        },
        {
            name: "jirayu",
            host: "lavalink.jirayu.net",
            port: 443,
            password: "youshallnotpass",
            secure: true
        }
    ],

    // Bot Settings
    defaultVolume: 80,
    maxQueueSize: 500,

    // Audio Quality Settings (Optimizado para reducir lag y audio trabado)
    audioSettings: {
        // Buffer settings - Aumentados para evitar trabazón al inicio
        bufferDuration: 800,        // Duración del buffer en ms (aumentado de 400)
        frameBufferDuration: 8000,  // Buffer de frames (8 segundos, antes 5s)

        // Pre-buffer antes de reproducir
        preloadSeconds: 3,          // Segundos a prebufferear antes de reproducir

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
        autoplay: "♾️",
        spotify: "🟢"
    }
};
