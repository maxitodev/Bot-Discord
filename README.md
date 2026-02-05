# 🤖 MaxitoBot - El Bot Todo en Uno para Discord

¡Bienvenido a **MaxitoBot**! Un bot multifuncional diseñado para llevar tu servidor de Discord al siguiente nivel. Ya no necesitas 5 bots diferentes; MaxitoBot lo hace todo.

## ✨ Características Principales

### 🎵 Música de Alta Calidad
*   Reproducción desde YouTube, Spotify y SoundCloud.
*   **Autoplay Inteligente**: La música nunca se detiene.
*   **Filtros de Audio**: Bassboost, Nightcore, Vaporwave y más.
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
2.  **Lavalink**: Necesario para la música (incluido en `application.yml`).
3.  **Configuración**:
    *   Renombra `.env.example` a `.env` y pon tu Token.
    *   Configura `config.js` con tus colores y emojis.

```bash
# Instalar dependencias
npm install

# Iniciar el bot
npm start
```

## 📝 Créditos
Desarrollado con ❤️ y mucho café por **MaxitoDev**.
