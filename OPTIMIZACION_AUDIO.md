# 🎵 Optimización de Audio - Solución de Lag y Velocidad

## 🔧 Cambios Realizados

### **1. Configuración del Bot (`config.js`)**

Se agregó una nueva sección `audioSettings` con configuraciones optimizadas:

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

### **2. Configuración de Lavalink (`application.yml`)**

Optimizaciones clave:

- ✅ **Buffer reducido**: De 10000ms a 400ms (más responsive)
- ✅ **Frame buffer optimizado**: De 30000ms a 5000ms
- ✅ **Track stuck threshold**: De 30s a 10s (detecta problemas más rápido)
- ✅ **GC warnings desactivados**: Menos ruido en logs

---

## 🎯 Problemas Comunes y Soluciones

### **Problema 1: Música muy rápida o muy lenta**

**Causas:**
- Buffer demasiado grande o pequeño
- Problemas de sincronización de audio
- Latencia de red variable

**Soluciones:**

#### **Opción A: Ajustar Buffer (Ya implementado)**
Los valores actuales (400ms buffer) son óptimos para la mayoría de casos.

#### **Opción B: Si persiste, aumentar buffer**
En `application.yml`, cambiar:
```yaml
bufferDurationMs: 400      # Cambiar a 800 o 1000 si hay lag
frameBufferDurationMs: 5000 # Cambiar a 8000 si hay cortes
```

#### **Opción C: Cambiar servidor Lavalink**
Si usas servidor público, considera:
1. **Usar Lavalink local** (mejor control)
2. **Cambiar a otro servidor público** con mejor latencia

---

### **Problema 2: Cortes o pausas frecuentes**

**Causas:**
- Buffer muy pequeño
- Conexión inestable
- Servidor Lavalink sobrecargado

**Soluciones:**

#### **Aumentar buffers:**
```yaml
bufferDurationMs: 1000          # Aumentar a 1 segundo
frameBufferDurationMs: 10000    # Aumentar a 10 segundos
```

#### **Verificar conexión:**
```bash
# Hacer ping al servidor Lavalink
ping lavalinkv4.serenetia.com
```

---

### **Problema 3: Lag al inicio de canciones**

**Causas:**
- Tiempo de carga de YouTube
- Buffer inicial insuficiente

**Soluciones:**

#### **Aumentar frame buffer:**
```yaml
frameBufferDurationMs: 8000  # 8 segundos de pre-buffer
```

#### **Activar pre-loading (si disponible):**
En el futuro, implementar pre-carga de la siguiente canción.

---

## 📊 Configuraciones Recomendadas por Escenario

### **🌐 Conexión Excelente (Fibra óptica, <20ms ping)**
```yaml
bufferDurationMs: 400
frameBufferDurationMs: 3000
trackStuckThresholdMs: 8000
```

### **📡 Conexión Buena (Cable, 20-50ms ping)**
```yaml
bufferDurationMs: 600
frameBufferDurationMs: 5000
trackStuckThresholdMs: 10000
```

### **📶 Conexión Regular (WiFi, 50-100ms ping)**
```yaml
bufferDurationMs: 1000
frameBufferDurationMs: 8000
trackStuckThresholdMs: 12000
```

### **🐌 Conexión Lenta (>100ms ping)**
```yaml
bufferDurationMs: 1500
frameBufferDurationMs: 12000
trackStuckThresholdMs: 15000
```

---

## 🚀 Cómo Aplicar los Cambios

### **Si usas Lavalink Público (Actual):**

1. Los cambios en `config.js` ya están aplicados
2. **Reinicia el bot**:
   ```bash
   # Detener el bot (Ctrl+C)
   npm start
   ```
3. Los cambios se aplicarán automáticamente

### **Si usas Lavalink Local:**

1. **Detener Lavalink** (Ctrl+C en la terminal de Lavalink)
2. **Reiniciar Lavalink**:
   ```bash
   java -jar Lavalink.jar
   ```
3. **Reiniciar el bot**:
   ```bash
   npm start
   ```

---

## 🔍 Diagnóstico de Problemas

### **Verificar latencia al servidor Lavalink:**

```bash
# Windows
ping lavalinkv4.serenetia.com

# Linux/Mac
ping -c 10 lavalinkv4.serenetia.com
```

**Resultados:**
- ✅ **<50ms**: Excelente
- ⚠️ **50-100ms**: Bueno (puede haber lag ocasional)
- ❌ **>100ms**: Considera cambiar servidor o usar Lavalink local

---

## 💡 Recomendaciones Adicionales

### **1. Usar Lavalink Local (Mejor opción)**

**Ventajas:**
- ✅ Latencia mínima (localhost)
- ✅ Control total sobre configuración
- ✅ Sin dependencia de servidores externos
- ✅ Mejor calidad de audio

**Cómo cambiar:**

En `bot/src/config.js`:
```javascript
nodes: [
    {
        name: "Local Lavalink",
        url: "localhost:2333",
        auth: "tuPasswordSegura",
        secure: false
    }
]
```

### **2. Optimizar Discord Voice**

En Discord (configuración de voz):
- ✅ Activar **"Calidad de servicio de alta prioridad"**
- ✅ Desactivar **"Procesamiento automático de ganancia"**
- ✅ Usar **"Modo Push-to-Talk"** si hay ruido de fondo

### **3. Monitorear Uso de CPU/RAM**

Si el servidor está sobrecargado:
- Reducir `opusEncodingQuality` a 8 o 7
- Aumentar `playerUpdateInterval` a 10

---

## 📝 Valores Actuales (Optimizados)

```yaml
✅ bufferDurationMs: 400ms          # Óptimo para la mayoría
✅ frameBufferDurationMs: 5000ms    # 5 segundos de buffer
✅ opusEncodingQuality: 10          # Máxima calidad
✅ trackStuckThresholdMs: 10000ms   # Detección rápida
✅ resamplingQuality: HIGH          # Alta calidad
✅ useSeekGhosting: true            # Seeking mejorado
```

---

## 🧪 Pruebas Recomendadas

Después de aplicar los cambios:

1. **Reproducir una canción corta** (2-3 min)
2. **Verificar que no haya lag** al inicio
3. **Probar skip/seek** para verificar responsividad
4. **Reproducir playlist** para verificar transiciones
5. **Ajustar buffers** si es necesario según resultados

---

## ❓ Preguntas Frecuentes

### **¿Por qué reducir el buffer de 10s a 400ms?**
Un buffer muy grande causa:
- Lag al pausar/reanudar
- Delay en comandos (skip, seek)
- Música "acelerada" al recuperarse de lag

### **¿Qué es frameBufferDuration?**
Es el buffer de frames de audio pre-cargados. 5 segundos es suficiente para evitar cortes sin causar lag.

### **¿Debo usar Lavalink local o público?**
- **Local**: Mejor rendimiento, requiere Java y configuración
- **Público**: Más fácil, pero puede tener lag según ubicación

---

## 🎯 Resultado Esperado

Después de aplicar estos cambios:

✅ **Sin lag** al inicio de canciones
✅ **Velocidad constante** (no rápida ni lenta)
✅ **Transiciones suaves** entre canciones
✅ **Comandos responsivos** (skip, pause, seek)
✅ **Sin cortes** durante reproducción

---

**Estado:** ✅ Optimizado
**Última actualización:** 2026-02-03
**Desarrollador:** MaxitoDev
