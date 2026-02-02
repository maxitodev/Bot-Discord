module.exports = {
    name: "raw",
    once: false,
    execute(data, client) {
        // Shoukaku handles voice state updates internally via the Connector
        // No need to manually update voice state with Kazagumo/Shoukaku
    }
};
