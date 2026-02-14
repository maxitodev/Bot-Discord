const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { formatDuration, createProgressBar } = require("../../utils/formatDuration");

const SPOTIFY_COLOR = 0x1DB954;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("🎵 Muestra información de la canción actual"),

    async execute(interaction, client) {
        const { guild } = interaction;
        const player = client.manager.players.get(guild.id);

        // Check if there's an active player
        if (!player || !player.queue.current) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} No hay música reproduciéndose.`)
                ],
                ephemeral: true
            });
        }

        const track = player.queue.current;
        const position = player.shoukaku.position;
        const duration = track.length;

        // Detect source
        const isSpotify = track.sourceName === 'spotify' || (track.uri && track.uri.includes('spotify.com'));
        const isSoundCloud = track.sourceName === 'soundcloud';
        const sourceIcon = isSpotify ? '🟢' : isSoundCloud ? '🟠' : '🔴';
        const sourceName = isSpotify ? 'Spotify' : isSoundCloud ? 'SoundCloud' : track.sourceName || 'Desconocida';
        const embedColor = isSpotify ? SPOTIFY_COLOR : client.config.colors.music;

        // Create progress bar
        const progressBar = track.isStream
            ? "🔴 EN VIVO"
            : `${formatDuration(position)} ${createProgressBar(position, duration)} ${formatDuration(duration)}`;

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({
                name: player.paused ? "⏸️ Pausado" : `${sourceIcon} Reproduciendo ahora`,
                iconURL: isSpotify ? 'https://i.imgur.com/qvdqySa.png' : client.user.displayAvatarURL()
            })
            .setTitle(track.title)
            .setURL(track.uri)
            .setThumbnail(track.artworkUrl || track.thumbnail || null)
            .setDescription(`\n${progressBar}\n`)
            .addFields(
                {
                    name: "👤 Artista",
                    value: track.author || "Desconocido",
                    inline: true
                },
                {
                    name: "🔊 Volumen",
                    value: `${Math.round(player.volume * 100)}%`,
                    inline: true
                },
                {
                    name: "🔁 Loop",
                    value: player.loop === "track" ? "🔂 Canción" : player.loop === "queue" ? "🔁 Cola" : "Desactivado",
                    inline: true
                },
                {
                    name: "📜 En cola",
                    value: `${player.queue.length} canciones`,
                    inline: true
                },
                {
                    name: "🎧 Solicitado por",
                    value: track.requester ? `<@${track.requester.id}>` : "Desconocido",
                    inline: true
                }
            )
            .setFooter({
                text: `${sourceIcon} Fuente: ${sourceName}`
            })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
