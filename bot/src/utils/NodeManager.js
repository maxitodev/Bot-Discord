/**
 * NodeManager - Lavalink Multi-Node Failover System
 * 
 * Handles automatic node switching, health monitoring,
 * and provides manual node selection capabilities.
 */
class NodeManager {
    constructor(client) {
        this.client = client;
        this.config = client.config;
        this.failoverConfig = client.config.nodeFailover || {};

        // Node health tracking
        this.nodeHealth = new Map(); // nodeName -> { status, lastError, errorCount, connectedAt, latency }
        this.preferredNode = null;
        this.activeNode = null;
        this.manualOverride = null; // If user manually selected a node

        // Timers
        this._healthCheckTimer = null;
        this._preferredRecheckTimer = null;

        // Initialize health entries for all configured nodes
        for (const node of this.config.nodes) {
            const name = node.name || node.host;
            this.nodeHealth.set(name, {
                name: name,
                status: 'disconnected',  // disconnected | connecting | connected | error
                lastError: null,
                errorCount: 0,
                connectedAt: null,
                latency: null,
                priority: node.priority || 99,
                reconnectAttempts: 0
            });
        }

        // Set preferred node based on priority
        const sorted = [...this.config.nodes].sort((a, b) => (a.priority || 99) - (b.priority || 99));
        if (sorted.length > 0) {
            this.preferredNode = sorted[0].name || sorted[0].host;
        }
    }

    /**
     * Start health monitoring
     */
    start() {
        if (!this.failoverConfig.enabled) {
            console.log('⚙️  Node failover está deshabilitado.');
            return;
        }

        const healthInterval = this.failoverConfig.healthCheckInterval || 30000;
        const recheckInterval = this.failoverConfig.preferredNodeRecheck || 300000;

        // Periodic health check
        this._healthCheckTimer = setInterval(() => this._performHealthCheck(), healthInterval);

        // Periodically try to return to preferred node
        this._preferredRecheckTimer = setInterval(() => this._tryReturnToPreferred(), recheckInterval);

        console.log(`🌐 NodeManager iniciado — Health check: ${healthInterval / 1000}s | Preferred recheck: ${recheckInterval / 1000}s`);
    }

    /**
     * Stop health monitoring
     */
    stop() {
        if (this._healthCheckTimer) clearInterval(this._healthCheckTimer);
        if (this._preferredRecheckTimer) clearInterval(this._preferredRecheckTimer);
        console.log('🌐 NodeManager detenido.');
    }

    /**
     * Called when a node successfully connects
     */
    onNodeConnect(nodeName) {
        const health = this.nodeHealth.get(nodeName);
        if (health) {
            health.status = 'connected';
            health.connectedAt = Date.now();
            health.errorCount = 0;
            health.reconnectAttempts = 0;
            health.lastError = null;
        }

        // If no active node, or this is the preferred/manual node, set it as active
        if (!this.activeNode || nodeName === this.manualOverride || nodeName === this.preferredNode) {
            this.activeNode = nodeName;
        }

        console.log(`🌐 NodeManager: Nodo "${nodeName}" conectado. Nodo activo: "${this.activeNode}"`);
    }

    /**
     * Called when a node encounters an error
     */
    onNodeError(nodeName, error) {
        const health = this.nodeHealth.get(nodeName);
        if (health) {
            health.status = 'error';
            health.lastError = error?.message || String(error);
            health.errorCount++;
        }

        console.error(`🌐 NodeManager: Error en nodo "${nodeName}" (errores: ${health?.errorCount}): ${health?.lastError}`);

        // If the errored node is our active one, try to failover
        if (nodeName === this.activeNode && this.failoverConfig.enabled) {
            this._attemptFailover(nodeName);
        }
    }

    /**
     * Called when a node disconnects
     */
    onNodeDisconnect(nodeName, code, reason) {
        const health = this.nodeHealth.get(nodeName);
        if (health) {
            health.status = 'disconnected';
            health.connectedAt = null;
            health.lastError = `Disconnected (code: ${code}, reason: ${reason || 'unknown'})`;
        }

        console.warn(`🌐 NodeManager: Nodo "${nodeName}" desconectado. Code: ${code}, Reason: ${reason || 'N/A'}`);

        // If the disconnected node is our active one, failover immediately
        if (nodeName === this.activeNode && this.failoverConfig.enabled) {
            this._attemptFailover(nodeName);
        }
    }

    /**
     * Attempt to failover to a different node
     */
    _attemptFailover(failedNodeName) {
        const health = this.nodeHealth.get(failedNodeName);
        const maxAttempts = this.failoverConfig.maxReconnectAttempts || 3;

        if (health) {
            health.reconnectAttempts++;
        }

        // If we haven't exceeded max reconnect attempts, let Shoukaku handle reconnection
        if (health && health.reconnectAttempts <= maxAttempts) {
            console.log(`🌐 NodeManager: Intento de reconexión ${health.reconnectAttempts}/${maxAttempts} para "${failedNodeName}"...`);
            return;
        }

        // Exceeded max attempts, switch to next available node
        const alternativeNode = this._findBestAvailableNode(failedNodeName);

        if (alternativeNode) {
            console.log(`🔄 NodeManager: Cambiando de "${failedNodeName}" a "${alternativeNode}" automáticamente.`);
            this.activeNode = alternativeNode;
            this._movePlayersToNode(alternativeNode);
        } else {
            console.error(`❌ NodeManager: No hay nodos alternativos disponibles. Todos los nodos están caídos.`);
        }
    }

