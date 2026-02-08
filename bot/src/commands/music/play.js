const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, MessageFlags } = require("discord.js");
const { formatDuration } = require("../../utils/formatDuration");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("🎵 Reproduce una canción o playlist")
        .addStringOption(option =>
            option
                .setName("cancion")
                .setDescription("Nombre de la canción o URL")
                .setRequired(true)
        ),


    async execute(interaction, client) {
        const query = interaction.options.getString("cancion");
        const { member, guild, channel } = interaction;

        try {
            await interaction.deferReply();
        } catch (error) {
            return;
        }

        if (!member.voice.channel) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} Debes estar en un canal de voz para usar este comando.`)
                ]
            });
        }

        const permissions = member.voice.channel.permissionsFor(client.user);
        if (!permissions.has("Connect") || !permissions.has("Speak")) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} No tengo permisos para conectarme o hablar en tu canal de voz.`)
                ]
            });
        }

        try {
            const isUrl = /^https?:\/\//.test(query);
            let result;

            if (isUrl) {
                result = await client.manager.search(query, { requester: member });
            } else {
                result = await client.manager.search(query, { requester: member, engine: 'youtube' });
                if (!result || !result.tracks || !result.tracks.length) {
                    result = await client.manager.search(query, { requester: member, engine: 'youtube_music' });
                }
                if (!result || !result.tracks || !result.tracks.length) {
                    result = await client.manager.search(query, { requester: member, engine: 'soundcloud' });
                }
            }

            if (!result || !result.tracks || !result.tracks.length) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.colors.error)
                            .setDescription(`${client.config.emojis.error} No se encontraron resultados para: **${query}**`)
                    ]
                });
            }

            let player = client.manager.players.get(guild.id);
            if (!player) {
                player = await client.manager.createPlayer({
                    guildId: guild.id,
                    voiceId: member.voice.channel.id,
                    textId: channel.id,
                    deaf: true,
                    volume: client.config.defaultVolume
                });
                player.autoplay = false;
            }

            if (result.type === "PLAYLIST") {
                for (const track of result.tracks) player.queue.add(track);

                const embed = new EmbedBuilder()
                    .setColor(client.config.colors.success)
                    .setDescription(`${client.config.emojis.queue} Playlist **${result.playlistName}** cargada (${result.tracks.length} canciones).`);

                if (!player.playing && !player.paused) player.play();
                return interaction.editReply({ embeds: [embed] });
            }

            if (!isUrl && result.type !== "PLAYLIST") {
                const tracks = result.tracks.slice(0, 10);

                const options = tracks.map((track, i) => ({
                    label: `${i + 1}. ${track.title.substring(0, 95)}`,
                    description: `${track.author.substring(0, 50)} - ${formatDuration(track.length)}`,
                    value: i.toString(),
                    emoji: "🎵"
                }));

                const menu = new StringSelectMenuBuilder()
                    .setCustomId('search_select')
                    .setPlaceholder('👇 Selecciona una canción...')
                    .addOptions(options);

                const row = new ActionRowBuilder().addComponents(menu);

                const selectMsg = await interaction.editReply({
                    content: `🔍 **Resultados para:** \`${query}\``,
                    components: [row],
                    embeds: []
                });

                const collector = selectMsg.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    time: 30000
                });

                collector.on('collect', async i => {
                    if (i.user.id !== member.id) return i.reply({ content: "❌ No es tu búsqueda.", flags: MessageFlags.Ephemeral });

                    const track = tracks[parseInt(i.values[0])];
                    player.queue.add(track);
                    if (!player.playing && !player.paused) player.play();

                    const embed = new EmbedBuilder()
                        .setColor(client.config.colors.success)
                        .setAuthor({ name: "Añadido a la cola" })
                        .setTitle(track.title)
                        .setURL(track.uri)
                        .setThumbnail(track.thumbnail);

                    await i.update({ content: null, embeds: [embed], components: [] });
                });
                return;
            }

            const track = result.tracks[0];
            player.queue.add(track);

            const embed = new EmbedBuilder()
                .setColor(client.config.colors.success)
                .setDescription(`${client.config.emojis.success} Cargado: [${track.title}](${track.uri})`);

            if (!player.playing && !player.paused) player.play();
            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Error en play:", error);
            const errEmbed = new EmbedBuilder()
                .setColor(client.config.colors.error)
                .setDescription(`${client.config.emojis.error} Error al procesar la solicitud.`);

            if (interaction.deferred || interaction.replied) {
                return interaction.editReply({ embeds: [errEmbed] });
            }
            return interaction.reply({ embeds: [errEmbed], flags: MessageFlags.Ephemeral });
        }
    }
};
