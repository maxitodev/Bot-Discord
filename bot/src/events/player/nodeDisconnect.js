module.exports = {
    name: "nodeDisconnect",
    execute(name, code, reason, client) {
        client.clearNodeRestBlock(name);
        console.warn(`⚠️ Nodo Lavalink "${name}" desconectado — Code: ${code}, Reason: ${reason || 'N/A'}`);

        // Trigger health monitor to attempt reconnection after a short delay
        if (client.nodeHealthMonitor) {
            // Reset backoff for this node so it reconnects quickly
            client.nodeHealthMonitor.resetNode(name);
            setTimeout(() => {
                console.log(`🩺 Intentando reconectar nodo "${name}" tras desconexión...`);
                client.nodeHealthMonitor.forceCheck();
            }, 5000); // Wait 5s before attempting reconnect
        }
    }
};
