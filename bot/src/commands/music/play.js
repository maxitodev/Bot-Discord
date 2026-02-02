const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require("discord.js");
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
                .setAutocomplete(true) // Activamos el autocompletado
        ),

    async autocomplete(interaction, client) {
        const focusedValue = interaction.options.getFocused();

        // Si no han escrito nada, no buscamos
        if (!focusedValue) {
            return interaction.respond([]);
        }

        try {
            // Buscamos sugerencias en YouTube
            const result = await client.manager.search(focusedValue, { requester: interaction.user, engine: 'youtube' });

            if (!result || !result.tracks || result.tracks.length === 0) {
                return interaction.respond([]);
            }

            // Mapeamos los resultados para Discord (max 25 opciones)
            const options = result.tracks.slice(0, 20).map(track => {
                const title = track.title || "Desconocido";
                const author = track.author || "Desconocido";

                // Discord API limit: 100 characters for name
                let name = `${title} - ${author}`;
                if (name.length > 85) { // Bajamos a 85 para ir sobrados y evitar errores
                    name = name.substring(0, 85) + "...";
                }

                return {
                    name: name,
                    value: track.uri
                };
            });

            await interaction.respond(options);

        } catch (error) {
            console.error("Error en autocomplete:", error);
            // En caso de error, respondemos vacío para no trabar la UI
            await interaction.respond([]);
        }
    },

    async execute(interaction, client) {
        const query = interaction.options.getString("cancion");
        const { member, guild, channel } = interaction;

        await interaction.deferReply();

        if (!member.voice.channel) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} Debes estar en un canal de voz para usar este comando.`)
                ]
            });
        }

        // ... Permisos ...
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
            // Como usamos Autocomplete, es muy probable que 'query' ya sea una URL directa (track.uri)
            // Pero mantenemos la lógica de búsqueda por si el usuario ignora el autocomplete y escribe texto
            const isUrl = /^https?:\/\//.test(query);
            let result;

            if (isUrl) {
                result = await client.manager.search(query, { requester: member });
            } else {
                // Inteligencia de Búsqueda Múltiple (Fallback)
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

            // Crear Player
            let player = client.manager.players.get(guild.id);
            if (!player) {
                player = await client.manager.createPlayer({
                    guildId: guild.id,
                    voiceId: member.voice.channel.id,
                    textId: channel.id,
                    deaf: true,
                    volume: client.config.defaultVolume
                });
            }

            // Si es Playlist
            if (result.type === "PLAYLIST") {
                for (const track of result.tracks) player.queue.add(track);

                const embed = new EmbedBuilder()
                    .setColor(client.config.colors.success)
                    .setDescription(`${client.config.emojis.queue} Playlist **${result.playlistName}** cargada (${result.tracks.length} canciones).`);

                if (!player.playing && !player.paused) player.play();
                return interaction.editReply({ embeds: [embed] });
            }

            // Si es Single Track (Ya sea por URL directa del autocomplete o por búsqueda)
            // Nota: Si viene del autocomplete, es una URL directa, así que entra aquí directo.
            // Si el usuario escribió texto y no usó autocomplete, podríamos mostrar el menú select...
            // PERO la experiencia de usuario moderna prefiere que si escribes texto y das enter, 
            // se reproduzca el primer resultado, y si quieres elegir, uses el autocomplete.

            // Para mantener la consistencia con lo que pediste antes ("como Miko"), 
            // si NO es URL, mostramos el menú de selección.
            // Si ES URL (lo que devuelve el autocomplete), reproducimos directo.

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
                    if (i.user.id !== member.id) return i.reply({ content: "❌ No es tu búsqueda.", ephemeral: true });

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

            // Reproducción Directa (Autocomplete URL o Link pegado)
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

            if (interaction.deferred) return interaction.editReply({ embeds: [errEmbed] });
            return interaction.reply({ embeds: [errEmbed], ephemeral: true });
        }
    }
};
