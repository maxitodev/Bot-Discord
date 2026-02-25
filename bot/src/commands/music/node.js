const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("node")
        .setDescription("🌐 Gestión de nodos Lavalink")
        .addSubcommand(sub =>
            sub
                .setName("status")
                .setDescription("Ver el estado de todos los nodos Lavalink")
        )
        .addSubcommand(sub =>
            sub
                .setName("switch")
                .setDescription("Cambiar manualmente a un nodo Lavalink específico")
                .addStringOption(option =>
                    option
                        .setName("nombre")
                        .setDescription("Nombre del nodo al que deseas cambiar")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName("auto")
                .setDescription("Restaurar la selección automática de nodos")
        ),

    async autocomplete(interaction, client) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const nodeManager = client.nodeManager;

        if (!nodeManager) return interaction.respond([]);

        const names = nodeManager.getNodeNames();
        const filtered = names
            .filter(name => name.toLowerCase().includes(focusedValue))
            .map(name => {
                const status = nodeManager.getStatus();
                const node = status.nodes.find(n => n.name === name);
                const statusIcon = node?.status === 'connected' ? '🟢' : '🔴';
                const activeLabel = node?.isActive ? ' (Activo)' : '';
                return {
                    name: `${statusIcon} ${name}${activeLabel}`,
                    value: name
                };
            });

        await interaction.respond(filtered.slice(0, 25));
    },

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const nodeManager = client.nodeManager;

        if (!nodeManager) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} El sistema de gestión de nodos no está disponible.`)
                ],
                ephemeral: true
            });
        }

        switch (subcommand) {
            case "status":
                return this._handleStatus(interaction, client, nodeManager);
            case "switch":
                return this._handleSwitch(interaction, client, nodeManager);
            case "auto":
                return this._handleAuto(interaction, client, nodeManager);
        }
    },

    async _handleStatus(interaction, client, nodeManager) {
        const status = nodeManager.getStatus();
        const { emojis, colors } = client.config;

        const nodeFields = status.nodes.map(node => {
            const statusIcon = node.status === 'connected' ? emojis.nodeOnline : emojis.nodeOffline;
            const activeTag = node.isActive ? ' **⟨ ACTIVO ⟩**' : '';
            const preferredTag = node.isPreferred ? ' ⭐' : '';
            const manualTag = node.isManualOverride ? ' 🔧' : '';

            let details = [];
            details.push(`Estado: ${statusIcon} ${this._translateStatus(node.status)}`);
            details.push(`Prioridad: \`#${node.priority}\``);

            if (node.latency !== null) {
                const latencyColor = node.latency < 100 ? '🟢' : node.latency < 300 ? '🟡' : '🔴';
                details.push(`Latencia: ${latencyColor} \`${node.latency}ms\``);
            }

            if (node.uptime) {
                details.push(`Uptime: \`${this._formatUptime(node.uptime)}\``);
            }

            if (node.errorCount > 0) {
                details.push(`Errores: \`${node.errorCount}\``);
            }

            if (node.lastError) {
                details.push(`Último error: \`${node.lastError.substring(0, 80)}\``);
            }

            return {
                name: `${statusIcon} ${node.name}${activeTag}${preferredTag}${manualTag}`,
                value: details.join('\n'),
                inline: true
            };
        });

        const embed = new EmbedBuilder()
            .setColor(colors.node || colors.main)
            .setAuthor({ name: 'Estado de Nodos Lavalink', iconURL: client.user.displayAvatarURL() })
            .setDescription(
                `${emojis.node} **Sistema Multi-Nodo**\n` +
                `Nodo activo: **${status.activeNode || 'Ninguno'}**\n` +
                `Failover automático: ${status.failoverEnabled ? '`Activado`' : '`Desactivado`'}\n` +
                `Modo: ${status.manualOverride ? `\`Manual\` (${status.manualOverride})` : '`Automático`'}`
            )
            .addFields(nodeFields)
            .setFooter({ text: '⭐ = Preferido  |  🔧 = Selección manual  |  Usa /node switch para cambiar' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async _handleSwitch(interaction, client, nodeManager) {
        const nodeName = interaction.options.getString("nombre");
        const { emojis, colors } = client.config;

        const result = nodeManager.switchToNode(nodeName);

        if (result.success) {
            const embed = new EmbedBuilder()
                .setColor(colors.success)
                .setDescription(
                    `${emojis.nodeSwitch} **Nodo Lavalink cambiado**\n\n` +
                    `${emojis.nodeOffline} ~~${result.previous}~~ → ${emojis.nodeOnline} **${result.current}**\n\n` +
                    `> *Modo manual activado. Usa \`/node auto\` para restaurar la selección automática.*`
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor(colors.error)
                .setDescription(`${emojis.error} ${result.message}`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },

    async _handleAuto(interaction, client, nodeManager) {
        const { emojis, colors } = client.config;
        const result = nodeManager.clearManualOverride();

        const embed = new EmbedBuilder()
            .setColor(colors.success)
            .setDescription(
                `${emojis.nodeSwitch} **Modo Automático Restaurado**\n\n` +
                `${result.message}\n\n` +
                `> *El bot seleccionará automáticamente el mejor nodo disponible y cambiará si uno falla.*`
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    _translateStatus(status) {
        const statusMap = {
            'connected': 'Conectado',
            'connecting': 'Conectando...',
            'disconnected': 'Desconectado',
            'error': 'Error'
        };
        return statusMap[status] || status;
    },

    _formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
};
