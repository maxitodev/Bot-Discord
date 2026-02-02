const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    async execute(interaction, client) {
        if (!interaction.isButton()) return;
        if (!interaction.customId.startsWith("music_")) return;

        const { member, guild } = interaction;
        const player = client.manager.players.get(guild.id);

        // Verificar si el usuario está en un canal de voz
        if (!member.voice.channel) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription("❌ Debes estar en un canal de voz.")
                ],
                ephemeral: true
            });
        }

        // Verificar si hay un reproductor activo
        if (!player) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription("❌ No hay música reproduciéndose.")
                ],
                ephemeral: true
            });
        }

        // Verificar si está en el mismo canal de voz
        if (member.voice.channel.id !== player.voiceId) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription("❌ Debes estar en el mismo canal de voz.")
                ],
                ephemeral: true
            });
        }

        const action = interaction.customId.replace("music_", "");

        try {
            switch (action) {
                case "pause": {
                    if (player.paused) {
                        await player.pause(false);
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client.config.colors.success)
                                    .setDescription("▶️ Música reanudada")
                            ],
                            ephemeral: true
                        });
                    } else {
                        await player.pause(true);
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client.config.colors.success)
                                    .setDescription("⏸️ Música pausada")
                            ],
                            ephemeral: true
                        });
                    }
                    break;
                }

                case "skip": {
                    if (!player.queue.current) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client.config.colors.error)
                                    .setDescription("❌ No hay canción para saltar.")
                            ],
                            ephemeral: true
                        });
                    }
                    await player.skip();
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client.config.colors.success)
                                .setDescription("⏭️ Canción saltada")
                        ],
                        ephemeral: true
                    });
                    break;
                }

                case "previous": {
                    if (!player.queue.previous || player.queue.previous.length === 0) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client.config.colors.error)
                                    .setDescription("❌ No hay canción anterior.")
                            ],
                            ephemeral: true
                        });
                    }
                    await player.seek(0);
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client.config.colors.success)
                                .setDescription("⏮️ Reiniciando canción")
                        ],
                        ephemeral: true
                    });
                    break;
                }

                case "stop": {
                    await player.destroy();
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client.config.colors.success)
                                .setDescription("⏹️ Música detenida y desconectado")
                        ],
                        ephemeral: true
                    });
                    break;
                }

                case "shuffle": {
                    if (player.queue.length < 2) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client.config.colors.error)
                                    .setDescription("❌ Necesitas al menos 2 canciones en la cola.")
                            ],
                            ephemeral: true
                        });
                    }
                    player.queue.shuffle();
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client.config.colors.success)
                                .setDescription("🔀 Cola mezclada")
                        ],
                        ephemeral: true
                    });
                    break;
                }

                case "loop": {
                    const modes = ["none", "track", "queue"];
                    const modeNames = { none: "Desactivado", track: "Canción", queue: "Cola" };
                    const modeEmojis = { none: "➡️", track: "🔂", queue: "🔁" };
                    
                    const currentIndex = modes.indexOf(player.loop || "none");
                    const nextMode = modes[(currentIndex + 1) % modes.length];
                    
                    player.setLoop(nextMode);
                    
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client.config.colors.success)
                                .setDescription(`${modeEmojis[nextMode]} Loop: **${modeNames[nextMode]}**`)
                        ],
                        ephemeral: true
                    });
                    break;
                }

                case "volup": {
                    const currentVol = player.volume || 100;
                    const newVol = Math.min(currentVol + 10, 150);
                    player.setVolume(newVol);
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client.config.colors.success)
                                .setDescription(`🔊 Volumen: **${newVol}%**`)
                        ],
                        ephemeral: true
                    });
                    break;
                }

                case "voldown": {
                    const currentVol = player.volume || 100;
                    const newVol = Math.max(currentVol - 10, 0);
                    player.setVolume(newVol);
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client.config.colors.success)
                                .setDescription(`🔉 Volumen: **${newVol}%**`)
                        ],
                        ephemeral: true
                    });
                    break;
                }

                case "queue": {
                    const queue = player.queue;
                    const current = queue.current;

                    if (!current) {
                        return interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client.config.colors.error)
                                    .setDescription("❌ No hay música reproduciéndose.")
                            ],
                            ephemeral: true
                        });
                    }

                    let description = `**Ahora:** [${current.title}](${current.uri})\n\n`;

                    if (queue.length > 0) {
                        const tracks = queue.slice(0, 10);
                        description += "**Siguiente:**\n";
                        description += tracks.map((track, i) => 
                            `\`${i + 1}.\` [${track.title.substring(0, 40)}](${track.uri})`
                        ).join("\n");

                        if (queue.length > 10) {
                            description += `\n\n*...y ${queue.length - 10} más*`;
                        }
                    } else {
                        description += "*No hay más canciones en la cola*";
                    }

                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client.config.colors.music)
                                .setTitle("📜 Cola de reproducción")
                                .setDescription(description)
                        ],
                        ephemeral: true
                    });
                    break;
                }

                default:
                    await interaction.reply({
                        content: "Acción no reconocida.",
                        ephemeral: true
                    });
            }
        } catch (error) {
            console.error("Error en botón de música:", error);
            if (!interaction.replied) {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.colors.error)
                            .setDescription("❌ Ocurrió un error al ejecutar esta acción.")
                    ],
                    ephemeral: true
                });
            }
        }
    }
};
