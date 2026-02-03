# 🎭 Sistema de Auto-Memes

Sistema automático de publicación de memes en Discord usando la API de Reddit.

## 📋 Características

- ✅ Publicación automática de memes en intervalos configurables
- ✅ Múltiples categorías de memes (General, Gaming, Tecnología, Animales, Español, etc.)
- ✅ Prevención de duplicados
- ✅ Filtro NSFW automático
- ✅ Configuración por servidor
- ✅ Comandos de administración completos

## 🚀 Comandos Disponibles

### `/meme [categoria]`
Obtiene un meme aleatorio de Reddit.

**Opciones:**
- `categoria` (opcional): Categoría del meme a obtener
  - 🎭 Memes Generales
  - 😂 Dank Memes
  - 🎮 Gaming
  - 📱 Tecnología
  - 🐶 Animales
  - 🌎 Español

**Ejemplo:**
```
/meme
/meme categoria:Gaming
/meme categoria:Español
```

### `/automeme setup`
Configura la publicación automática de memes (requiere permisos de administrador).

**Opciones:**
- `canal` (requerido): Canal donde se publicarán los memes
- `intervalo` (requerido): Intervalo en minutos (30-1440)
- `categoria` (opcional): Categoría de memes a publicar

**Ejemplo:**
```
/automeme setup canal:#memes intervalo:60 categoria:Gaming
```

### `/automeme stop`
Detiene la publicación automática de memes.

**Ejemplo:**
```
/automeme stop
```

### `/automeme status`
Muestra el estado actual de la configuración de auto-memes.

**Ejemplo:**
```
/automeme status
```

## ⚙️ Configuración

### Intervalos Recomendados

- **Muy Activo**: 30-60 minutos
- **Activo**: 60-120 minutos (1-2 horas)
- **Moderado**: 180-360 minutos (3-6 horas)
- **Pasivo**: 720-1440 minutos (12-24 horas)

### Categorías Disponibles

| Categoría | Subreddits | Descripción |
|-----------|-----------|-------------|
| Memes Generales | r/memes, r/dankmemes, r/me_irl | Memes variados y populares |
| Dank Memes | r/dankmemes, r/dankvideos | Memes más "dank" |
| Gaming | r/gaming, r/gamingmemes | Memes de videojuegos |
| Tecnología | r/ProgrammerHumor, r/programmerreactions | Memes de programación |
| Animales | r/aww, r/rarepuppers, r/AnimalsBeingDerps | Animales adorables |
| Español | r/MAAU, r/MemesEnEspanol, r/yo_elvr | Memes en español |

## 🛡️ Seguridad

- **Filtro NSFW**: Los memes marcados como NSFW solo se publican en canales NSFW
- **Validación de Permisos**: El bot verifica que tenga permisos para enviar mensajes
- **Prevención de Duplicados**: Sistema que evita publicar el mismo meme repetidamente
- **Manejo de Errores**: Si falla la obtención de un meme, se omite sin detener el sistema

## 📊 Persistencia

⚠️ **IMPORTANTE**: La configuración actual se almacena en memoria. Si el bot se reinicia, deberás configurar el auto-meme nuevamente.

Para implementar persistencia permanente, considera agregar una base de datos (SQLite, MongoDB, etc.).

## 🔧 Solución de Problemas

### El bot no publica memes automáticamente

1. Verifica que el bot tenga permisos en el canal configurado
2. Revisa la consola para ver si hay errores
3. Usa `/automeme status` para verificar la configuración
4. Asegúrate de que el canal no haya sido eliminado

### Los memes se repiten

El sistema mantiene un historial de los últimos 50 memes por servidor para evitar duplicados. Si aún así se repiten, puede ser porque:
- El subreddit tiene pocos posts nuevos
- El intervalo es muy corto
- Considera cambiar de categoría

### Error de API de Reddit

Si Reddit está caído o bloqueando las peticiones:
- El sistema automáticamente omitirá ese intervalo
- Intenta de nuevo más tarde
- Considera usar un intervalo más largo

## 📝 Notas

- El sistema usa la API pública de Reddit (no requiere autenticación)
- Solo se publican posts con imágenes (no videos ni texto)
- Los posts fijados (stickied) se filtran automáticamente
- El sistema se reinicia automáticamente cuando el bot se inicia

## 🎨 Personalización

Para agregar más subreddits, edita el archivo `src/utils/AutoMemeSystem.js`:

```javascript
const subreddits = {
    memes: ["memes", "dankmemes", "me_irl"],
    // Agrega más categorías aquí
    custom: ["tuSubreddit1", "tuSubreddit2"]
};
```

Luego actualiza las opciones en `src/commands/general/automeme.js` y `src/commands/general/meme.js`.
