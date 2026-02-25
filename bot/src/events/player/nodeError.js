module.exports = {
    name: "nodeError",
    execute(name, error, client) {
        console.error(`❌ Error en nodo "${name}":`, error.message || error);

        // Notify NodeManager about the error for automatic failover
        if (client.nodeManager) {
            client.nodeManager.onNodeError(name, error);
        }
    }
};
