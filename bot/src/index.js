// Ignore expired SSL certificates for Lavalink
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require("dotenv").config();
const MusicBot = require("./structures/Client");

// Create and start the bot
const client = new MusicBot();

// Handle process events
process.on("unhandledRejection", (error) => {
    console.error("❌ Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught exception:", error);
});

// Start the bot
client.start();
