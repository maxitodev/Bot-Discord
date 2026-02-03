# 🎵 Discord Music Bot

Un bot de música profesional para Discord con soporte para YouTube, Spotify, SoundCloud y más. Construido con Discord.js v14, Lavalink y Kazagumo.

![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-v18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Lavalink](https://img.shields.io/badge/Lavalink-v4-orange?style=for-the-badge)

## ✨ Características

### 🎵 Sistema de Música
- 🎶 Reproduce música de YouTube, SoundCloud, Bandcamp, Twitch y más
- 🔊 Controles interactivos con botones
- 📜 Sistema de cola de reproducción
- 🔁 Modos de loop (canción/cola)
- 🔀 Shuffle de la cola
- 🎚️ Control de volumen
- ⏭️ Saltar, pausar, reanudar
- 🔍 Búsqueda de canciones
- 💾 Alto rendimiento con Lavalink

### 🎭 Sistema de Memes
- 🤖 Publicación automática de memes de Reddit
- 🎯 Múltiples categorías (Gaming, Tech, Animales, Español, etc.)
- ⏱️ Intervalos configurables (30 min - 24 horas)
- 🛡️ Filtro NSFW automático
- 🔄 Prevención de duplicados
- 📊 Configuración por servidor

## 📋 Requisitos

- [Node.js](https://nodejs.org/) v18 o superior
- [Java](https://www.oracle.com/java/technologies/downloads/) 17 o superior (para Lavalink)
- [Lavalink](https://github.com/lavalink-devs/Lavalink/releases) v4.x
- Un bot de Discord ([crear uno aquí](https://discord.com/developers/applications))

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/discord-music-bot.git
cd discord-music-bot
```

### 2. Instalar dependencias del bot

```bash
cd bot
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `bot`:

```env
DISCORD_TOKEN=tu_token_de_discord
CLIENT_ID=tu_client_id
```

### 4. Configurar Lavalink

**⚠️ NOTA IMPORTANTE:** 
Por defecto, este bot está configurado en `bot/src/config.js` para usar un **servidor Lavalink público** (Serenetia Lavalink). 

**¿Por qué?**
Hicimos este cambio para **evitar problemas de bloqueos de YouTube (cookies/IP)** que ocurren frecuentemente al alojar el bot en un VPS (como Contabo, AWS, etc.). Los servidores públicos gestionan las sesiones de YouTube por nosotros.

Si prefieres usar tu propio servidor Lavalink local:
1. Descarga [Lavalink.jar](https://github.com/lavalink-devs/Lavalink/releases)
2. Edita `bot/src/config.js` para cambiar `url` a `localhost:2333` y `auth` a tu contraseña.
3. Configura `application.yml` con tus propios tokens si es necesario.

### 5. Iniciar el bot

Si usas la configuración por defecto (Lavalink público), solo necesitas:

```bash
cd bot
npm start
```

*(Si usas Lavalink local, recuerda iniciarlo primero en otra terminal con `java -jar Lavalink.jar`)*

## 🎮 Comandos

### 🎵 Comandos de Música

| Comando | Descripción |
|---------|-------------|
| `/play <canción>` | Reproduce una canción o URL |
| `/pause` | Pausa la reproducción |
| `/resume` | Reanuda la reproducción |
| `/skip` | Salta a la siguiente canción |
| `/jump` | Salta a una canción de la cola |
| `/stop` | Detiene la música y desconecta |
| `/queue` | Muestra la cola de reproducción |
| `/nowplaying` | Muestra la canción actual |
| `/volume <0-150>` | Ajusta el volumen |
| `/loop <modo>` | Activa el loop (off/track/queue) |
| `/shuffle` | Mezcla la cola |
| `/seek <tiempo>` | Salta a un tiempo específico |
| `/remove <posición>` | Elimina una canción de la cola |
| `/clear` | Limpia toda la cola |

### 🎭 Comandos de Memes

| Comando | Descripción |
|---------|-------------|
| `/meme [categoria]` | Obtiene un meme aleatorio de Reddit |
| `/automeme setup` | Configura la publicación automática de memes |
| `/automeme stop` | Detiene la publicación automática |
| `/automeme status` | Muestra el estado de la configuración |

### ⚙️ Comandos Generales

| Comando | Descripción |
|---------|-------------|
| `/help` | Muestra todos los comandos |
| `/ping` | Muestra la latencia del bot |

## 🎛️ Controles con Botones

Cuando se reproduce una canción, aparecen botones interactivos:

| Botón | Función |
|-------|---------|
| 🔀 | Mezclar cola |
| ⏮️ | Reiniciar canción |
| ⏸️ | Pausar/Reanudar |
| ⏭️ | Siguiente canción |
| 🔁 | Cambiar modo de loop |
| 🔉 | Bajar volumen |
| 🔊 | Subir volumen |
| 📜 | Ver cola |
| ⏹️ | Detener |

## 📁 Estructura del Proyecto

```
discord-music-bot/
├── bot/
│   ├── src/
│   │   ├── commands/
│   │   │   ├── general/
│   │   │   │   ├── help.js
│   │   │   │   ├── ping.js
│   │   │   │   ├── meme.js
│   │   │   │   └── automeme.js
│   │   │   └── music/
│   │   │       ├── play.js
│   │   │       ├── pause.js
│   │   │       ├── resume.js
│   │   │       ├── skip.js
│   │   │       ├── jump.js
│   │   │       ├── stop.js
│   │   │       ├── queue.js
│   │   │       ├── nowplaying.js
│   │   │       ├── volume.js
│   │   │       ├── loop.js
│   │   │       ├── shuffle.js
│   │   │       ├── seek.js
│   │   │       ├── remove.js
│   │   │       └── clear.js
│   │   ├── events/
│   │   │   ├── client/
│   │   │   └── player/
│   │   ├── structures/
│   │   │   └── Client.js
│   │   ├── utils/
│   │   │   ├── formatDuration.js
│   │   │   └── AutoMemeSystem.js
│   │   ├── config.js
│   │   └── index.js
│   ├── package.json
│   └── .env
├── plugins/
├── application.yml
├── Lavalink.jar
├── AUTOMEME_README.md
└── README.md
```

## ⚙️ Configuración Avanzada

### application.yml

```yaml
# Ajustes de buffer (aumentar si hay cortes)
bufferDurationMs: 10000
frameBufferDurationMs: 30000

# Calidad de audio
opusEncodingQuality: 10
resamplingQuality: HIGH
```

### Clientes de YouTube

Los clientes disponibles son:
- `MUSIC` - YouTube Music (recomendado con OAuth)
- `WEB` - Cliente web estándar
- `MWEB` - Cliente web móvil

## 🐛 Solución de Problemas

### El bot no se conecta a Lavalink
- Verifica que Lavalink esté corriendo en el puerto 2333
- Revisa que la contraseña en `config.js` coincida con `application.yml`

### Las canciones no cargan
- Configura OAuth de YouTube para mejor compatibilidad
- Prueba con diferentes clientes en `application.yml`

### La música se traba
- Aumenta `bufferDurationMs` y `frameBufferDurationMs`
- Verifica tu conexión a internet

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

## ⭐ Agradecimientos

- [Discord.js](https://discord.js.org/)
- [Lavalink](https://github.com/lavalink-devs/Lavalink)
- [Kazagumo](https://github.com/Takiyo0/Kazagumo)
- [Shoukaku](https://github.com/Deivu/Shoukaku)

---

<p align="center">
  Hecho con ❤️ para la comunidad de Discord
</p>
