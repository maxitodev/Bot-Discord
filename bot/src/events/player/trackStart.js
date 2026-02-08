const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { formatDuration } = require("../../utils/formatDuration");

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
        // Esto corrige el audio trabado al inicio de CADA canción
        try {
            // Pausar para permitir que el buffer se llene
            await player.pause(true);
            // Esperar para buffering (más tiempo solo en la primera canción)
            const bufferTime = player._firstTrackPlayed ? 1500 : 2500;
            player._firstTrackPlayed = true;
            await new Promise(resolve => setTimeout(resolve, bufferTime));
            // Reanudar reproducción con buffer lleno
            await player.pause(false);
        } catch (e) {
            console.warn("Pre-buffer skip:", e.message);
        }

        // --- MODERN MINIMALIST UI (DARK) ---

        const duration = track.isStream ? "🔴 LIVE" : formatDuration(track.length);

        // Visual Progress Bar using Blocks
        // ⬛⬛⬛⬜⬜⬜⬜⬜⬜
        const progress = '🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬';

        const embed = new EmbedBuilder()
            .setColor(client.config.colors.main) // Black/Dark
            .setAuthor({ name: "Ahora Reproduciendo", iconURL: client.user.displayAvatarURL() })
            .setDescription(`
            ## [${track.title}](${track.uri})
            
            \`${progress}\` \`[ 0:00 / ${duration} ]\`
            
            👤 **Artista:** ${track.author}
            👤 **Pedido por:** <@${track.requester.id}>
            `)
            .setImage(track.thumbnail || null)
            .setFooter({ text: `Vol: ${player.volume}% • Loop: ${player.loop || 'Off'}` });

        // --- BOTONES: Minimalismo "Dark Mode" ---
        // Todos los botones en GRIS OSCURO (Secondary) para máximo contraste con los emojis de colores.
        // Esto resuelve el problema de "Rojo sobre Rojo" y se ve mucho más limpio.

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("music_loop").setEmoji("🔁").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("music_previous").setEmoji("⏮️").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("music_pause").setEmoji("⏯️").setStyle(ButtonStyle.Secondary), // Gris con icono blanco
            new ButtonBuilder().setCustomId("music_skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("music_shuffle").setEmoji("🔀").setStyle(ButtonStyle.Secondary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("music_voldown").setEmoji("🔉").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("music_stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger), // Stop en Rojo para emergencias
            new ButtonBuilder().setCustomId("music_volup").setEmoji("🔊").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("music_save").setLabel("Guardar").setEmoji("❤️").setStyle(ButtonStyle.Secondary), // Gris con Corazón Rojo (¡Alto Contraste!)
            new ButtonBuilder().setCustomId("music_queue").setEmoji("📜").setStyle(ButtonStyle.Secondary)
        );

        try {
            const message = await channel.send({
                content: `**💿 Reproduciendo en** <#${player.voiceId}>`,
                embeds: [embed],
                components: [row1, row2]
            });
            player.nowPlayingMessage = message;
        } catch (error) {
            console.error("Error UI:", error);
        }
    }
};
