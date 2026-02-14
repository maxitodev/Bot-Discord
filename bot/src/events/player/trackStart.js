const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { formatDuration } = require("../../utils/formatDuration");

// Spotify brand color
const SPOTIFY_COLOR = 0x1DB954;

module.exports = {
    name: "playerStart",
    async execute(player, track, client) {
        const channel = client.channels.cache.get(player.textId);
        if (!channel) return;

        if (player.nowPlayingMessage) {
            try { await player.nowPlayingMessage.delete(); } catch (e) { }
        }

        // Cancel Auto Disconnect if exists
        if (player.disconnectTimeout) {
            clearTimeout(player.disconnectTimeout);
            player.disconnectTimeout = null;
        }

        // Pre-buffer: Pausar momentáneamente para que Lavalink llene el buffer
        try {
            await player.pause(true);
            const bufferTime = player._firstTrackPlayed ? 1500 : 2500;
            player._firstTrackPlayed = true;
            await new Promise(resolve => setTimeout(resolve, bufferTime));
            await player.pause(false);
        } catch (e) {
            console.warn("Pre-buffer skip:", e.message);
        }

        // --- DETECT SOURCE ---
        const isSpotify = track.sourceName === 'spotify' ||
            (track.uri && track.uri.includes('spotify.com'));
        const isSoundCloud = track.sourceName === 'soundcloud';

        // Determine colors and branding
        const embedColor = isSpotify ? SPOTIFY_COLOR : client.config.colors.main;
        const sourceIcon = isSpotify ? '🟢' : isSoundCloud ? '🟠' : '🔴';
        const sourceName = isSpotify ? 'Spotify' : isSoundCloud ? 'SoundCloud' : 'YouTube';

        const duration = track.isStream ? "🔴 LIVE" : formatDuration(track.length);
        const progress = '🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬';

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setAuthor({
                name: `${sourceIcon} Ahora Reproduciendo`,
                iconURL: isSpotify ? 'https://i.imgur.com/qvdqySa.png' : client.user.displayAvatarURL()
            })
            .setDescription(`
            ## [${track.title}](${track.uri})
            
            \`${progress}\` \`[ 0:00 / ${duration} ]\`
            
            👤 **Artista:** ${track.author}
            👤 **Pedido por:** <@${track.requester.id}>
            `)
            .setImage(track.thumbnail || null)
            .setFooter({
                text: `${sourceIcon} ${sourceName} • Vol: ${player.volume}% • Loop: ${player.loop || 'Off'} • Autoplay: ${player.data?.autoplay ? 'ON' : 'OFF'}`
            });

        // --- BOTONES ---
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("music_loop").setEmoji("🔁").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("music_previous").setEmoji("⏮️").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("music_pause").setEmoji("⏯️").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("music_skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("music_shuffle").setEmoji("🔀").setStyle(ButtonStyle.Secondary)
        );

        const isAutoplayOn = player.data?.autoplay === true;

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("music_voldown").setEmoji("🔉").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("music_stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId("music_volup").setEmoji("🔊").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("music_autoplay").setEmoji("♾️").setStyle(isAutoplayOn ? ButtonStyle.Success : ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("music_queue").setEmoji("📜").setStyle(ButtonStyle.Secondary)
        );

        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("music_save").setLabel("Guardar").setEmoji("❤️").setStyle(ButtonStyle.Secondary),
            // Add Spotify link button if it's a Spotify track
            ...(isSpotify && track.uri ? [
                new ButtonBuilder()
                    .setLabel("Abrir en Spotify")
                    .setEmoji("🟢")
                    .setStyle(ButtonStyle.Link)
                    .setURL(track.uri.startsWith('http') ? track.uri : `https://open.spotify.com/track/${track.identifier || ''}`)
            ] : [])
        );

        try {
            const message = await channel.send({
                content: `**💿 Reproduciendo en** <#${player.voiceId}>`,
                embeds: [embed],
                components: [row1, row2, row3]
            });
            player.nowPlayingMessage = message;
        } catch (error) {
            console.error("Error UI:", error);
        }
    }
};
