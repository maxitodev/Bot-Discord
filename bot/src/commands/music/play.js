const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
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

        // Check if user is in a voice channel
        if (!member.voice.channel) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} Debes estar en un canal de voz para usar este comando.`)
                ],
                ephemeral: true
            });
        }

        // Check bot permissions
        const permissions = member.voice.channel.permissionsFor(client.user);
        if (!permissions.has("Connect") || !permissions.has("Speak")) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} No tengo permisos para conectarme o hablar en tu canal de voz.`)
                ],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            // Determine if it's a URL or search query
            const isUrl = /^https?:\/\//.test(query);
            const searchQuery = isUrl ? query : `ytsearch:${query}`;
            
            // Search for the track
            const result = await client.manager.search(searchQuery, { requester: member });

            if (!result || !result.tracks || !result.tracks.length) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.colors.error)
                            .setDescription(`${client.config.emojis.error} No se encontraron resultados para: **${query}**`)
                    ]
                });
            }

            // Create or get player
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

            // Handle playlist
            if (result.type === "PLAYLIST") {
                for (const track of result.tracks) {
                    player.queue.add(track);
                }

                const totalDuration = result.tracks.reduce((acc, track) => acc + (track.length || 0), 0);

                const embed = new EmbedBuilder()
                    .setColor(client.config.colors.success)
                    .setAuthor({ name: "Playlist añadida a la cola" })
                    .setTitle(result.playlistName || "Playlist")
                    .setDescription(`${client.config.emojis.queue} **${result.tracks.length}** canciones añadidas a la cola`)
                    .addFields(
                        { 
                            name: "⏱️ Duración total", 
                            value: formatDuration(totalDuration), 
                            inline: true 
                        },
                        { 
                            name: "🎧 Solicitado por", 
                            value: `${member}`, 
                            inline: true 
                        }
                    )
                    .setTimestamp();

                if (!player.playing && !player.paused) player.play();
                
                return interaction.editReply({ embeds: [embed] });
            }

            // Handle single track or search result
            const track = result.tracks[0];
            player.queue.add(track);

            const embed = new EmbedBuilder()
                .setColor(client.config.colors.success)
                .setAuthor({ name: player.playing ? "Añadido a la cola" : "Reproduciendo ahora" })
                .setTitle(track.title)
                .setURL(track.uri)
                .setThumbnail(track.thumbnail || null)
                .addFields(
                    { 
                        name: "👤 Artista", 
                        value: track.author || "Desconocido", 
                        inline: true 
                    },
                    { 
                        name: "⏱️ Duración", 
                        value: track.isStream ? "🔴 En vivo" : formatDuration(track.length), 
                        inline: true 
                    },
                    { 
                        name: "📍 Posición", 
                        value: player.playing ? `#${player.queue.length}` : "Reproduciendo", 
                        inline: true 
                    }
                )
                .setFooter({ text: `Solicitado por ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
                .setTimestamp();

            if (!player.playing && !player.paused) player.play();

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Error en comando play:", error);
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} Ha ocurrido un error al buscar la canción.`)
                ]
            });
        }
    }
};
