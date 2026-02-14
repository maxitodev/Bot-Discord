const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("📚 Muestra la lista de comandos disponibles"),

    async execute(interaction, client) {
        const color = (client.config && client.config.colors && client.config.colors.main)
            ? client.config.colors.main
            : 0x0099ff;

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle("📖 Comandos del Bot")
            .setDescription("Todos los comandos disponibles organizados por categoría.")
            .addFields(
                {
                    name: "🎵 Música",
                    value: [
                        "**/play** `<canción o URL>` — Reproduce (Spotify, YouTube, SoundCloud)",
                        "**/spotify buscar** `<query>` — Busca directo en Spotify",
                        "**/spotify playlist** `<url>` — Carga playlist de Spotify",
                        "**/spotify album** `<url>` — Carga álbum de Spotify",
                        "**/spotify artista** `<url>` — Top tracks de un artista",
                        "**/skip** — Salta canción",
                        "**/jump** `<posición>` — Salta a una canción en la cola",
                        "**/pause** · **/resume** — Pausa / Reanuda",
                        "**/stop** — Detiene y desconecta",
                    ].join("\n")
                },
                {
                    name: "📜 Cola y Reproducción",
                    value: [
                        "**/queue** — Muestra la cola",
                        "**/nowplaying** — Info de la canción actual",
                        "**/lyrics** `[busqueda]` — Letras de la canción",
                        "**/shuffle** — Mezcla la cola",
                        "**/loop** `<modo>` — Repetir (off / canción / cola)",
                        "**/volume** `<0-150>` — Ajusta el volumen",
                        "**/seek** `<tiempo>` — Salta a un punto",
                        "**/filters** — Filtros de audio (bass, nightcore...)",
                        "**/remove** `<posición>` — Quita canción de la cola",
                        "**/clear** — Limpia toda la cola",
                    ].join("\n")
                },
                {
                    name: "😂 Diversión",
                    value: "**/meme** — Meme aleatorio de Reddit"
                },
                {
                    name: "ℹ️ General",
                    value: "**/help** — Este mensaje\n**/ping** — Latencia del bot"
                }
            )
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .setFooter({
                text: `${interaction.user.tag} • Búsqueda por defecto: Spotify 🟢`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        return interaction.reply({ embeds: [embed] });
    }
};
