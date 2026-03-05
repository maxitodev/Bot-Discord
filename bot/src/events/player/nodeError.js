module.exports = {
    name: "nodeError",
    execute(name, error, client) {
        const rawMessage = error?.message || error?.error || String(error);
        const retryMatch = rawMessage.match(/Try again in\s+(\d+)\s+seconds/i);

        if (retryMatch) {
            const retrySeconds = Number(retryMatch[1]);
            client.registerNodeRestBlock(name, retrySeconds, rawMessage);
            console.warn(`⏳ Nodo "${name}" bloqueado por REST durante ${retrySeconds}s`);
        }

        console.error(`❌ Error en nodo "${name}":`, rawMessage);
    }
};
