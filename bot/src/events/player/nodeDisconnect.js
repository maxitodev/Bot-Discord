module.exports = {
    name: "nodeDisconnect",
    execute(name, code, reason, client) {
        console.warn(`⚠️ Nodo Lavalink "${name}" desconectado — Code: ${code}, Reason: ${reason || 'N/A'}`);
    }
};
