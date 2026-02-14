const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");

const SPOTIFY_COLOR = 0x1DB954;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lyrics")
        .setDescription("🎤 Muestra la letra de la canción actual o busca una")
        .addStringOption(option =>
            option
                .setName("busqueda")
                .setDescription("Buscar letra de una canción específica (opcional)")
                .setRequired(false)
        ),

    async execute(interaction, client) {
        const { guild } = interaction;
        const player = client.manager.players.get(guild.id);
        const customSearch = interaction.options.getString("busqueda");

        await interaction.deferReply();

        let searchTitle = "";
        let searchArtist = "";
        let track = null;

        if (customSearch) {
            // Búsqueda personalizada
            searchTitle = customSearch;
        } else if (player && player.queue.current) {
            // Usar canción actual
            track = player.queue.current;
            searchTitle = track.title;
            searchArtist = track.author || "";
        } else {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} No hay nada sonando. Usa \`/lyrics busqueda:<canción>\` para buscar.`)
                ]
            });
        }

        try {
            // Limpiar título para mejor búsqueda
            // Quitar cosas como (Official Video), [Lyrics], (feat. X), etc.
            const cleanTitle = searchTitle
                .replace(/\(official\s*(music\s*)?video\)/gi, "")
                .replace(/\(lyrics?\s*(video)?\)/gi, "")
                .replace(/\[.*?\]/g, "")
                .replace(/\(.*?remix.*?\)/gi, "")
                .replace(/official\s*audio/gi, "")
                .replace(/\s{2,}/g, " ")
                .trim();

            // Limpiar artista
            const cleanArtist = searchArtist
                .replace(/\s*-\s*topic$/gi, "")  // YouTube " - Topic" channels
                .replace(/vevo$/gi, "")
                .trim();

            // === ESTRATEGIA DE BÚSQUEDA MÚLTIPLE ===
            let lyrics = null;
            let matchData = null;

            // Intento 1: Búsqueda con artista + título (más precisa para Spotify)
            if (cleanArtist) {
                const url1 = `https://lrclib.net/api/search?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
                try {
                    const res1 = await fetch(url1);
                    const data1 = await res1.json();
                    if (data1 && data1.length > 0) {
                        matchData = data1[0];
                        lyrics = data1[0].plainLyrics || data1[0].syncedLyrics;
                    }
                } catch (e) { /* silencio, intentamos otro método */ }
            }

            // Intento 2: Búsqueda general con texto limpio
            if (!lyrics) {
                const searchQuery = cleanArtist ? `${cleanArtist} ${cleanTitle}` : cleanTitle;
                const url2 = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`;
                try {
                    const res2 = await fetch(url2);
                    const data2 = await res2.json();
                    if (data2 && data2.length > 0) {
                        matchData = data2[0];
                        lyrics = data2[0].plainLyrics || data2[0].syncedLyrics;
                    }
                } catch (e) { /* silencio */ }
            }

            // Intento 3: Solo con título original (sin limpiar)
            if (!lyrics && searchTitle !== cleanTitle) {
                const url3 = `https://lrclib.net/api/search?q=${encodeURIComponent(searchTitle)}`;
                try {
                    const res3 = await fetch(url3);
                    const data3 = await res3.json();
                    if (data3 && data3.length > 0) {
                        matchData = data3[0];
                        lyrics = data3[0].plainLyrics || data3[0].syncedLyrics;
                    }
                } catch (e) { /* silencio */ }
            }

            // Sin resultados
            if (!lyrics) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.colors.error)
                            .setDescription(`❌ No encontré letras para **${searchTitle}**${cleanArtist ? ` de **${cleanArtist}**` : ''}.`)
                            .setFooter({ text: 'Tip: Intenta con /lyrics busqueda:"artista - canción"' })
                    ]
                });
            }

            // Detectar fuente del track
            const isSpotify = track && (track.sourceName === 'spotify' || (track.uri && track.uri.includes('spotify.com')));
            const embedColor = isSpotify ? SPOTIFY_COLOR : client.config.colors.main;
            const sourceIcon = isSpotify ? '🟢' : '🎤';

            // Discord limita description a 4096 chars
            const displayLyrics = lyrics.length > 3800
                ? lyrics.substring(0, 3800) + "\n\n*... (letra truncada por límite de Discord)*"
                : lyrics;

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({
                    name: `${sourceIcon} Letras`,
                    iconURL: isSpotify ? 'https://i.imgur.com/qvdqySa.png' : client.user.displayAvatarURL()
                })
                .setTitle(`${matchData.trackName || searchTitle}`)
                .setDescription(`**${matchData.artistName || cleanArtist || 'Artista desconocido'}**\n\n${displayLyrics}`)
                .setFooter({ text: `Fuente: LRCLIB • ${matchData.albumName ? `Álbum: ${matchData.albumName}` : ''}` })
                .setTimestamp();

            // Si hay thumbnail del track, mostrarla
            if (track && (track.artworkUrl || track.thumbnail)) {
                embed.setThumbnail(track.artworkUrl || track.thumbnail);
            }

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Error en lyrics:", error);
            return interaction.editReply({
                content: `${client.config.emojis.error} **Error al buscar letras:** ${error.message}`
            });
        }
    }
};
