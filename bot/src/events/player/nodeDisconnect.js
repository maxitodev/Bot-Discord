module.exports = {
    name: "nodeDisconnect",
    execute(name, code, reason, client) {
        console.warn(`⚠️ Nodo Lavalink "${name}" desconectado — Code: ${code}, Reason: ${reason || 'N/A'}`);

        // Notify NodeManager about the disconnection for automatic failover
        if (client.nodeManager) {
            client.nodeManager.onNodeDisconnect(name, code, reason);
        }
    }
};
