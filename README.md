# 🤖 MaxitoBot - El Bot Todo en Uno para Discord

¡Bienvenido a **MaxitoBot**! Un bot multifuncional diseñado para llevar tu servidor de Discord al siguiente nivel. Ya no necesitas 5 bots diferentes; MaxitoBot lo hace todo.

## ✨ Características Principales

### 🎵 Música de Alta Calidad
*   Reproducción desde YouTube, Spotify y SoundCloud.
*   **Autoplay Inteligente**: Actívalo con el botón ♾️ para que la música nunca se detenga.
*   **Filtros de Audio**: Bassboost, Nightcore, Vaporwave y más.
*   **Controles Interactivos**: Botones en el reproductor para pausar, saltar, repetir, mezclar y más.
*   Control total: `/play`, `/skip`, `/lyrics`, `/queue`.

### 🎮 Monitor de Minecraft
*   **Notificaciones en Tiempo Real**: Entérate al instante quién entra, sale o muere.
*   **Mensajes Divertidos**: Notificaciones personalizadas con estilo mexicano y memes.
*   **Logs Detallados**: Rastrea muertes, logros y desafíos.
*   **Estado del Bot**: Muestra cuántos jugadores hay en línea en tu servidor de Minecraft.
*   Comando: `/minecraft setup`

### 🔫 Radar de GTA V
*   **Detección de Actividad**: Avisa cuando alguien empieza a jugar GTA V (Vanilla, FiveM, etc.).
*   **Reportes de Sesión**: Te dice cuánto tiempo jugó cada usuario.
*   **Alertas Personalizadas**: Mensajes divertidos tipo "¡Llegó la chota!".
*   Comando: `/gta setup`

### 📰 Noticias Automatizadas
*   Mantén a tu comunidad informada con noticias automáticas cada 30 minutos.
*   **Categorías**:
    *   🇲🇽 Noticias México
    *   🤖 Inteligencia Artificial
    *   📱 Tecnología
    *   🎮 Videojuegos
*   Comando: `/news subscribe`

### 😂 Memes y Diversión
*   **Auto-Memes**: Publica memes automáticamente en tu canal de diversión.
*   Fuente: Los mejores subreddits (r/memes, r/dankmemes, r/maau).
*   Comando: `/automeme setup`

### 🛡️ Moderación y Limpieza
*   **Auto-Limpieza**: Borra mensajes viejos automáticamente en canales específicos (ej. #logs, #musica).
*   **Purga Manual**: Borra mensajes masivamente con `/purge`.
*   Comando: `/autoclean setup`

---

## 🚀 Comandos Rápidos

### 👤 Usuarios
*   `/help` - Muestra los comandos de música y diversión.
*   `/play <canción>` - Pone música.
*   `/meme` - Manda un meme random.

### 👑 Administradores
*   `/admin` - **¡IMPORTANTE!** Muestra el panel de configuración avanzado.
*   `/minecraft setup` - Configura el monitor de MC.
*   `/gta setup` - Configura el radar de GTA.
*   `/news subscribe` - Suscríbete a noticias.
*   `/autoclean setup` - Configura limpieza automática.

---

## 🛠️ Instalación y Requisitos

1.  **Node.js v16+** requerido.
2.  **Configuración**:
    *   Renombra `.env.example` a `.env` y pon tu Token de Discord.
    *   Configura `bot/src/config.js` con tu nodo Lavalink externo, colores y emojis.

```bash
# Instalar dependencias
cd bot
npm install

# Iniciar el bot
npm start
```

> **Nota:** El bot usa un servidor Lavalink externo para la reproducción de música. No necesitas instalar ni configurar Lavalink localmente.

## 📝 Créditos
Desarrollado con ❤️ y mucho café por **MaxitoDev**.
