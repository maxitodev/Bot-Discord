const { EmbedBuilder, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
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
                return interaction.reply({ content: "❌ No hay canción sonando para guardar.", flags: MessageFlags.Ephemeral });
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
                return interaction.reply({ content: "✅ Te he enviado la canción al DM.", flags: MessageFlags.Ephemeral });
            } catch (e) {
                return interaction.reply({ content: "❌ No pude enviarte el DM. ¿Tienes los mensajes directos cerrados?", flags: MessageFlags.Ephemeral });
            }
        }

        // Standard checks for other controls
        if (!member.voice.channel) {
            return interaction.reply({ content: "❌ Entra a un canal de voz.", flags: MessageFlags.Ephemeral });
        }

        if (!player) {
            return interaction.reply({ content: "❌ No hay sesión de música activa.", flags: MessageFlags.Ephemeral });
        }

        if (member.voice.channel.id !== player.voiceId) {
            return interaction.reply({ content: "❌ Debes estar en mi mismo canal.", flags: MessageFlags.Ephemeral });
        }

        const safeReply = async (content, ephemeral = true) => {
            const flags = ephemeral ? MessageFlags.Ephemeral : undefined;
            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({ content, flags }).catch(() => { });
            }
            return interaction.reply({ content, flags }).catch(() => { });
        };

        const action = interaction.customId.replace("music_", "");

        try {
            switch (action) {
                case "pause":
                    player.pause(!player.paused);
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: player.paused ? "⏸️ Pausado" : "▶️ Reanudado", flags: MessageFlags.Ephemeral });
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
                        await interaction.followUp({ embeds: [embed], flags: MessageFlags.Ephemeral }).catch(() => { });
                    } else {
                        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral }).catch(() => { });
                    }
                    break;

                case "autoplay":
                    player.data = player.data || {};
                    player.data.autoplay = !player.data.autoplay;
                    const autoplayState = player.data.autoplay;

                    // Actualizar el botón visualmente (verde = ON, gris = OFF)
                    try {
                        const rows = interaction.message.components.map(row => {
                            const newRow = new ActionRowBuilder();
                            newRow.addComponents(
                                row.components.map(btn => {
                                    const newBtn = ButtonBuilder.from(btn);
                                    if (btn.customId === "music_autoplay") {
                                        newBtn.setStyle(autoplayState ? ButtonStyle.Success : ButtonStyle.Secondary);
                                    }
                                    return newBtn;
                                })
                            );
                            return newRow;
                        });

                        // Actualizar también el footer del embed
                        const embeds = interaction.message.embeds.map(e => {
                            const newEmbed = EmbedBuilder.from(e);
                            const footerText = e.footer?.text || '';
                            const newFooter = footerText.replace(/Autoplay: (ON|OFF)/, `Autoplay: ${autoplayState ? 'ON' : 'OFF'}`);
                            newEmbed.setFooter({ text: newFooter });
                            return newEmbed;
                        });

                        await interaction.update({ embeds, components: rows });
                    } catch (e) {
                        // Fallback si falla el update visual
                        await safeReply(`♾️ Autoplay: **${autoplayState ? 'Activado' : 'Desactivado'}**`);
                    }
                    break;
            }
        } catch (error) {
            console.error(error);
            await safeReply("❌ Error ejecutando acción");
        }
    }
};
