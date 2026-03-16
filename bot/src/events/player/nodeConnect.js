module.exports = {
    name: "nodeConnect",
    execute(name, ...args) {
        const client = args.pop();
        client.clearNodeRestBlock(name);
        console.log(`✅ Nodo Lavalink "${name}" conectado correctamente`);

        // Reset health monitor tracking for this node (it's alive now)
        if (client.nodeHealthMonitor) {
            client.nodeHealthMonitor.resetNode(name);
        }
    }
};
