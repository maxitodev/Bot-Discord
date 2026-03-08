/**
 * NodeHealthMonitor
 * 
 * Monitors Lavalink nodes and automatically reconnects disconnected or
 * uninitialized nodes without requiring a bot restart.
 * 
 * - Runs a periodic health check every 30 seconds
 * - Attempts to reconnect nodes that have state !== CONNECTED (1)
 * - Tracks reconnect attempts per node and backs off after failures
 * - Logs all state changes to the console
 */

class NodeHealthMonitor {
    constructor(client, options = {}) {
        this.client = client;
        this.checkInterval = options.checkInterval || 30_000;  // 30 seconds
        this.maxReconnectAttempts = options.maxReconnectAttempts || 0; // 0 = unlimited
        this.reconnectCooldown = options.reconnectCooldown || 15_000; // 15s between attempts per node

        // Track per-node reconnect state
        this.nodeReconnectState = new Map(); // nodeName -> { attempts, lastAttempt, backoffMs }

        this._intervalId = null;
        this._started = false;
    }

    /**
     * Start the health monitor. Should be called after the bot is logged in
     * and Shoukaku has had time to initialize.
     */
    start() {
        if (this._started) return;
        this._started = true;

        // Initial check after a small delay to let Shoukaku connect first
        setTimeout(() => this._checkAllNodes(), 10_000);

        this._intervalId = setInterval(() => this._checkAllNodes(), this.checkInterval);
        console.log(`🩺 NodeHealthMonitor iniciado (intervalo: ${this.checkInterval / 1000}s)`);
    }

    stop() {
        if (this._intervalId) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
        this._started = false;
        console.log("🩺 NodeHealthMonitor detenido");
    }

    /**
     * Check all configured nodes and attempt to reconnect any that are down.
     */
    _checkAllNodes() {
        const shoukaku = this.client.manager?.shoukaku;
        if (!shoukaku) return;

        const configuredNodes = this.client.getConfiguredNodes();

        for (const nodeConfig of configuredNodes) {
            const nodeName = nodeConfig.name;
            const runtimeNode = shoukaku.nodes.get(nodeName);

            if (!runtimeNode) {
                // Node never initialized or was removed — try to add it
                this._attemptReconnect(nodeName, nodeConfig, "no inicializado");
                continue;
            }

            // Shoukaku node states:
            // 0 = CONNECTING, 1 = CONNECTED, 2 = DISCONNECTING, 3 = DISCONNECTED
            const state = runtimeNode.state;

            if (state === 1) {
                // Node is healthy — reset reconnect tracking
                this._resetReconnectState(nodeName);
                continue;
            }

            if (state === 0) {
                // Currently connecting, don't interfere
                continue;
            }

            // state 2 (DISCONNECTING) or 3 (DISCONNECTED) — try to reconnect
            const stateLabel = state === 2 ? "desconectando" : state === 3 ? "desconectado" : `estado ${state}`;
            this._attemptReconnect(nodeName, nodeConfig, stateLabel);
        }
    }

    /**
     * Attempt to reconnect a node with backoff logic.
     */
    _attemptReconnect(nodeName, nodeConfig, reason) {
        const now = Date.now();
        let state = this.nodeReconnectState.get(nodeName);

        if (!state) {
            state = { attempts: 0, lastAttempt: 0, backoffMs: this.reconnectCooldown };
            this.nodeReconnectState.set(nodeName, state);
        }

        // Check if max attempts exceeded (0 = unlimited)
        if (this.maxReconnectAttempts > 0 && state.attempts >= this.maxReconnectAttempts) {
            return; // Stop trying, will reset if node comes back online
        }

        // Check cooldown with exponential backoff
        const timeSinceLastAttempt = now - state.lastAttempt;
        if (timeSinceLastAttempt < state.backoffMs) {
            return; // Still in cooldown
        }

        state.attempts++;
        state.lastAttempt = now;
        // Exponential backoff: 15s, 30s, 60s, 120s... capped at 5 minutes
        state.backoffMs = Math.min(state.backoffMs * 2, 5 * 60_000);

        console.log(
            `🩺 [NodeHealth] Nodo "${nodeName}" ${reason} — ` +
            `intento de reconexión #${state.attempts}...`
        );

        try {
            const shoukaku = this.client.manager.shoukaku;

            // Remove the dead node if it exists in the runtime
            const existingNode = shoukaku.nodes.get(nodeName);
            if (existingNode) {
                try {
                    existingNode.disconnect();
                } catch (_) { /* ignore disconnect errors */ }
                shoukaku.nodes.delete(nodeName);
            }

            // Re-add the node with fresh connection
            shoukaku.addNode({
                name: nodeName,
                url: `${nodeConfig.host}:${nodeConfig.port}`,
                auth: nodeConfig.password,
                secure: nodeConfig.secure
            });

            console.log(`🩺 [NodeHealth] Nodo "${nodeName}" enviado a reconectar`);
        } catch (error) {
            console.error(`🩺 [NodeHealth] Error reconectando nodo "${nodeName}":`, error.message);
        }
    }

    /**
     * Reset the reconnect state for a node (called when it comes back online).
     */
    _resetReconnectState(nodeName) {
        if (this.nodeReconnectState.has(nodeName)) {
            const state = this.nodeReconnectState.get(nodeName);
            if (state.attempts > 0) {
                console.log(`🩺 [NodeHealth] Nodo "${nodeName}" recuperado después de ${state.attempts} intento(s)`);
            }
            this.nodeReconnectState.delete(nodeName);
        }
    }

    /**
     * Force an immediate health check (useful after a disconnect event).
     */
    forceCheck() {
        this._checkAllNodes();
    }

    /**
     * Reset reconnect tracking for a specific node.
     */
    resetNode(nodeName) {
        this.nodeReconnectState.delete(nodeName);
    }

    /**
     * Get status info for all nodes (for debugging/status commands).
     */
    getStatus() {
        const configuredNodes = this.client.getConfiguredNodes();
        const shoukaku = this.client.manager?.shoukaku;

        return configuredNodes.map(nodeConfig => {
            const runtimeNode = shoukaku?.nodes?.get(nodeConfig.name);
            const reconnectState = this.nodeReconnectState.get(nodeConfig.name);

            return {
                name: nodeConfig.name,
                state: runtimeNode ? runtimeNode.state : -1,
                stateLabel: !runtimeNode ? "No inicializado" :
                    runtimeNode.state === 0 ? "Conectando" :
                        runtimeNode.state === 1 ? "Conectado" :
                            runtimeNode.state === 2 ? "Desconectando" :
                                runtimeNode.state === 3 ? "Desconectado" : "Desconocido",
                reconnectAttempts: reconnectState?.attempts || 0,
                lastAttempt: reconnectState?.lastAttempt || null
            };
        });
    }
}

module.exports = NodeHealthMonitor;
