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
 * Obtiene un meme aleatorio de un subreddit
 * @param {string} subreddit - Nombre del subreddit
 * @returns {Promise<Object|null>} Objeto con datos del meme o null si falla
 */
async function fetchMeme(subreddit) {
    try {
        const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=100`, {
            headers: {
                'User-Agent': 'Discord-Meme-Bot/1.0'
            }
        });

        if (!response.ok) {
            throw new Error(`Reddit API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.data || !data.data.children || data.data.children.length === 0) {
            return null;
        }

        // Filtrar solo posts con imágenes
        const imagePosts = data.data.children.filter(post => {
            const postData = post.data;
            return (
                !postData.is_video &&
                !postData.stickied &&
                postData.post_hint === "image" &&
                (postData.url.endsWith('.jpg') ||
                    postData.url.endsWith('.png') ||
                    postData.url.endsWith('.gif') ||
                    postData.url.includes('i.redd.it') ||
                    postData.url.includes('i.imgur.com'))
            );
        });

        if (imagePosts.length === 0) {
            return null;
        }

        // Seleccionar post aleatorio
        const randomPost = imagePosts[Math.floor(Math.random() * imagePosts.length)].data;

        return {
            title: randomPost.title,
            url: randomPost.url,
            ups: randomPost.ups,
            nsfw: randomPost.over_18,
            subreddit: randomPost.subreddit,
            postLink: `https://reddit.com${randomPost.permalink}`
        };

    } catch (error) {
        console.error("Error fetching meme from Reddit:", error);
        return null;
    }
}
