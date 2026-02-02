const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
// const fetch = require("node-fetch"); // Native fetch is used in Node 18+

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lyrics")
        .setDescription("🎤 Muestra la letra de la canción actual"),

    async execute(interaction, client) {
        const { member, guild } = interaction;
        const player = client.manager.players.get(guild.id);

        await interaction.deferReply();

        if (!player || !player.queue.current) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.config.colors.error)
                        .setDescription(`${client.config.emojis.error} No hay nada sonando.`)
                ]
            });
        }

        const songTitle = player.queue.current.title;
        // Using a public Lyrics API (LRCLIB is free and good)
        // Alternatively can use genius-lyrics-api if key provided

        try {
            const safeTitle = encodeURIComponent(songTitle.replace(/[\(\)\[\]]/g, ""));
            const url = `https://lrclib.net/api/search?q=${safeTitle}`;

            // Using native fetch (Node 18+) or requiring it if needed. 
            // Assuming Node 18+ environment where fetch is global.
            const response = await fetch(url);
            const data = await response.json();

            if (!data || data.length === 0) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.config.colors.error)
                            .setDescription(`❌ No encontré letras para **${songTitle}**.`)
                    ]
                });
            }

            const lyrics = data[0].plainLyrics || data[0].syncedLyrics || "Letra no disponible en texto plano.";

            // Discord limits description to 4096 chars
            const chunks = lyrics.match(/[\s\S]{1,4000}/g) || [];

            const embed = new EmbedBuilder()
                .setColor(client.config.colors.main)
                .setTitle(`🎤 Letra: ${data[0].trackName} - ${data[0].artistName}`)
                .setDescription(chunks[0])
                .setFooter({ text: "Fuente: LRCLIB" });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            return interaction.editReply({ content: "❌ Error al buscar letras." });
        }
    }
};
