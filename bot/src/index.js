// Auto-update: pull latest changes from git before starting
const { execSync } = require("child_process");
const path = require("path");

try {
    const repoRoot = path.join(__dirname, "..", "..");
    console.log("🔄 Pulling latest changes from git...");
    const output = execSync("git pull", { cwd: repoRoot, encoding: "utf-8", timeout: 30000 });
    console.log("✅ Git pull:", output.trim());
} catch (error) {
    console.warn("⚠️ Git pull failed (continuing anyway):", error.message);
}

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
