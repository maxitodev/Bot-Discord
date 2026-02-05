# 🎭 Sistema de Memes - meme-api.com

## 📋 Descripción
El bot usa **meme-api.com** para obtener memes de Reddit sin necesidad de autenticación ni configuración adicional.

## ✅ Ventajas
- ✅ **Sin configuración**: No requiere API keys ni credenciales
- ✅ **Funciona en VPS**: Sin restricciones de IP
- ✅ **Gratis**: Completamente gratuito
- ✅ **Confiable**: Servicio estable y rápido
- ✅ **Memes de Reddit**: Obtiene memes directamente de subreddits populares

## 🎮 Comandos disponibles

### `/meme [categoría]`
Obtiene un meme aleatorio de la categoría seleccionada.

**Categorías disponibles:**
- 🎭 **Memes Generales** - Memes variados (memes, dankmemes, me_irl)
- 😂 **Dank Memes** - Memes más atrevidos (dankmemes, dankvideos)
- 🎮 **Gaming** - Memes de videojuegos (gaming, gamingmemes)
- 📱 **Tecnología** - Humor de programadores (ProgrammerHumor, programmerreactions)
- 🐶 **Animales** - Animales adorables (aww, rarepuppers, AnimalsBeingDerps)
- 🌎 **Español** - Memes en español (MAAU, MemesEnEspanol, yo_elvr)

### `/automeme`
Configura la publicación automática de memes en un canal.

**Opciones:**
- **Activar/Desactivar**: Inicia o detiene el sistema de auto-memes
- **Configurar canal**: Selecciona el canal donde se publicarán
- **Configurar intervalo**: Define cada cuánto tiempo se publica (en minutos)
- **Configurar categoría**: Elige la categoría de memes a publicar

## 🔧 Cómo funciona

### API Endpoint
```
https://meme-api.com/gimme/{subreddit}
```

### Ejemplo de respuesta
```json
{
  "postLink": "https://redd.it/abc123",
  "subreddit": "memes",
  "title": "Título del meme",
  "url": "https://i.redd.it/imagen.jpg",
  "nsfw": false,
  "spoiler": false,
  "author": "usuario_reddit",
  "ups": 12345
}
```

## 🛡️ Características de seguridad
- **Filtro NSFW**: Los memes marcados como NSFW solo se muestran en canales NSFW
- **Anti-duplicados**: El sistema de auto-memes evita publicar el mismo meme dos veces
- **Manejo de errores**: Si falla la API, el bot lo maneja gracefully

## 📚 Recursos
- [Documentación de meme-api.com](https://github.com/D3vd/Meme_Api)
- [Repositorio GitHub](https://github.com/D3vd/Meme_Api)

## 🐛 Solución de problemas

### Los memes no se cargan
1. Verifica tu conexión a internet
2. Revisa que meme-api.com esté funcionando: https://meme-api.com/gimme
3. Revisa los logs del bot para errores específicos

### Memes duplicados
El sistema mantiene un historial de los últimos 50 memes por servidor para evitar duplicados, pero ocasionalmente pueden aparecer si el pool de memes es pequeño.

### Error 403 o 404
Estos errores son raros con meme-api.com. Si ocurren, espera unos minutos y vuelve a intentar.