    /**
     * Find the best available node (excluding a specific one)
     */
    _findBestAvailableNode(excludeNode = null) {
        const available = [];

        for (const [name, health] of this.nodeHealth) {
            if (name === excludeNode) continue;
            if (health.status === 'connected') {
                available.push({ name, priority: health.priority });
            }
        }

        // Sort by priority (lower = better)
        available.sort((a, b) => a.priority - b.priority);

        return available.length > 0 ? available[0].name : null;
    }

    /**
     * Move all active players to a different node
     */
    _movePlayersToNode(targetNodeName) {
        try {
            const shoukaku = this.client.manager.shoukaku;
            const targetNode = shoukaku.nodes.get(targetNodeName);

            if (!targetNode) {
                console.error(`❌ NodeManager: Nodo destino "${targetNodeName}" no encontrado en Shoukaku.`);
                return;
            }

            // Get all active players and attempt to migrate them
            const players = this.client.manager.players;
            let movedCount = 0;

            for (const [guildId, player] of players) {
                try {
                    // Kazagumo/Shoukaku will handle player migration through the node
                    if (player.shoukaku && player.shoukaku.node && player.shoukaku.node.name !== targetNodeName) {
                        player.shoukaku.move(targetNodeName);
                        movedCount++;
                    }
                } catch (err) {
                    console.error(`❌ NodeManager: Error al mover player del guild ${guildId}: ${err.message}`);
                }
            }

            if (movedCount > 0) {
                console.log(`✅ NodeManager: ${movedCount} player(s) migrados al nodo "${targetNodeName}".`);
            }
        } catch (err) {
            console.error(`❌ NodeManager: Error general al migrar players: ${err.message}`);
        }
    }

    /**
     * Perform health check on all nodes
     */
    async _performHealthCheck() {
        const shoukaku = this.client.manager.shoukaku;

        for (const [name, health] of this.nodeHealth) {
            const node = shoukaku.nodes.get(name);

            if (node && node.state === 1) { // CONNECTED
                health.status = 'connected';

                // Try to measure latency via REST stats
                try {
                    const start = Date.now();
                    await node.rest.getStatus();
                    health.latency = Date.now() - start;
                } catch {
                    health.latency = null;
                }
            } else if (node && node.state === 0) { // CONNECTING
                health.status = 'connecting';
            } else {
                if (health.status === 'connected') {
                    health.status = 'disconnected';
                }
            }
        }
    }

    /**
     * Try to return to the preferred node if we're on a fallback
     */
    _tryReturnToPreferred() {
        // Don't switch if user manually selected a node
        if (this.manualOverride) return;

        // Already on preferred
        if (this.activeNode === this.preferredNode) return;

        const preferredHealth = this.nodeHealth.get(this.preferredNode);
        if (preferredHealth && preferredHealth.status === 'connected') {
            console.log(`🔄 NodeManager: Regresando al nodo preferido "${this.preferredNode}" (estaba en "${this.activeNode}").`);
            const previousNode = this.activeNode;
            this.activeNode = this.preferredNode;
            this._movePlayersToNode(this.preferredNode);
            console.log(`✅ NodeManager: Migrado de "${previousNode}" a "${this.preferredNode}" exitosamente.`);
        }
    }

    /**
     * Manually switch to a specific node
     */
    switchToNode(nodeName) {
        const health = this.nodeHealth.get(nodeName);
        if (!health) {
            return { success: false, message: `Nodo "${nodeName}" no existe en la configuración.` };
        }

        if (health.status !== 'connected') {
            return { success: false, message: `Nodo "${nodeName}" no está conectado (estado: ${health.status}).` };
        }

        if (this.activeNode === nodeName) {
            return { success: false, message: `Ya estás usando el nodo "${nodeName}".` };
        }

        const previousNode = this.activeNode;
        this.activeNode = nodeName;
        this.manualOverride = nodeName;
        this._movePlayersToNode(nodeName);

        return {
            success: true,
            message: `Cambiado de "${previousNode}" a "${nodeName}" exitosamente.`,
            previous: previousNode,
            current: nodeName
        };
    }

    /**
     * Clear manual override (return to auto mode)
     */
    clearManualOverride() {
        this.manualOverride = null;
        return { success: true, message: 'Modo automático restaurado. El bot seleccionará el mejor nodo disponible.' };
    }

    /**
     * Get the current node status for all nodes
     */
    getStatus() {
        const status = [];

        for (const [name, health] of this.nodeHealth) {
            status.push({
                name,
                status: health.status,
                isActive: name === this.activeNode,
                isPreferred: name === this.preferredNode,
                isManualOverride: name === this.manualOverride,
                priority: health.priority,
                latency: health.latency,
                errorCount: health.errorCount,
                lastError: health.lastError,
                connectedAt: health.connectedAt,
                uptime: health.connectedAt ? Date.now() - health.connectedAt : null
            });
        }

        // Sort by priority
        status.sort((a, b) => a.priority - b.priority);

        return {
            activeNode: this.activeNode,
            preferredNode: this.preferredNode,
            manualOverride: this.manualOverride,
            failoverEnabled: this.failoverConfig.enabled !== false,
            nodes: status
        };
    }

    /**
     * Get a list of available node names
     */
    getNodeNames() {
        return [...this.nodeHealth.keys()];
    }
}

module.exports = NodeManager;
