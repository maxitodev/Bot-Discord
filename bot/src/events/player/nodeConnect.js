module.exports = {
    name: "nodeConnect",
    execute(name, client) {
        console.log(`✅ Nodo Lavalink "${name}" conectado correctamente`);

        // Notify NodeManager about the connection
        if (client.nodeManager) {
            client.nodeManager.onNodeConnect(name);
        }
    }
};
