const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, PermissionFlagsBits, MessageFlags } = require("discord.js");

// Wait until Lavalink has received the Discord voice server update for this player (max 4s)
async function waitForPlayerReady(player, maxMs = 4000) {
    const interval = 100;
    let elapsed = 0;
    while (elapsed < maxMs) {
        try {
            const guildId = player?.guildId;
            const node = player?.shoukaku?.node;
            if (guildId && node) {
                const conn = node.manager.connections.get(guildId);
                if (conn?.serverUpdate) return true;
            }
        } catch (_) { }
        await new Promise(r => setTimeout(r, interval));
        elapsed += interval;
    }
    return false;
}

// Helper to detect Spotify URLs
function isSpotifyUrl(url) {
    return /^https?:\/\/(open\.)?spotify\.com\/(track|playlist|album|artist)\//i.test(url) ||
        /^https?:\/\/spotify\.link\//i.test(url);
}

// Helper to get Spotify source type from URL
function getSpotifyType(url) {
    if (/\/track\//i.test(url)) return 'track';
    if (/\/playlist\//i.test(url)) return 'playlist';
    if (/\/album\//i.test(url)) return 'album';
    if (/\/artist\//i.test(url)) return 'artist';
    return 'unknown';
}

// Spotify-themed embed color
const SPOTIFY_COLOR = 0x1DB954;

// Helper to get source label from a track
function getTrackSourceLabel(track) {
    if (!track) return '🔴 YouTube';
    const src = track.sourceName?.toLowerCase() || '';
    if (src === 'spotify') return '🟢 Spotify';
    if (src === 'soundcloud') return '🟠 SoundCloud';
    return '🔴 YouTube';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("🎵 Reproduce música de YouTube, Spotify, SoundCloud y más")
        .addStringOption(option =>
            option
                .setName("busqueda")
                .setDescription("Nombre de la canción, URL de YouTube/Spotify/SoundCloud")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option
                .setName("fuente")
                .setDescription("Motor de búsqueda preferido (solo para texto, no URLs)")
                .setRequired(false)
                .addChoices(
                    { name: '🔴 YouTube', value: 'youtube' },
                    { name: '🟢 Spotify', value: 'spotify' },
                    { name: '🟠 SoundCloud', value: 'soundcloud' }
                )
        ),

    async autocomplete(interaction, client) {
        const focusedValue = interaction.options.getFocused();

        // Si no hay texto o es muy corto, no sugerir nada
        if (!focusedValue || focusedValue.length < 3) {
            return interaction.respond([]);
        }

        // Si es URL de Spotify, sugerir reproducir directamente con ícono de Spotify
        if (isSpotifyUrl(focusedValue)) {
            const spotifyType = getSpotifyType(focusedValue);
            const typeLabels = { track: 'Canción', playlist: 'Playlist', album: 'Álbum', artist: 'Artista' };
            return interaction.respond([{
                name: `🟢 Spotify ${typeLabels[spotifyType] || ''}: ${focusedValue.substring(0, 70)}`,
                value: focusedValue
            }]);
        }

        // Si es otra URL, sugerir reproducir directamente
        if (/^https?:\/\//.test(focusedValue)) {
            return interaction.respond([{ name: `🔗 Reproducir URL: ${focusedValue.substring(0, 80)}`, value: focusedValue }]);
        }

        try {
            // Obtener el motor de búsqueda seleccionado
            const selectedEngine = interaction.options.getString("fuente") || 'spotify';

            const res = await client.manager.search(focusedValue, { engine: selectedEngine, requester: interaction.user });

            if (!res || !res.tracks || res.tracks.length === 0) {
                return interaction.respond([{ name: `🔍 Buscar: "${focusedValue.substring(0, 80)}"`, value: focusedValue }]);
            }

            // Mapeamos los resultados para el autocomplete de Discord (max 25 opciones)
            const tracks = res.tracks.slice(0, 10).map(track => {
                const artist = track.author || 'Desconocido';
                const duration = track.isStream ? "LIVE" : new Date(track.length).toISOString().slice(14, 19);
                const sourceIcon = track.sourceName === 'spotify' ? '🟢' : '🎵';
                // Discord autocomplete limit: 100 chars per option name
                const maxTitleLen = 95 - artist.length - duration.length - 6; // space for icon, " - ", " []"
                const title = track.title.length > maxTitleLen ? track.title.substring(0, maxTitleLen - 3) + "..." : track.title;
                return {
                    name: `${sourceIcon} ${title} - ${artist} [${duration}]`.substring(0, 100),
                    value: track.uri
                };
            });

            // Añadimos la opción de buscar texto exacto al final
            tracks.push({ name: `🔍 Buscar texto exacto: "${focusedValue.substring(0, 70)}"`, value: focusedValue });

            await interaction.respond(tracks);

        } catch (error) {
            console.error("Error en autocomplete:", error);
            await interaction.respond([{ name: `🔍 Buscar: "${focusedValue.substring(0, 80)}"`, value: focusedValue }]).catch(() => { });
        }
    },

    async execute(interaction, client) {
        const { options, member, guild, channel } = interaction;
        const query = options.getString("busqueda");
        const preferredEngine = options.getString("fuente"); // youtube, spotify, soundcloud o null

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
            const isNewPlayer = !player;
            if (!player) {
                const nodeName = client.getNodeForGuild(guild.id);
                player = await client.manager.createPlayer({
                    guildId: guild.id,
                    voiceId: member.voice.channel.id,
                    textId: channel.id,
                    channelId: member.voice.channel.id,
                    textChannelId: channel.id,
                    nodeName,
                    volume: client.config.defaultVolume || 80,
                    deaf: true
                });
            }

            // Wait for Lavalink voice session if player is new
            if (isNewPlayer) await waitForPlayerReady(player);

            // 3. Metadata del player
            player.data = player.data || {};

            // 4. Detectar tipo de fuente y búsqueda
            const isUrl = /^https?:\/\//.test(query);
            const isSpotify = isSpotifyUrl(query);

            // Determinar motor de búsqueda
            let searchEngine;
            if (isUrl) {
                searchEngine = undefined; // Auto-detect para URLs
            } else if (preferredEngine) {
                searchEngine = preferredEngine; // Usar el motor seleccionado por el usuario
            } else {
                searchEngine = 'spotify'; // Default: Spotify para mejores resultados
            }

            // sourceLabel se determinará dinámicamente según el track real
            console.log(`🔍 Buscando: ${query} (Engine: ${searchEngine || 'auto'} | Spotify URL: ${isSpotify})`);

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

            // 6. Determinar color del embed según fuente
            const isResSpotify = isSpotify || (res.tracks[0]?.sourceName === 'spotify');
            const embedColor = isResSpotify ? SPOTIFY_COLOR : (client.config.colors.success || 0xFF0000);
            const sourceLabel = isResSpotify ? '🟢 Spotify' : getTrackSourceLabel(res.tracks[0]);

            // 7. Manejar Playlist / Álbum de Spotify
            if (res.type === 'PLAYLIST') {
                for (const track of res.tracks) player.queue.add(track);

                if (!player.playing && !player.paused) {
                    await waitForPlayerReady(player);
                    player.play();
                }

                const spotifyType = isSpotify ? getSpotifyType(query) : null;
                const typeLabel = spotifyType === 'album' ? '💿 Álbum' :
                    spotifyType === 'artist' ? '👤 Artista' :
                        spotifyType === 'playlist' ? '📋 Playlist' : '📋 Playlist';
                const icon = isSpotify ? '🟢' : '✅';

                const playlistEmbed = new EmbedBuilder()
                    .setColor(embedColor)
                    .setAuthor({
                        name: isSpotify ? 'Spotify' : 'Playlist',
                        iconURL: isSpotify ? 'https://i.imgur.com/qvdqySa.png' : client.user.displayAvatarURL()
                    })
                    .setDescription(`${icon} **${typeLabel} cargada:** [${res.playlistName}](${query})\n\n🎵 **${res.tracks.length}** canciones añadidas a la cola`)
                    .setFooter({ text: `Solicitado por ${member.user.tag} • ${sourceLabel}` })
                    .setTimestamp();

                return interaction.editReply({ embeds: [playlistEmbed] });
            }

            // 8. Manejar Resultado Único (URL directa, selección de autocomplete)
            if (isUrl || res.tracks.length === 1 || query.startsWith('http')) {
                const track = res.tracks[0];
                player.queue.add(track);
                if (!player.playing && !player.paused) {
                    await waitForPlayerReady(player);
                    player.play();
                }

                const isTrackSpotify = isSpotify || track.sourceName === 'spotify';
                const trackColor = isTrackSpotify ? SPOTIFY_COLOR : (client.config.colors.success || 0xFF0000);
                const trackLabel = getTrackSourceLabel(track);

                const trackEmbed = new EmbedBuilder()
                    .setColor(trackColor)
                    .setAuthor({
                        name: isTrackSpotify ? 'Spotify' : 'Añadido a la cola',
                        iconURL: isTrackSpotify ? 'https://i.imgur.com/qvdqySa.png' : client.user.displayAvatarURL()
                    })
                    .setDescription(`✅ **Añadido a la cola:** [${track.title}](${track.uri})`)
                    .addFields(
                        { name: '👤 Artista', value: track.author || 'Desconocido', inline: true },
                        { name: '⏱️ Duración', value: track.isStream ? '🔴 LIVE' : new Date(track.length).toISOString().slice(14, 19), inline: true }
                    )
                    .setThumbnail(track.artworkUrl || track.thumbnail || null)
                    .setFooter({ text: `Solicitado por ${member.user.tag} • ${trackLabel}` });

                return interaction.editReply({ embeds: [trackEmbed] });
            }

            // 9. Manejar Selección Múltiple (búsqueda de texto, NO URL)
            if (!isUrl && res.tracks.length > 1) {
                const maxOptions = res.tracks.slice(0, 10);

                const selectOptions = maxOptions.map((track, i) => {
                    const title = track.title.length > 90 ? track.title.substring(0, 87) + "..." : track.title;
                    const duration = track.isStream ? "LIVE" : new Date(track.length).toISOString().slice(14, 19);
                    const sourceIcon = track.sourceName === 'spotify' ? '🟢' : '🎵';

                    return {
                        label: `${i + 1}. ${title}`,
                        description: `Por: ${track.author} | ⏱️ ${duration} ${sourceIcon}`,
                        value: i.toString()
                    };
                });

                const menu = new StringSelectMenuBuilder()
                    .setCustomId('search-select')
                    .setPlaceholder('👇 Selecciona una canción')
                    .addOptions(selectOptions);

                const row = new ActionRowBuilder().addComponents(menu);

                const selectEmbed = new EmbedBuilder()
                    .setColor(searchEngine === 'spotify' ? SPOTIFY_COLOR : (client.config.colors.music || 0xFF0000))
                    .setAuthor({
                        name: `Resultados de búsqueda ${sourceLabel}`,
                        iconURL: client.user.displayAvatarURL()
                    })
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
                        await i.deferUpdate();

                        const selectedIndex = parseInt(i.values[0]);
                        const track = res.tracks[selectedIndex];

                        player.queue.add(track);
                        if (!player.playing && !player.paused) {
                            await waitForPlayerReady(player);
                            player.play();
                        }

                        const isTrackSpotify = track.sourceName === 'spotify';
                        const trackColor = isTrackSpotify ? SPOTIFY_COLOR : (client.config.colors.success || 0xFF0000);

                        const successEmbed = new EmbedBuilder()
                            .setColor(trackColor)
                            .setAuthor({
                                name: isTrackSpotify ? 'Spotify' : 'Añadido a la cola',
                                iconURL: isTrackSpotify ? 'https://i.imgur.com/qvdqySa.png' : client.user.displayAvatarURL()
                            })
                            .setDescription(`✅ **Añadido a la cola:** [${track.title}](${track.uri})`)
                            .setThumbnail(track.artworkUrl || track.thumbnail || null)
                            .setFooter({ text: `Solicitado por ${member.user.tag}` });

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
