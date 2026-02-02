const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { formatDuration, truncateText } = require("../../utils/formatDuration");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("jump")
        .setDescription("🚀 Salta instantáneamente a una canción específica de la cola")
        .addStringOption(option =>
            option
                .setName("cancion")
                .setDescription("El nombre o ID de la canción en la cola")
                .setAutocomplete(true)
                .setRequired(true)
        ),

    async autocomplete(interaction, client) {
        const focusedValue = interaction.options.getFocused();
        const player = client.manager.players.get(interaction.guild.id);

        if (!player || !player.queue.length) return interaction.respond([]);

        const choices = player.queue.map((track, index) => {
            const position = index + 1;
            const title = track.title.length > 80 ? track.title.substring(0, 80) + "..." : track.title;
            return {
                name: `${position}. ${title}`,
                value: position.toString()
            };
        });

        const filtered = choices.filter(choice =>
            choice.name.toLowerCase().includes(focusedValue.toLowerCase())
        );

        await interaction.respond(
            filtered.slice(0, 25)
        );
    },

    async execute(interaction, client) {
        const { member, guild } = interaction;
        const player = client.manager.players.get(guild.id);
        const input = interaction.options.getString("cancion");

        // Validaciones básicas
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

        if (!player || !player.queue.current) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} No hay música reproduciéndose en este momento.`)
                ],
                ephemeral: true
            });
        }

        if (member.voice.channel.id !== player.voiceId) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} Debes estar en el mismo canal de voz que yo.`)
                ],
                ephemeral: true
            });
        }

        let position = parseInt(input);

        // Si la entrada no es un número, intentar buscar por nombre
        if (isNaN(position)) {
            const index = player.queue.findIndex(track =>
                track.title.toLowerCase().includes(input.toLowerCase())
            );

            if (index !== -1) {
                position = index + 1;
            } else {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.colors.error)
                            .setDescription(`${client.config.emojis.error} No encontré ninguna canción que coincida con "**${input}**" en la cola.`)
                    ],
                    ephemeral: true
                });
            }
        }

        // Validar posición en la cola
        if (position > player.queue.length || position < 1) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} Esa posición no es válida. La cola tiene actualmente **${player.queue.length}** canciones.`)
                ],
                ephemeral: true
            });
        }

        // Obtener la canción objetivo
        const targetTrack = player.queue[position - 1];

        if (!targetTrack) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} No se pudo encontrar la canción en esa posición. ¿Quizás la cola cambió?`)
                ],
                ephemeral: true
            });
        }

        // Lógica de salto: MOVER la canción al principio sin borrar las anteriores
        if (position > 1) {
            // Sacamos la canción de su posición actual
            player.queue.splice(position - 1, 1);
            // La ponemos al principio de la cola
            player.queue.unshift(targetTrack);
        }

        // Saltamos la canción actual para que empiece la objetivo (que ahora es index 0)
        await player.skip();

        // Respuesta visual atractiva
        const embed = new EmbedBuilder()
            .setColor(client.config.colors.success)
            .setAuthor({
                name: "Salto en el Tiempo",
                iconURL: client.user.displayAvatarURL()
            })
            .setThumbnail(targetTrack.thumbnail || null)
            .setDescription(`He movido la canción al inicio de la cola y saltado hasta ella. **¡El resto de la cola sigue intacta!**`)
            .addFields(
                {
                    name: "🎵 Ahora suena",
                    value: `[${truncateText(targetTrack.title, 50)}](${targetTrack.uri})`,
                    inline: false
                },
                {
                    name: "⏱️ Duración",
                    value: `\`${targetTrack.isStream ? "🔴 LIVE" : formatDuration(targetTrack.length)}\``,
                    inline: true
                },
                {
                    name: "👤 Solicitado por",
                    value: targetTrack.requester ? `<@${targetTrack.requester.id}>` : "Desconocido",
                    inline: true
                }
            )
            .setFooter({
                text: `Saltado por ${member.user.tag}`,
                iconURL: member.user.displayAvatarURL()
            })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
