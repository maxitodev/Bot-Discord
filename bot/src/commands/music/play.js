const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, PermissionFlagsBits, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("🎵 Reproduce música de YouTube, Spotify, SoundCloud y más")
        .addStringOption(option =>
            option
                .setName("busqueda")
                .setDescription("Nombre de la canción o URL")
                .setRequired(true)
                .setAutocomplete(true) // Reactivamos autocomplete
        ),

    async autocomplete(interaction, client) {
        const focusedValue = interaction.options.getFocused();

        // Si no hay texto o es muy corto, no sugerir nada
        if (!focusedValue || focusedValue.length < 3) {
            return interaction.respond([]);
        }

        // Si es URL, sugerir reproducir directamente
        if (/^https?:\/\//.test(focusedValue)) {
            return interaction.respond([{ name: `🔗 Reproducir URL: ${focusedValue.substring(0, 80)}`, value: focusedValue }]);
        }

        try {
            // Usamos search de youtube para autocomplete
            // NOTA: Usamos 'youtube' explícitamente para asegurar resultados consistentes en autocomplete
            const res = await client.manager.search(focusedValue, { engine: 'youtube', requester: interaction.user });

            if (!res || !res.tracks || res.tracks.length === 0) {
                return interaction.respond([{ name: `🔍 Buscar: "${focusedValue.substring(0, 80)}"`, value: focusedValue }]);
            }

            // Mapeamos los resultados para el autocomplete de Discord (max 25 opciones)
            const tracks = res.tracks.slice(0, 10).map(track => {
                const title = track.title.length > 80 ? track.title.substring(0, 77) + "..." : track.title;
                const duration = track.isStream ? "LIVE" : new Date(track.length).toISOString().slice(14, 19);
                return {
                    name: `🎵 ${title} [${duration}]`,
                    value: track.uri // Usamos la URI para que al seleccionar reproduzca directo
                };
            });

            // Añadimos la opción de buscar texto exacto al final si no es URL
            tracks.push({ name: `🔍 Buscar texto exacto: "${focusedValue.substring(0, 70)}"`, value: focusedValue });

            await interaction.respond(tracks);

        } catch (error) {
            // Si falla, solo devolvemos lo que escribió el usuario
            console.error("Error en autocomplete:", error); // Log para debug
            await interaction.respond([{ name: `🔍 Buscar: "${focusedValue.substring(0, 80)}"`, value: focusedValue }]).catch(() => { });
        }
    },

    async execute(interaction, client) {
        const { options, member, guild, channel } = interaction;
        const query = options.getString("busqueda");

        // 1. Validaciones iniciales
        if (!member.voice.channel) {
            return interaction.reply({
                content: `${client.config.emojis.error} **Debes estar en un canal de voz.**`,
                flags: MessageFlags.Ephemeral
            });
        }

        const botVoiceChannel = guild.members.me.voice.channel;
        if (botVoiceChannel && member.voice.channel.id !== botVoiceChannel.id) {
            return interaction.reply({
                content: `${client.config.emojis.error} **Ya estoy en otro canal de voz:** ${botVoiceChannel.name}`,
                flags: MessageFlags.Ephemeral
            });
        }

        // Permisos del bot
        if (!member.voice.channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.Connect) ||
            !member.voice.channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.Speak)) {
            return interaction.reply({
                content: `${client.config.emojis.error} **No tengo permisos para unirme o hablar en tu canal.**`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply();

        try {
            // 2. Crear o recuperar el reproductor
            let player = client.manager.players.get(guild.id);
            if (!player) {
                player = await client.manager.createPlayer({
                    guildId: guild.id,
                    voiceId: member.voice.channel.id,
                    textId: channel.id,
                    volume: client.config.defaultVolume || 80,
                    deaf: true
                });
            }

            // 3. Activar Autoplay por defecto si no lo está
            // Guardamos preferencia en el player (metadata)
            player.data = player.data || {};
            // player.data.autoplay = true; // Desactivado por defecto

            // 4. Realizar la búsqueda
            // Detectar si es URL para ajustar el motor de búsqueda
            const isUrl = /^https?:\/\//.test(query);
            const searchEngine = isUrl ? undefined : 'youtube'; // Si es texto, forzar youtube

            console.log(`🔍 Buscando: ${query} (Engine: ${searchEngine || 'auto'})`);

            const res = await client.manager.search(query, {
                requester: member.user,
                engine: searchEngine
            });

            // 5. Manejar "Sin Resultados" o Errores
            if (!res || !res.tracks || res.tracks.length === 0) {
                return interaction.editReply({
                    content: `${client.config.emojis.error} **No se encontraron resultados para:** \`${query}\``
                });
            }

            if (res.type === 'LOAD_FAILED') {
                return interaction.editReply({
                    content: `${client.config.emojis.error} **Error al cargar:** \`${res.exception?.message || 'Error desconocido'}\``
                });
            }

            // 6. Manejar Playlist
            if (res.type === 'PLAYLIST') {
                for (const track of res.tracks) player.queue.add(track);

                if (!player.playing && !player.paused) player.play();

                const playlistEmbed = new EmbedBuilder()
                    .setColor(client.config.colors.success || 0xFF0000)
                    .setDescription(`✅ **Playlist cargada:** [${res.playlistName}](${query}) (${res.tracks.length} canciones)`)
                    .setFooter({ text: `Solicitado por ${member.user.tag}` });

                return interaction.editReply({ embeds: [playlistEmbed] });
            }

            // 7. Manejar Resultado Único (URL directa o selección de autocomplete) o Selección
            // Si viene de autocomplete (es una URI directa o URL), o solo un resultado
            if (isUrl || res.tracks.length === 1 || query.startsWith('http')) {
                const track = res.tracks[0];
                player.queue.add(track);
                if (!player.playing && !player.paused) player.play();

                const trackEmbed = new EmbedBuilder()
                    .setColor(client.config.colors.success || 0xFF0000)
                    .setDescription(`✅ **Añadido a la cola:** [${track.title}](${track.uri})`)
                    .setFooter({ text: `Solicitado por ${member.user.tag}` });

                return interaction.editReply({ embeds: [trackEmbed] });
            }

            // 8. Manejar Selección Múltiple (Si es búsqueda de texto y NO URL)
            // Esto pasa si el usuario ignora el autocomplete y da enter al texto "bad bunny"
            if (!isUrl && res.tracks.length > 1) {
                // Tomar los primeros 10 resultados para el menú
                const maxOptions = res.tracks.slice(0, 10);

                const options = maxOptions.map((track, i) => {
                    // Recortar títulos largos
                    const title = track.title.length > 90 ? track.title.substring(0, 87) + "..." : track.title;
                    const duration = track.isStream ? "LIVE" : new Date(track.length).toISOString().slice(14, 19);

                    return {
                        label: `${i + 1}. ${title}`,
                        description: `Por: ${track.author} | ⏱️ ${duration}`,
                        value: i.toString()
                    };
                });

                const menu = new StringSelectMenuBuilder()
                    .setCustomId('search-select')
                    .setPlaceholder('👇 Selecciona una canción')
                    .addOptions(options);

                const row = new ActionRowBuilder().addComponents(menu);

                const selectEmbed = new EmbedBuilder()
                    .setColor(client.config.colors.music || client.config.colors.success || 0xFF0000)
                    .setAuthor({ name: 'Resultados de búsqueda', iconURL: client.user.displayAvatarURL() })
                    .setDescription(`Encontré **${res.tracks.length}** resultados para \`${query}\`.\nSelecciona uno del menú de abajo.`)
                    .setFooter({ text: 'Tienes 30 segundos para elegir' });

                const msg = await interaction.editReply({ embeds: [selectEmbed], components: [row] });

                // Collector para la selección
                const collector = msg.createMessageComponentCollector({
                    componentType: ComponentType.StringSelect,
                    filter: i => i.user.id === member.user.id,
                    time: 30000,
                    max: 1
                });

                collector.on('collect', async i => {
                    try {
                        await i.deferUpdate(); // Importante

                        const selectedIndex = parseInt(i.values[0]);
                        const track = res.tracks[selectedIndex];

                        player.queue.add(track);
                        if (!player.playing && !player.paused) player.play();

                        const successEmbed = new EmbedBuilder()
                            .setColor(client.config.colors.success || 0xFF0000)
                            .setDescription(`✅ **Añadido a la cola:** [${track.title}](${track.uri})`)
                            .setFooter({ text: `Solicitado por ${member.user.tag}` });

                        // Editar el mensaje original eliminando el menú
                        await interaction.editReply({ embeds: [successEmbed], components: [] });
                    } catch (err) {
                        console.error("Error en collector:", err);
                    }
                });

                collector.on('end', (_, reason) => {
                    if (reason === 'time') {
                        interaction.editReply({
                            content: '❌ **Tiempo de selección agotado.**',
                            components: []
                        }).catch(() => { });
                    }
                });
                return;
            }

        } catch (error) {
            console.error("Error en play command:", error);
            return interaction.editReply({
                content: `${client.config.emojis.error} **Ocurrió un error inesperado:** ${error.message}`
            }).catch(() => { });
        }
    }
};
