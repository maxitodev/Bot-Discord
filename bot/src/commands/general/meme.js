const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("meme")
        .setDescription("🎭 Obtiene un meme aleatorio de Reddit")
        .addStringOption(option =>
            option
                .setName("categoria")
                .setDescription("Categoría del meme")
                .setRequired(false)
                .addChoices(
                    { name: "🎭 Memes Generales", value: "memes" },
                    { name: "😂 Dank Memes", value: "dankmemes" },
                    { name: "🎮 Gaming", value: "gaming" },
                    { name: "📱 Tecnología", value: "ProgrammerHumor" },
                    { name: "🐶 Animales", value: "aww" },
                    { name: "🎬 Películas/Series", value: "memes" },
                    { name: "🌎 Español", value: "MAAU" }
                )
        ),

    async execute(interaction, client) {
        try {
            await interaction.deferReply();

            const categoria = interaction.options.getString("categoria") || "memes";

            // Subreddits disponibles
            const subreddits = {
                memes: ["memes", "dankmemes", "me_irl"],
                dankmemes: ["dankmemes", "dankvideos"],
                gaming: ["gaming", "gamingmemes"],
                ProgrammerHumor: ["ProgrammerHumor", "programmerreactions"],
                aww: ["aww", "rarepuppers", "AnimalsBeingDerps"],
                MAAU: ["MAAU", "MemesEnEspanol", "yo_elvr"]
            };

            // Seleccionar subreddit aleatorio de la categoría
            const subredditList = subreddits[categoria] || subreddits.memes;
            const selectedSubreddit = subredditList[Math.floor(Math.random() * subredditList.length)];

            // Obtener meme de Reddit
            const meme = await fetchMeme(selectedSubreddit);

            if (!meme) {
                return interaction.editReply({
                    content: "❌ No se pudo obtener un meme en este momento. Intenta de nuevo.",
                    ephemeral: true
                });
            }

            // Safe color access
            const color = (client.config && client.config.colors && client.config.colors.main)
                ? client.config.colors.main
                : 0xFF4500; // Reddit orange

            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(meme.title.length > 256 ? meme.title.substring(0, 253) + "..." : meme.title)
                .setImage(meme.url)
                .setFooter({
                    text: `👍 ${meme.ups} upvotes | r/${meme.subreddit} | Solicitado por ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp()
                .setURL(meme.postLink);

            // Agregar NSFW warning si es necesario
            if (meme.nsfw && !interaction.channel.nsfw) {
                return interaction.editReply({
                    content: "⚠️ Este meme está marcado como NSFW. Usa este comando en un canal NSFW.",
                    ephemeral: true
                });
            }

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Error en meme command:", error);

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "❌ Ocurrió un error al obtener el meme. Intenta de nuevo.",
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: "❌ Ocurrió un error al obtener el meme. Intenta de nuevo."
                });
            }
        }
    }
};

/**
 * Obtiene un meme aleatorio usando meme-api.com
 * @param {string} subreddit - Nombre del subreddit (categoría)
 * @returns {Promise<Object|null>} Objeto con datos del meme o null si falla
 */
async function fetchMeme(subreddit) {
    try {
        // meme-api.com permite especificar subreddit directamente
        // Endpoint: https://meme-api.com/gimme/{subreddit}
        const url = `https://meme-api.com/gimme/${subreddit}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Meme API error: ${response.status}`);
        }

        const data = await response.json();

        // Verificar que tengamos datos válidos
        if (!data || !data.url) {
            return null;
        }

        return {
            title: data.title || 'Meme Random',
            url: data.url,
            ups: data.ups || 0,
            nsfw: data.nsfw || false,
            subreddit: data.subreddit || subreddit,
            postLink: data.postLink || 'https://reddit.com',
            author: data.author || 'unknown'
        };

    } catch (error) {
        console.error("Error fetching meme from meme-api.com:", error);
        return null;
    }
}
