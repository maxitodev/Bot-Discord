const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("filters")
        .setDescription("🎵 Aplica filtros de audio a la reproducción")
        .addStringOption(option =>
            option
                .setName("tipo")
                .setDescription("El tipo de filtro a aplicar")
                .setRequired(true)
                .addChoices(
                    { name: "🛑 Limpiar Filtros", value: "clear" },
                    { name: "💣 BassBoost", value: "bassboost" },
                    { name: "🌙 Nightcore", value: "nightcore" },
                    { name: "🌫️ Vaporwave", value: "vaporwave" },
                    { name: "🔄 8D", value: "8d" },
                    { name: "🐢 Slowmotion", value: "slowmotion" },
                    { name: "🐿️ Chipmunk", value: "chipmunk" }
                )
        ),

    async execute(interaction, client) {
        const { member, guild } = interaction;
        const filterType = interaction.options.getString("tipo");

        const player = client.manager.players.get(guild.id);

        if (!player) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} No hay música reproduciéndose en este momento.`)
                ],
                ephemeral: true
            });
        }

        if (!member.voice.channel || member.voice.channel.id !== player.voiceId) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} Debes estar en el mismo canal de voz que el bot.`)
                ],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        // Reset filters first
        player.shoukaku.setFilters({ op: 'filters', guildId: guild.id });

        let embedDescription = "";

        switch (filterType) {
            case "clear":
                embedDescription = "✅ Todos los filtros han sido desactivados.";
                break;
            case "bassboost":
                player.shoukaku.setFilters({
                    op: 'filters',
                    guildId: guild.id,
                    equalizer: [
                        { band: 0, gain: 0.2 },
                        { band: 1, gain: 0.15 },
                        { band: 2, gain: 0.1 },
                        { band: 3, gain: 0.05 },
                        { band: 4, gain: 0.025 },
                        { band: 5, gain: 0.0125 }
                    ]
                });
                embedDescription = "💣 **BassBoost** activado.";
                break;
            case "nightcore":
                player.shoukaku.setFilters({
                    op: 'filters',
                    guildId: guild.id,
                    timescale: {
                        speed: 1.1,
                        pitch: 1.2,
                        rate: 1.05
                    }
                });
                embedDescription = "🌙 **Nightcore** activado.";
                break;
            case "vaporwave":
                player.shoukaku.setFilters({
                    op: 'filters',
                    guildId: guild.id,
                    equalizer: [
                        { band: 1, gain: 0.3 },
                        { band: 0, gain: 0.3 }
                    ],
                    timescale: { pitch: 0.5 },
                    tremolo: { depth: 0.3, frequency: 14 }
                });
                embedDescription = "🌫️ **Vaporwave** activado.";
                break;
            case "8d":
                player.shoukaku.setFilters({
                    op: 'filters',
                    guildId: guild.id,
                    rotation: { rotationHz: 0.2 }
                });
                embedDescription = "🔄 **8D** activado.";
                break;
            case "slowmotion":
                player.shoukaku.setFilters({
                    op: 'filters',
                    guildId: guild.id,
                    timescale: {
                        speed: 0.5,
                        pitch: 1.0,
                        rate: 0.8
                    }
                });
                embedDescription = "🐢 **Slowmotion** activado.";
                break;
            case "chipmunk":
                player.shoukaku.setFilters({
                    op: 'filters',
                    guildId: guild.id,
                    timescale: {
                        speed: 1.05,
                        pitch: 1.35,
                        rate: 1.25
                    }
                });
                embedDescription = "🐿️ **Chipmunk** activado.";
                break;
        }

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.success)
            .setDescription(`${client.config.emojis.success} ${embedDescription}`);

        return interaction.editReply({ embeds: [embed] });
    }
};
