module.exports = {
    name: "nodeConnect",
    execute(name, client) {
        client.clearNodeRestBlock(name);
        console.log(`✅ Nodo Lavalink "${name}" conectado correctamente`);
    }
};
