const { EmbedBuilder } = require("discord.js");
const { formatDuration } = require("../../utils/formatDuration");

module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        if (!interaction.isButton()) return;
        if (!interaction.customId.startsWith("music_")) return;

        const { member, guild } = interaction;
        const player = client.manager.players.get(guild.id);

        // Allow 'save' button even without being in voice channel or player active (it saves current song)
        if (interaction.customId === "music_save") {
            if (!player || !player.queue.current) {
                return interaction.reply({ content: "❌ No hay canción sonando para guardar.", ephemeral: true });
            }
            const track = player.queue.current;
            const dmEmbed = new EmbedBuilder()
                .setColor(client.config.colors.main)
                .setTitle("💾 Canción Guardada")
                .setThumbnail(track.thumbnail)
                .setDescription(`**[${track.title}](${track.uri})**\n\n👤 **Autor:** ${track.author}\n⏱️ **Duración:** ${formatDuration(track.length)}`)
                .setFooter({ text: `Guardada desde ${guild.name}` })
                .setTimestamp();

            try {
                await member.send({ embeds: [dmEmbed] });
                return interaction.reply({ content: "✅ Te he enviado la canción al DM.", ephemeral: true });
            } catch (e) {
                return interaction.reply({ content: "❌ No pude enviarte el DM. ¿Tienes los mensajes directos cerrados?", ephemeral: true });
            }
        }

        // Standard checks for other controls
        if (!member.voice.channel) {
            return interaction.reply({ content: "❌ Entra a un canal de voz.", ephemeral: true });
        }

        if (!player) {
            return interaction.reply({ content: "❌ No hay sesión de música activa.", ephemeral: true });
        }

        if (member.voice.channel.id !== player.voiceId) {
            return interaction.reply({ content: "❌ Debes estar en mi mismo canal.", ephemeral: true });
        }

        const action = interaction.customId.replace("music_", "");

        try {
            switch (action) {
                case "pause":
                    player.pause(!player.paused);
                    await interaction.update({
                        components: interaction.message.components
                    });
                    break;

                case "skip":
                    player.skip();
                    await interaction.reply({ content: "⏭️ **Skipped**", ephemeral: true });
                    break;

                case "previous":
                    if (!player.queue.previous.length) return interaction.reply({ content: "❌ No hay canción previa", ephemeral: true });
                    player.seek(0);
                    await interaction.reply({ content: "⏮️ **Replay**", ephemeral: true });
                    break;

                case "stop":
                    player.destroy();
                    await interaction.reply({ content: "🛑 **Desconectado**", ephemeral: true });
                    break;

                case "shuffle":
                    player.queue.shuffle();
                    await interaction.reply({ content: "🔀 **Cola mezclada**", ephemeral: true });
                    break;

                case "loop":
                    const modes = ["none", "track", "queue"];
                    const nextMode = modes[(modes.indexOf(player.loop || "none") + 1) % modes.length];
                    player.setLoop(nextMode);
                    await interaction.reply({ content: `🔁 Loop: **${nextMode}**`, ephemeral: true });
                    break;

                // Volume buttons (handled silently or with update)
                case "volup":
                    player.setVolume(Math.min(player.volume + 10, 150));
                    await interaction.reply({ content: `🔊 Volumen: ${player.volume}%`, ephemeral: true });
                    break;

                case "voldown":
                    player.setVolume(Math.max(player.volume - 10, 0));
                    await interaction.reply({ content: `🔉 Volumen: ${player.volume}%`, ephemeral: true });
                    break;

                case "queue":
                    // Show queue logic (simplified for this update)
                    const tracks = player.queue.slice(0, 10).map((t, i) => `${i + 1}. ${t.title.substring(0, 40)}`).join("\n");
                    await interaction.reply({
                        embeds: [new EmbedBuilder().setColor(client.config.colors.main).setTitle("Cola Actual").setDescription(tracks || "Cola vacía...")],
                        ephemeral: true
                    });
                    break;

                case "filters":
                    // Shortcut to filters (if command existed, but simple reply for now)
                    await interaction.reply({ content: "🎛️ Usa el comando `/filters` para ajustar el audio.", ephemeral: true });
                    break;
            }
        } catch (error) {
            console.error(error);
            if (!interaction.replied) interaction.reply({ content: "Error ejecutando acción", ephemeral: true });
        }
    }
};
