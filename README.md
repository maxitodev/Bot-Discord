<p align="center">
  <img src="https://img.shields.io/badge/Discord-Bot-7289DA?style=for-the-badge&logo=discord&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Spotify-Integrated-1DB954?style=for-the-badge&logo=spotify&logoColor=white" />
  <img src="https://img.shields.io/badge/Lavalink-v4-F44336?style=for-the-badge&logo=youtube-music&logoColor=white" />
</p>

# 🤖 Kahui Bot — Discord Bot Todo en Uno

> Bot multifuncional diseñado para llevar tu servidor de Discord al siguiente nivel.
> Música con Spotify, Minecraft, GTA V, Noticias, Memes y más — **todo en un solo bot**.

---

## 🎯 Tabla de Contenidos

- [✨ Características](#-características)
- [🎵 Sistema de Música](#-sistema-de-música)
- [🟢 Integración con Spotify](#-integración-con-spotify)
- [🌐 Multi-Nodo Lavalink](#-multi-nodo-lavalink--auto-failover)
- [🎮 Gaming](#-gaming)
- [📰 Noticias y Entretenimiento](#-noticias-y-entretenimiento)
- [🛡️ Moderación](#️-moderación)
- [📋 Lista Completa de Comandos](#-lista-completa-de-comandos)
- [🚀 Instalación](#-instalación)
- [⚙️ Configuración](#️-configuración)
- [📝 Créditos](#-créditos)

---

## ✨ Características

| Módulo | Descripción |
|--------|-------------|
| 🎵 **Música** | Reproducción de alta calidad con Lavalink — YouTube, Spotify, SoundCloud |
| 🟢 **Spotify** | Búsqueda nativa, playlists, álbumes y artistas de Spotify |
| 🌐 **Multi-Nodo** | Failover automático entre nodos Lavalink con health monitoring |
| 🎤 **Lyrics** | Letras de canciones sincronizadas automáticamente |
| 🎮 **Minecraft** | Monitor en tiempo real del servidor de Minecraft |
| 🔫 **GTA V** | Radar de actividad de jugadores de GTA V / FiveM |
| 📰 **Noticias** | Feed automático de noticias (México, IA, Tech, Gaming) |
| 😂 **Memes** | Memes automáticos de Reddit |
| 🧹 **Auto-Clean** | Limpieza automática de canales |
| 🛡️ **Moderación** | Purga de mensajes y administración |

---

## 🎵 Sistema de Música

El corazón del bot. Reproduce música de alta calidad usando **Lavalink** como motor de audio con soporte multi-plataforma.

### Fuentes Soportadas
- 🟢 **Spotify** — Tracks, playlists, álbumes, artistas *(búsqueda por defecto)*
- 🔴 **YouTube** — Videos, playlists, live streams
- 🟠 **SoundCloud** — Tracks y playlists

### Reproductor Interactivo
Cuando se reproduce una canción, aparece un **reproductor visual** con botones interactivos:

```
╔══════════════════════════════════════╗
║  🟢 Ahora Reproduciendo              ║
║  ══════════════════════════════════  ║
║  🎵 White Iverson                     ║
║  👤 Post Malone                       ║
║  🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬ [ 0:00 / 4:16 ]   ║
║                                      ║
║  🔁  ⏮️  ⏯️  ⏭️  🔀                ║
║  🔉  ⏹️  🔊  ♾️  📜                ║
║  ❤️ Guardar  |  🟢 Abrir en Spotify  ║
╚══════════════════════════════════════╝
```

### Funciones de Audio
- **Filtros de audio**: Bassboost, Nightcore, Vaporwave, 8D, Karaoke y más
- **Autoplay**: Reproducción continua de canciones similares
- **Loop**: Repetir canción o cola completa
- **Shuffle**: Mezclar cola aleatoriamente
- **Seek**: Avanza o retrocede a un punto específico
- **Volumen**: Control de 0% a 150%

---

## 🟢 Integración con Spotify

El bot tiene integración nativa con la **API de Spotify**, permitiendo buscar y reproducir contenido directamente desde Spotify.

### ¿Cómo funciona?
1. El bot usa la **API de Spotify** para obtener metadatos de las canciones (título, artista, artwork, duración)
2. Luego busca el audio correspondiente a través de **Lavalink** (YouTube/SoundCloud)
3. La calidad del audio es la misma, pero la **búsqueda** de Spotify es más precisa para música popular

### Tipos de Contenido Soportados
| Tipo | Ejemplo |
|------|---------|
| 🎵 Track | `https://open.spotify.com/track/...` |
| 📋 Playlist | `https://open.spotify.com/playlist/...` |
| 💿 Álbum | `https://open.spotify.com/album/...` |
| 👤 Artista | `https://open.spotify.com/artist/...` |
| 🔗 Short Link | `https://spotify.link/...` |

### Comandos Spotify
| Comando | Descripción |
|---------|-------------|
| `/play <URL de Spotify>` | Reproduce un track/playlist/album de Spotify |
| `/play <texto>` | Busca en Spotify por defecto |
| `/play <texto> fuente:YouTube` | Cambia motor de búsqueda a YouTube |
| `/spotify buscar <query>` | Búsqueda dedicada en Spotify |
| `/spotify playlist <url>` | Carga playlist completa |
| `/spotify album <url>` | Carga álbum completo |
| `/spotify artista <url>` | Top tracks de un artista |

### Autocomplete Inteligente
Al escribir en `/play`, el bot muestra sugerencias en tiempo real con **artista** y **duración**:
```
🟢 White Iverson - Post Malone [04:16]
🟢 Congratulations - Post Malone [03:41]
🟢 Sunflower - Post Malone [02:38]
🟢 rockstar - Post Malone [03:38]
🔍 Buscar texto exacto: "post malone"
```

---

## 🌐 Multi-Nodo Lavalink — Auto-Failover

El bot incluye un **sistema profesional de multi-nodo** que garantiza alta disponibilidad de la música. Si un nodo de Lavalink deja de funcionar, el bot **cambia automáticamente** al siguiente nodo disponible sin interrumpir la experiencia.

### ¿Cómo funciona?

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🟢 Nodo Serenetia (Prioridad 1)  ← ACTIVO              ║
║       └─ Conectado | Latencia: 45ms | Uptime: 2d 5h      ║
║                                                           ║
║   🟢 Nodo Jirayu (Prioridad 2)     ← RESPALDO            ║
║       └─ Conectado | Latencia: 78ms | Standby             ║
║                                                           ║
║   ⚙️ Failover: Automático | Health Check: cada 30s       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### Características del Sistema

| Función | Descripción |
|---------|-------------|
| 🔄 **Auto-Failover** | Si el nodo activo cae, cambia al siguiente automáticamente |
| 📊 **Health Monitoring** | Verifica el estado y latencia de cada nodo cada 30 segundos |
| ⭐ **Prioridad de Nodos** | Los nodos tienen prioridad configurable (menor = preferido) |
| 🔁 **Auto-Retorno** | Cada 5 min intenta regresar al nodo preferido si está disponible |
| 🔧 **Selección Manual** | Puedes cambiar de nodo manualmente con `/node switch` |
| 🚀 **Migración de Players** | Al cambiar de nodo, los players activos se migran automáticamente |
| 📈 **Reconexión Inteligente** | Intenta reconectar 3 veces antes de cambiar de nodo |

### Comandos de Nodo

| Comando | Descripción |
|---------|-------------|
| `/node status` | Muestra el estado de todos los nodos (latencia, uptime, errores) |
| `/node switch <nombre>` | Cambia manualmente a un nodo específico |
| `/node auto` | Restaura la selección automática de nodos |

### Flujo de Failover

```
  Nodo falla → Intento 1 de reconexión
                  ↓ falla
              Intento 2 de reconexión
                  ↓ falla
              Intento 3 de reconexión
                  ↓ falla
              🔄 CAMBIO AUTOMÁTICO al siguiente nodo disponible
                  ↓
              🚀 Migración de players activos
                  ↓
              ✅ Música continúa sin interrupción
                  ↓
              ⏱️ Cada 5 min: ¿Nodo preferido volvió? → Regresar
```

---

## 🎮 Gaming

### 🟩 Monitor de Minecraft
Monitoreo en tiempo real de tu servidor de Minecraft. Lee los logs del servidor y notifica en Discord.

- 🟢 **Conexiones**: Notifica cuando un jugador entra o sale
- 💀 **Muertes**: Reporta muertes con mensajes divertidos
- 🏆 **Logros**: Anuncia logros y desafíos completados
- 📊 **Estado**: Muestra jugadores en línea como estado del bot

**Configuración:** `/minecraft setup`

### 🔫 Radar de GTA V
Detecta cuando alguien de tu servidor empieza a jugar GTA V.

- 🎮 **Detección automática**: Detecta GTA V, FiveM, RAGE:MP
- ⏱️ **Tiempo de sesión**: Reporta cuánto tiempo jugó cada usuario
- 🚨 **Alertas divertidas**: "¡Llegó la chota!" estilo mexicano

**Configuración:** `/gta setup`

---

## 📰 Noticias y Entretenimiento

### 📰 Noticias Automáticas
Feed de noticias automático que publica cada 30 minutos en tu canal.

| Categoría | Fuentes |
|-----------|---------|
| 🇲🇽 México | Noticias nacionales |
| 🤖 Inteligencia Artificial | Últimas de AI |
| 📱 Tecnología | Tech news |
| 🎮 Videojuegos | Gaming news |

**Configuración:** `/news subscribe`

### 😂 Auto-Memes
Publica memes automáticamente desde Reddit.

- **Fuentes**: r/memes, r/dankmemes, r/maau
- **Sin repeticiones**: Historial de memes enviados
- **Intervalo configurable**: Desde minutos hasta días

**Configuración:** `/automeme setup`

---

## 🛡️ Moderación

### 🧹 Auto-Limpieza
Borra mensajes antiguos automáticamente en canales configurados.

- Configurable por canal
- Intervalo personalizable
- Ideal para canales de logs, música, bots

**Configuración:** `/autoclean setup`

### 🗑️ Purga Manual
Elimina mensajes masivamente de un canal.

**Comando:** `/purge <cantidad>`

---

## 📋 Lista Completa de Comandos

### 🎵 Música
| Comando | Descripción |
|---------|-------------|
| `/play <canción/URL>` | Reproduce música (Spotify, YouTube, SoundCloud) |
| `/stop` | Detiene la música y limpia la cola |
| `/skip` | Salta la canción actual |
| `/skipto <posición>` | Salta a una canción específica en la cola |
| `/pause` | Pausa/Reanuda la reproducción |
| `/resume` | Reanuda la reproducción |
| `/queue` | Muestra la cola de reproducción |
| `/nowplaying` | Muestra info de la canción actual |
| `/volume <0-150>` | Ajusta el volumen |
| `/lyrics` | Muestra la letra de la canción actual |
| `/lyrics busqueda:<texto>` | Busca letra de una canción específica |
| `/shuffle` | Mezcla la cola aleatoriamente |
| `/loop <modo>` | Cambia modo de repetición (off/track/queue) |
| `/seek <tiempo>` | Salta a un punto específico |
| `/filters` | Aplica filtros de audio |
| `/clear` | Limpia la cola de reproducción |
| `/remove <posición>` | Elimina una canción de la cola |

### 🌐 Nodos Lavalink
| Comando | Descripción |
|---------|-------------|
| `/node status` | Muestra estado de todos los nodos (latencia, uptime, errores) |
| `/node switch <nombre>` | Cambia manualmente a un nodo Lavalink |
| `/node auto` | Restaura la selección automática de nodos |

### 🟢 Spotify
| Comando | Descripción |
|---------|-------------|
| `/spotify buscar <query>` | Búsqueda dedicada en Spotify |
| `/spotify playlist <url>` | Carga una playlist de Spotify |
| `/spotify album <url>` | Carga un álbum de Spotify |
| `/spotify artista <url>` | Top tracks de un artista |

### 😂 Diversión
| Comando | Descripción |
|---------|-------------|
| `/meme` | Envía un meme aleatorio |
| `/automeme setup` | Configura memes automáticos |

### ⚙️ Administración
| Comando | Descripción |
|---------|-------------|
| `/admin` | Panel de configuración avanzado |
| `/minecraft setup` | Configura monitor de Minecraft |
| `/gta setup` | Configura radar de GTA V |
| `/news subscribe` | Suscríbete a noticias automáticas |
| `/autoclean setup` | Configura limpieza automática |
| `/purge <cantidad>` | Borra mensajes masivamente |

### ℹ️ General
| Comando | Descripción |
|---------|-------------|
| `/help` | Muestra lista de comandos |
| `/ping` | Muestra latencia del bot |

---

## 🚀 Instalación

### Requisitos
- **Node.js v18+** (para `fetch` nativo)
- **npm** (viene con Node.js)
- Un **servidor Lavalink** externo (o usa uno público)
- **Token de Discord Bot** ([Discord Developer Portal](https://discord.com/developers))
- **Spotify API credentials** ([Spotify Developer Dashboard](https://developer.spotify.com/dashboard))

### Pasos

```bash
# 1. Clonar el repositorio
git clone <tu-repo-url>
cd bot_v1.0

# 2. Instalar dependencias
cd bot
npm install

# 3. Configurar variables de entorno
# Copia el archivo de ejemplo y edita con tus credenciales
cp .env.example .env

# 4. Edita el archivo .env con tus credenciales (ver sección de Configuración)

# 5. Iniciar el bot
npm start

# Para desarrollo (auto-reload):
npm run dev
```

---

## ⚙️ Configuración

### Variables de Entorno (`.env`)

```env
# Discord Bot
DISCORD_TOKEN=tu_token_de_discord
CLIENT_ID=tu_client_id_de_discord

# Spotify API
SPOTIFY_CLIENT_ID=tu_spotify_client_id
SPOTIFY_CLIENT_SECRET=tu_spotify_client_secret
```

### Obtener Credenciales de Spotify

1. Ve a [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Inicia sesión con tu cuenta de Spotify
3. Haz clic en **"Create App"**
4. Llena el formulario (nombre, descripción)
5. Copia el **Client ID** y **Client Secret**
6. Agrégalos en tu archivo `.env`

### Configuración del Bot (`bot/src/config.js`)

```javascript
// Lavalink - Multi-Nodo con Auto-Failover
// Priority: menor número = mayor prioridad (nodo preferido)
nodes: [
    {
        name: "Serenetia",
        host: "lavalinkv4.serenetia.com",
        port: 443,
        password: "tu-password",
        secure: true,
        priority: 1         // Nodo preferido
    },
    {
        name: "Jirayu",
        host: "lavalink.jirayu.net",
        port: 443,
        password: "tu-password",
        secure: true,
        priority: 2         // Nodo de respaldo
    }
],

// Configuración de Failover Automático
nodeFailover: {
    enabled: true,                 // Activar auto-failover
    healthCheckInterval: 30000,    // Health check cada 30 segundos
    maxReconnectAttempts: 3,       // Intentos antes de cambiar de nodo
    reconnectDelay: 5000,          // Delay entre intentos (ms)
    preferredNodeRecheck: 300000,  // Recheck nodo preferido cada 5 min
},

// Spotify - Configuración de búsqueda
spotify: {
    playlistPageLimit: 3,    // Páginas de playlist (100 tracks/página)
    albumPageLimit: 2,       // Páginas de álbum (50 tracks/página)
    searchLimit: 10,         // Resultados de búsqueda
    searchMarket: 'MX',     // Mercado regional
},
```

---

## 🏗️ Estructura del Proyecto

```
bot_v1.0/
├── bot/
│   ├── .env                    # Variables de entorno (NO subir a git)
│   ├── .env.example            # Template de variables
│   ├── package.json            # Dependencias  
│   └── src/
│       ├── index.js            # Entry point
│       ├── config.js           # Configuración global (nodos, failover, etc.)
│       ├── structures/
│       │   └── Client.js       # Cliente principal del bot
│       ├── commands/
│       │   ├── general/        # Comandos generales (help, ping, admin...)
│       │   └── music/          # Comandos de música (play, spotify, node...)
│       ├── events/
│       │   ├── client/         # Eventos de Discord (ready, interactions...)
│       │   └── player/         # Eventos de Lavalink (nodeConnect, nodeDisconnect...)
│       └── utils/
│           ├── NodeManager.js  # Sistema de multi-nodo y auto-failover
│           ├── AutoMemeSystem.js
│           ├── NewsSystem.js
│           ├── MinecraftMonitor.js
│           ├── AutoCleanSystem.js
│           └── ConfigManager.js
├── README.md
└── .gitignore
```

---

## 🔧 Tecnologías Utilizadas

| Tecnología | Uso |
|------------|-----|
| [discord.js v14](https://discord.js.org/) | Framework de Discord |
| [Kazagumo v3](https://github.com/Takiyo0/Kazagumo) | Wrapper de Lavalink con queue |
| [Shoukaku v4](https://github.com/Deivu/Shoukaku) | Cliente de Lavalink |
| [kazagumo-spotify](https://github.com/Takiyo0/kazagumo-spotify) | Plugin de Spotify |
| [Lavalink v4](https://github.com/lavalink-devs/Lavalink) | Motor de audio |
| [LRCLIB](https://lrclib.net/) | API de letras de canciones |
| [dotenv](https://www.npmjs.com/package/dotenv) | Variables de entorno |

---

## 📝 Créditos

Desarrollado con ❤️ y mucho café por **MaxitoDev**.

<p align="center">
  <sub>Si te gusta el bot, dale una ⭐ al repo</sub>
</p>
