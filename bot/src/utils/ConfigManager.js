const fs = require('fs');
const path = require('path');

/**
 * Sistema de persistencia de configuraciones
 * Guarda y carga configuraciones en archivos JSON
 */
class ConfigManager {
    constructor(configDir = './data') {
        this.configDir = configDir;
        this.ensureConfigDir();
    }

    /**
     * Asegura que el directorio de configuración existe
     */
    ensureConfigDir() {
        if (!fs.existsSync(this.configDir)) {
            fs.mkdirSync(this.configDir, { recursive: true });
            console.log(`📁 Directorio de configuración creado: ${this.configDir}`);
        }
    }

    /**
     * Guarda una configuración en un archivo JSON
     * @param {string} name - Nombre del archivo de configuración
     * @param {Map} data - Datos a guardar (Map)
     */
    save(name, data) {
        try {
            const filePath = path.join(this.configDir, `${name}.json`);

            // Convertir Map a objeto para JSON
            const obj = {};
            for (const [key, value] of data.entries()) {
                obj[key] = value;
            }

            fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf8');
            console.log(`💾 Configuración guardada: ${name}`);
        } catch (error) {
            console.error(`❌ Error guardando configuración ${name}:`, error);
        }
    }

    /**
     * Carga una configuración desde un archivo JSON
     * @param {string} name - Nombre del archivo de configuración
     * @returns {Map} Map con los datos cargados
     */
    load(name) {
        try {
            const filePath = path.join(this.configDir, `${name}.json`);

            if (!fs.existsSync(filePath)) {
                console.log(`⚠️ No se encontró configuración: ${name}`);
                return new Map();
            }

            const data = fs.readFileSync(filePath, 'utf8');
            const obj = JSON.parse(data);

            // Convertir objeto a Map
            const map = new Map();
            for (const [key, value] of Object.entries(obj)) {
                map.set(key, value);
            }

            console.log(`✅ Configuración cargada: ${name} (${map.size} entradas)`);
            return map;

        } catch (error) {
            console.error(`❌ Error cargando configuración ${name}:`, error);
            return new Map();
        }
    }

    /**
     * Elimina una configuración
     * @param {string} name - Nombre del archivo de configuración
     */
    delete(name) {
        try {
            const filePath = path.join(this.configDir, `${name}.json`);

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Configuración eliminada: ${name}`);
            }
        } catch (error) {
            console.error(`❌ Error eliminando configuración ${name}:`, error);
        }
    }

    /**
     * Verifica si existe una configuración
     * @param {string} name - Nombre del archivo de configuración
     * @returns {boolean}
     */
    exists(name) {
        const filePath = path.join(this.configDir, `${name}.json`);
        return fs.existsSync(filePath);
    }
}

module.exports = ConfigManager;
