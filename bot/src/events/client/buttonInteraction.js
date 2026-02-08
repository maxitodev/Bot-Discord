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

        const safeReply = async (content, ephemeral = true) => {
            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({ content, ephemeral }).catch(() => { });
            }
            return interaction.reply({ content, ephemeral }).catch(() => { });
        };

        const action = interaction.customId.replace("music_", "");

        try {
            switch (action) {
                case "pause":
                    player.pause(!player.paused);
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: player.paused ? "⏸️ Pausado" : "▶️ Reanudado", ephemeral: true });
                    } else {
                        await interaction.update({ components: interaction.message.components }).catch(() => { });
                    }
                    break;

                case "skip":
                    player.skip();
                    await safeReply("⏭️ **Saltada**");
                    break;

                case "previous":
                    if (!player.queue.previous.length) return safeReply("❌ No hay canción previa");
                    // Logic to replay previous might need real implementation in player, but for now:
                    // client.manager.players.get(guild.id).queue.unshift(player.queue.previous.pop());
                    // player.stop();
                    // For now keeping original logic if it existed or just message
                    await safeReply("⏮️ **Función Previa** (WIP)");
                    break;

                case "stop":
                    player.destroy();
                    await safeReply("🛑 **Desconectado**");
                    break;

                case "shuffle":
                    player.queue.shuffle();
                    await safeReply("🔀 **Cola mezclada**");
                    break;

                case "loop":
                    const modes = ["none", "track", "queue"];
                    const currentMode = player.loop || "none";
                    const nextMode = modes[(modes.indexOf(currentMode) + 1) % modes.length];
                    player.setLoop(nextMode);
                    await safeReply(`🔁 Loop: **${nextMode}**`);
                    break;

                case "volup":
                    player.setVolume(Math.min(player.volume + 10, 150));
                    await safeReply(`🔊 Volumen: ${player.volume}%`);
                    break;

                case "voldown":
                    player.setVolume(Math.max(player.volume - 10, 0));
                    await safeReply(`🔉 Volumen: ${player.volume}%`);
                    break;

                case "queue":
                    const tracks = player.queue.slice(0, 10).map((t, i) => `${i + 1}. ${t.title.substring(0, 40)}`).join("\n");
                    const embed = new EmbedBuilder()
                        .setColor(client.config.colors.main)
                        .setTitle("Cola Actual")
                        .setDescription(tracks || "Cola vacía...");

                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ embeds: [embed], ephemeral: true }).catch(() => { });
                    } else {
                        await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => { });
                    }
                    break;

                case "filters":
                    await safeReply("🎛️ Usa el comando `/filters` para ajustar el audio.");
                    break;
            }
        } catch (error) {
            console.error(error);
            await safeReply("❌ Error ejecutando acción");
        }
    }
};
