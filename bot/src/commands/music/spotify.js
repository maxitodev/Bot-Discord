const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");

const SPOTIFY_COLOR = 0x1DB954;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("spotify")
        .setDescription("🟢 Funciones de Spotify")
        .addSubcommand(sub =>
            sub.setName("buscar")
                .setDescription("🔍 Busca canciones directamente en Spotify")
                .addStringOption(opt =>
                    opt.setName("query")
                        .setDescription("Nombre de la canción o artista")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName("playlist")
                .setDescription("📋 Carga una playlist de Spotify")
                .addStringOption(opt =>
                    opt.setName("url")
                        .setDescription("URL de la playlist de Spotify")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName("album")
                .setDescription("💿 Carga un álbum de Spotify")
                .addStringOption(opt =>
                    opt.setName("url")
                        .setDescription("URL del álbum de Spotify")
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName("artista")
                .setDescription("👤 Reproduce top tracks de un artista de Spotify")
                .addStringOption(opt =>
                    opt.setName("url")
                        .setDescription("URL del artista de Spotify o nombre")
                        .setRequired(true)
                )
        ),

    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const { member, guild, channel } = interaction;

        // Validaciones
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

        // Check Spotify is configured
        if (!client.config.spotify?.clientId || !client.config.spotify?.clientSecret) {
            return interaction.reply({
                content: `${client.config.emojis.error} **Spotify no está configurado.** Contacta al administrador.`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.deferReply();

        try {
            // Get or create player
            let player = client.manager.players.get(guild.id);
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
            player.data = player.data || {};

            switch (subcommand) {
                case 'buscar': {
                    const query = interaction.options.getString("query");

                    const res = await client.manager.search(query, {
                        requester: member.user,
                        engine: 'spotify'
                    });

                    if (!res || !res.tracks || res.tracks.length === 0) {
                        return interaction.editReply({
                            content: `${client.config.emojis.error} **No se encontraron resultados en Spotify para:** \`${query}\``
                        });
                    }

                    // Show top 5 results with details
                    const tracks = res.tracks.slice(0, 5);
                    const trackList = tracks.map((t, i) => {
                        const duration = t.isStream ? '🔴 LIVE' : new Date(t.length).toISOString().slice(14, 19);
                        return `**${i + 1}.** [${t.title}](${t.uri})\n   └ 👤 ${t.author} • ⏱️ ${duration}`;
                    }).join('\n\n');

                    // Auto play the first result
                    const firstTrack = tracks[0];
                    player.queue.add(firstTrack);
                    if (!player.playing && !player.paused) player.play();

                    const embed = new EmbedBuilder()
                        .setColor(SPOTIFY_COLOR)
                        .setAuthor({
                            name: '🟢 Spotify Search',
                            iconURL: 'https://i.imgur.com/qvdqySa.png'
                        })
                        .setTitle(`Resultados para: "${query}"`)
                        .setDescription(`▶️ **Reproduciendo:** ${firstTrack.title}\n\n${trackList}`)
                        .setThumbnail(firstTrack.artworkUrl || firstTrack.thumbnail || null)
                        .setFooter({ text: `Solicitado por ${member.user.tag} • Spotify` })
                        .setTimestamp();

                    return interaction.editReply({ embeds: [embed] });
                }

                case 'playlist': {
                    const url = interaction.options.getString("url");

                    if (!url.includes('spotify.com/playlist/') && !url.includes('spotify.link/')) {
                        return interaction.editReply({
                            content: `${client.config.emojis.error} **URL de playlist de Spotify inválida.** Ejemplo: \`https://open.spotify.com/playlist/...\``
                        });
                    }

                    const res = await client.manager.search(url, { requester: member.user });

                    if (!res || !res.tracks || res.tracks.length === 0) {
                        return interaction.editReply({
                            content: `${client.config.emojis.error} **No se pudo cargar la playlist.** Verifica que sea pública.`
                        });
                    }

                    for (const track of res.tracks) player.queue.add(track);
                    if (!player.playing && !player.paused) player.play();

                    const embed = new EmbedBuilder()
                        .setColor(SPOTIFY_COLOR)
                        .setAuthor({
                            name: '🟢 Spotify Playlist',
                            iconURL: 'https://i.imgur.com/qvdqySa.png'
                        })
                        .setTitle(`📋 ${res.playlistName || 'Playlist'}`)
                        .setDescription(
                            `✅ **${res.tracks.length} canciones** añadidas a la cola\n\n` +
                            `**Primeras canciones:**\n` +
                            res.tracks.slice(0, 5).map((t, i) => `${i + 1}. ${t.title} - ${t.author}`).join('\n') +
                            (res.tracks.length > 5 ? `\n... y ${res.tracks.length - 5} más` : '')
                        )
                        .setFooter({ text: `Solicitado por ${member.user.tag} • Spotify` })
                        .setTimestamp();

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel('Abrir Playlist en Spotify')
                            .setEmoji('🟢')
                            .setStyle(ButtonStyle.Link)
                            .setURL(url)
                    );

                    return interaction.editReply({ embeds: [embed], components: [row] });
                }

                case 'album': {
                    const url = interaction.options.getString("url");

                    if (!url.includes('spotify.com/album/') && !url.includes('spotify.link/')) {
                        return interaction.editReply({
                            content: `${client.config.emojis.error} **URL de álbum de Spotify inválida.** Ejemplo: \`https://open.spotify.com/album/...\``
                        });
                    }

                    const res = await client.manager.search(url, { requester: member.user });

                    if (!res || !res.tracks || res.tracks.length === 0) {
                        return interaction.editReply({
                            content: `${client.config.emojis.error} **No se pudo cargar el álbum.**`
                        });
                    }

                    for (const track of res.tracks) player.queue.add(track);
                    if (!player.playing && !player.paused) player.play();

                    const embed = new EmbedBuilder()
                        .setColor(SPOTIFY_COLOR)
                        .setAuthor({
                            name: '🟢 Spotify Album',
                            iconURL: 'https://i.imgur.com/qvdqySa.png'
                        })
                        .setTitle(`💿 ${res.playlistName || 'Álbum'}`)
                        .setDescription(
                            `✅ **${res.tracks.length} canciones** del álbum añadidas\n\n` +
                            `**Tracklist:**\n` +
                            res.tracks.slice(0, 8).map((t, i) => `${i + 1}. ${t.title}`).join('\n') +
                            (res.tracks.length > 8 ? `\n... y ${res.tracks.length - 8} más` : '')
                        )
                        .setThumbnail(res.tracks[0]?.artworkUrl || res.tracks[0]?.thumbnail || null)
                        .setFooter({ text: `Solicitado por ${member.user.tag} • Spotify` })
                        .setTimestamp();

                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel('Abrir Álbum en Spotify')
                            .setEmoji('🟢')
                            .setStyle(ButtonStyle.Link)
                            .setURL(url)
                    );

                    return interaction.editReply({ embeds: [embed], components: [row] });
                }

                case 'artista': {
                    const input = interaction.options.getString("url");

                    // Support both URL and name search
                    let query = input;
                    if (!input.includes('spotify.com') && !input.includes('spotify.link')) {
                        // Search by name - use artist search format
                        query = input; // kazagumo-spotify handles this
                    }

                    const res = await client.manager.search(query, {
                        requester: member.user,
                        engine: 'spotify'
                    });

                    if (!res || !res.tracks || res.tracks.length === 0) {
                        return interaction.editReply({
                            content: `${client.config.emojis.error} **No se encontraron canciones del artista.**`
                        });
                    }

                    // For artist links, it loads top tracks
                    for (const track of res.tracks) player.queue.add(track);
                    if (!player.playing && !player.paused) player.play();

                    const artistName = res.playlistName || res.tracks[0]?.author || 'Artista';

                    const embed = new EmbedBuilder()
                        .setColor(SPOTIFY_COLOR)
                        .setAuthor({
                            name: '🟢 Spotify Artist',
                            iconURL: 'https://i.imgur.com/qvdqySa.png'
                        })
                        .setTitle(`👤 ${artistName}`)
                        .setDescription(
                            `✅ **${res.tracks.length} canciones** del artista añadidas\n\n` +
                            `**Top Tracks:**\n` +
                            res.tracks.slice(0, 10).map((t, i) => `${i + 1}. ${t.title}`).join('\n') +
                            (res.tracks.length > 10 ? `\n... y ${res.tracks.length - 10} más` : '')
                        )
                        .setThumbnail(res.tracks[0]?.artworkUrl || res.tracks[0]?.thumbnail || null)
                        .setFooter({ text: `Solicitado por ${member.user.tag} • Spotify` })
                        .setTimestamp();

                    return interaction.editReply({ embeds: [embed] });
                }
            }

        } catch (error) {
            console.error("Error en spotify command:", error);
            return interaction.editReply({
                content: `${client.config.emojis.error} **Error de Spotify:** ${error.message}`
            }).catch(() => { });
        }
    }
};
