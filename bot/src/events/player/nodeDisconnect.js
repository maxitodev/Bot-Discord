module.exports = {
    name: "nodeDisconnect",
    execute(name, ...args) {
        const client = args.pop();
        const code = args[0] || 'Unknown';
        const reason = args[1] || 'N/A';
        client.clearNodeRestBlock(name);
        console.warn(`⚠️ Nodo Lavalink "${name}" desconectado — Code: ${code}, Reason: ${reason}`);

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
