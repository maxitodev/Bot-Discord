const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    MessageFlags
} = require("discord.js");

function getStateMeta(state) {
    switch (state) {
        case 1:
            return { icon: "🟢", label: "Conectado" };
        case 0:
            return { icon: "🟡", label: "Conectando" };
        case 2:
            return { icon: "🟠", label: "Desconectando" };
        case 3:
            return { icon: "🔴", label: "Desconectado" };
        default:
            return { icon: "⚪", label: "Desconocido" };
    }
}

function getNodeRuntime(client, nodeName) {
    return client.manager?.shoukaku?.nodes?.get(nodeName) || null;
}

function getNodeStatusLine(client, nodeName) {
    const runtimeNode = getNodeRuntime(client, nodeName);
    if (!runtimeNode) return { icon: "🔴", label: "No inicializado" };
    return getStateMeta(runtimeNode.state);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("node")
        .setDescription("🌐 Gestion manual de nodos Lavalink")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(sub =>
            sub
                .setName("status")
                .setDescription("Ver estado y seleccion de nodos")
        )
        .addSubcommand(sub =>
            sub
                .setName("switch")
                .setDescription("Cambiar el nodo Lavalink activo para este servidor")
                .addStringOption(option =>
                    option
                        .setName("nombre")
                        .setDescription("Nodo al que deseas cambiar")
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ),

    async autocomplete(interaction, client) {
        const focused = interaction.options.getFocused().toLowerCase();
        const guildId = interaction.guildId;
        const selectedNode = guildId ? client.getNodeForGuild(guildId) : null;
        const player = guildId ? client.manager.players.get(guildId) : null;
        const playerNode = player?.shoukaku?.node?.name || null;

        const matches = client.getConfiguredNodes()
            .filter(node => node.name.toLowerCase().includes(focused))
            .map(node => {
                const status = getNodeStatusLine(client, node.name);
                const tags = [];
                if (node.name === selectedNode) tags.push("seleccionado");
                if (node.name === playerNode) tags.push("en uso");
                const suffix = tags.length ? ` • ${tags.join(" • ")}` : "";
                return {
                    name: `${status.icon} ${node.name}${suffix}`.slice(0, 100),
                    value: node.name
                };
            })
            .slice(0, 25);

        await interaction.respond(matches);
    },

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "status") {
            return this.handleStatus(interaction, client);
        }

        if (subcommand === "switch") {
            return this.handleSwitch(interaction, client);
        }

        return interaction.reply({
            content: `${client.config.emojis.error} Subcomando no soportado.`,
            flags: MessageFlags.Ephemeral
        });
    },

    async handleStatus(interaction, client) {
        const guildId = interaction.guildId;
        const configuredNodes = client.getConfiguredNodes();
        const selectedNode = client.getNodeForGuild(guildId);
        const player = client.manager.players.get(guildId);
        const playerNode = player?.shoukaku?.node?.name || "Ninguno";

        const fields = configuredNodes.map(node => {
            const status = getNodeStatusLine(client, node.name);
            const isSelected = node.name === selectedNode;
            const isPlayerNode = node.name === playerNode;

            return {
                name: `${status.icon} ${node.name}${isSelected ? "  •  Seleccionado" : ""}`,
                value:
                    `Estado: ${status.label}\n` +
                    `Endpoint: \`${node.host}:${node.port}\`\n` +
                    `TLS: ${node.secure ? "Activado" : "Desactivado"}\n` +
                    `Uso actual: ${isPlayerNode ? "Reproduciendo aqui" : "Sin reproduccion"}`,
                inline: true
            };
        });

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.main || 0x2B2D31)
            .setAuthor({
                name: "Control de Nodos Lavalink",
                iconURL: client.user.displayAvatarURL()
            })
            .setDescription(
                "Seleccion manual activa.\n" +
                "No hay cambio automatico de nodo en fallos."
            )
            .addFields(
                {
                    name: "Contexto del servidor",
                    value:
                        `Nodo seleccionado: **${selectedNode}**\n` +
                        `Nodo del player: **${playerNode}**`,
                    inline: false
                },
                ...fields
            )
            .setFooter({ text: "Usa /node switch para cambiar manualmente" })
            .setTimestamp();

        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    },

    async handleSwitch(interaction, client) {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                content: `${client.config.emojis.error} Necesitas el permiso \`Gestionar servidor\` para usar este comando.`,
                flags: MessageFlags.Ephemeral
            });
        }

        const guildId = interaction.guildId;
        const nodeName = interaction.options.getString("nombre", true);
        const configuredNodes = client.getConfiguredNodes();
        const targetNode = configuredNodes.find(node => node.name === nodeName);

        if (!targetNode) {
            return interaction.reply({
                content: `${client.config.emojis.error} El nodo \`${nodeName}\` no existe en la configuracion.`,
                flags: MessageFlags.Ephemeral
            });
        }

        const runtimeNode = getNodeRuntime(client, nodeName);
        if (!runtimeNode || runtimeNode.state !== 1) {
            const state = getNodeStatusLine(client, nodeName);
            return interaction.reply({
                content:
                    `${client.config.emojis.error} El nodo \`${nodeName}\` no esta listo para cambio manual.\n` +
                    `Estado actual: ${state.icon} ${state.label}`,
                flags: MessageFlags.Ephemeral
            });
        }

        const previousNode = client.getNodeForGuild(guildId);
        const currentPlayerNode = client.manager.players.get(guildId)?.shoukaku?.node?.name;
        if (previousNode === nodeName && currentPlayerNode === nodeName) {
            return interaction.reply({
                content: `${client.config.emojis.warning} Ese nodo ya estaba seleccionado para este servidor.`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const result = await client.switchNodeForGuild(guildId, nodeName);

        if (!result.success) {
            return interaction.editReply({
                content: `${client.config.emojis.error} No se pudo completar el cambio de nodo.`
            });
        }

        const playerMessage = !result.hadPlayer
            ? "No habia reproductor activo. El cambio aplicara a la proxima reproduccion."
            : result.alreadyOnNode
                ? "El reproductor ya estaba usando ese nodo."
                : result.moved
                    ? "El reproductor activo fue migrado al nuevo nodo."
                    : "El cambio se guardo, pero no se movio el reproductor.";

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.success || 0x00B894)
            .setTitle("Cambio manual de nodo aplicado")
            .setDescription(
                `Servidor: **${interaction.guild.name}**\n` +
                `Antes: \`${previousNode}\`\n` +
                `Ahora: \`${nodeName}\``
            )
            .addFields({
                name: "Resultado",
                value: playerMessage,
                inline: false
            })
            .setFooter({ text: "Modo manual activo: no hay switch automatico" })
            .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
    }
};
