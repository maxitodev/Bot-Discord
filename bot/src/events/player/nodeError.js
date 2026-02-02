module.exports = {
    name: "nodeError",
    execute(name, error, client) {
        console.error(`❌ Error en nodo "${name}":`, error.message);
    }
};
