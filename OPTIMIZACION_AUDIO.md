# 🎵 Optimización de Audio - Guía de Referencia

## 🔧 Configuración del Bot (`config.js`)

El bot incluye ajustes de audio optimizados en la sección `audioSettings`:

```javascript
audioSettings: {
    bufferDuration: 400,           // Buffer óptimo (400ms)
    frameBufferDuration: 5000,     // Buffer de frames (5s)
    opusQuality: 10,               // Máxima calidad
    resamplingQuality: "HIGH",     // Resampling de alta calidad
    trackStuckThreshold: 10000,    // 10s antes de considerar stuck
    playerUpdateInterval: 5,       // Actualización cada 5s
    useSeekGhosting: true,         // Mejora el seeking
    gcWarnings: false              // Sin warnings de GC
}
```

---

## 🎯 Problemas Comunes y Soluciones

### **Problema 1: Música muy rápida o muy lenta**

**Causas:**
- Latencia de red variable con el servidor Lavalink
- Problemas de sincronización de audio

**Solución:**
Verifica la latencia a tu servidor Lavalink:
```bash
ping lavalinkv4.serenetia.com
```

**Resultados:**
- ✅ **<50ms**: Excelente
- ⚠️ **50-100ms**: Bueno (puede haber lag ocasional)
- ❌ **>100ms**: Considera cambiar a otro servidor Lavalink público con mejor latencia

---

### **Problema 2: Cortes o pausas frecuentes**

**Causas:**
- Conexión inestable al servidor Lavalink
- Servidor Lavalink sobrecargado

**Soluciones:**
1. Verifica tu conexión a internet
2. Si el problema persiste, prueba otro servidor Lavalink público
3. El bot tiene un sistema de pre-buffer que pausa brevemente al inicio de cada canción para llenar el buffer y evitar cortes

---

### **Problema 3: Lag al inicio de canciones**

**Causas:**
- Tiempo de carga desde YouTube
- Buffer inicial insuficiente

**Solución:**
El bot implementa un sistema de pre-buffering automático:
- Primera canción: 2.5s de pre-buffer
- Canciones siguientes: 1.5s de pre-buffer

---

## 💡 Recomendaciones

### **1. Optimizar Discord Voice**

En Discord (configuración de voz):
- ✅ Activar **"Calidad de servicio de alta prioridad"**
- ✅ Desactivar **"Procesamiento automático de ganancia"**
- ✅ Usar **"Modo Push-to-Talk"** si hay ruido de fondo

### **2. Cambiar Servidor Lavalink**

Si experimentas problemas de calidad, puedes cambiar el servidor en `bot/src/config.js`:

```javascript
nodes: [
    {
        host: "tu-servidor-lavalink.com",
        port: 443,
        password: "tu_password",
        secure: true
    }
]
```

> Busca servidores Lavalink públicos actualizados en comunidades de Discord.

---

## 📊 Valores Actuales (Optimizados)

```
✅ bufferDuration: 400ms           → Óptimo para la mayoría
✅ frameBufferDuration: 5000ms     → 5 segundos de buffer
✅ opusQuality: 10                 → Máxima calidad
✅ trackStuckThreshold: 10000ms    → Detección rápida
✅ resamplingQuality: HIGH         → Alta calidad
✅ useSeekGhosting: true           → Seeking mejorado
```

---

## 🧪 Pruebas Recomendadas

Después de cualquier cambio:

1. **Reproducir una canción corta** (2-3 min)
2. **Verificar que no haya lag** al inicio
3. **Probar skip/seek** para verificar responsividad
4. **Reproducir playlist** para verificar transiciones

---

## 🎯 Resultado Esperado

✅ **Sin lag** al inicio de canciones
✅ **Velocidad constante** (no rápida ni lenta)
✅ **Transiciones suaves** entre canciones
✅ **Comandos responsivos** (skip, pause, seek)
✅ **Sin cortes** durante reproducción

---

**Estado:** ✅ Optimizado
**Última actualización:** 2026-02-09
**Desarrollador:** MaxitoDev
