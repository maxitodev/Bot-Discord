# 🎮 Sistema de Notificaciones de Minecraft

## 📋 Descripción
El bot puede monitorear tu servidor de Minecraft y enviar notificaciones automáticas a Discord cuando ocurran eventos importantes.

## ✨ Eventos soportados

### 🟢 Conexiones/Desconexiones
- Notifica cuando un jugador se une al servidor
- Notifica cuando un jugador sale del servidor

### 💀 Muertes
- Muestra el mensaje completo de muerte
- Detecta todos los tipos de muerte (PvP, PvE, caídas, lava, etc.)

### 🏆 Logros y Avances
- **Avances** (Advancements): Logros normales
- **Desafíos** (Challenges): Logros difíciles
- **Metas** (Goals): Objetivos específicos

## 🚀 Configuración

### Paso 1: Configurar el monitor

```
/minecraft setup
  canal: #minecraft-logs
  ruta_log: /ruta/al/servidor/logs/latest.log
```

**Ejemplos de rutas:**
- **Windows**: `C:\Minecraft\server\logs\latest.log`
- **Linux/VPS**: `/home/minecraft/server/logs/latest.log`
- **Local (desarrollo)**: `./minecraft_server/logs/latest.log`

### Paso 2: Configurar eventos (opcional)

```
/minecraft eventos
  conexiones: true/false
  muertes: true/false
  logros: true/false
```

Por defecto, todos los eventos están activados.

### Paso 3: Verificar estado

```
/minecraft status
```

Muestra:
- Estado del monitor (activo/inactivo)
- Canal configurado
- Ruta del archivo de log
- Eventos habilitados

## 🎯 Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `/minecraft setup` | Configura el canal y la ruta del log |
| `/minecraft eventos` | Activa/desactiva tipos de eventos |
| `/minecraft toggle` | Activa o desactiva el monitor |
| `/minecraft status` | Muestra la configuración actual |

## 📝 Ejemplo de uso

### Desarrollo local

1. Crea un servidor de Minecraft de prueba:
```bash
# Descarga el servidor de Minecraft
# Ejecuta el servidor
java -Xmx1024M -Xms1024M -jar server.jar nogui
```

2. Configura el bot:
```
/minecraft setup
  canal: #minecraft-logs
  ruta_log: C:\minecraft_test\logs\latest.log
```

3. Prueba los eventos:
- Conéctate al servidor
- Consigue un logro
- Muere de alguna forma creativa 💀

### Producción (VPS)

1. Asegúrate de que el bot tenga acceso al archivo de log:
```bash
# Dar permisos de lectura
chmod +r /home/minecraft/server/logs/latest.log
```

2. Configura el bot:
```
/minecraft setup
  canal: #minecraft-logs
  ruta_log: /home/minecraft/server/logs/latest.log
```

## 🎨 Ejemplos de notificaciones

### Conexión
```
✅ MaxitoDev se unió al servidor
Jugador conectado • Hace 2 segundos
```

### Muerte
```
💀 MaxitoDev was slain by Zombie
Muerte • Hace 5 segundos
```

### Logro
```
🏆 Avance conseguido!
MaxitoDev ha conseguido:
Stone Age
Logro de MaxitoDev • Hace 10 segundos
```

## 🔧 Solución de problemas

### El bot no detecta eventos

1. **Verifica la ruta del log:**
```
/minecraft status
```
Debe mostrar "✅ Encontrado"

2. **Verifica permisos:**
```bash
# Linux
ls -l /ruta/al/logs/latest.log
# Debe mostrar permisos de lectura (r)
```

3. **Verifica que el servidor esté corriendo:**
El archivo `latest.log` debe estar siendo actualizado

### Los eventos no se envían

1. Verifica que el monitor esté activo:
```
/minecraft status
```

2. Verifica que los eventos estén habilitados:
```
/minecraft eventos
  conexiones: true
  muertes: true
  logros: true
```

3. Revisa los logs del bot para errores

### El archivo no se encuentra

- En desarrollo: Crea un archivo de prueba temporalmente
- En producción: Verifica que la ruta sea absoluta y correcta
- Asegúrate de que el servidor de Minecraft esté corriendo

## 📚 Formato del log de Minecraft

El bot detecta eventos en el formato estándar de Minecraft:

```
[HH:MM:SS] [Server thread/INFO]: MaxitoDev joined the game
[HH:MM:SS] [Server thread/INFO]: MaxitoDev has made the advancement [Stone Age]
[HH:MM:SS] [Server thread/INFO]: MaxitoDev was slain by Zombie
[HH:MM:SS] [Server thread/INFO]: MaxitoDev left the game
```

## 🛡️ Seguridad

- El bot solo **lee** el archivo de log, nunca lo modifica
- No se ejecutan comandos en el servidor de Minecraft
- Solo los administradores pueden configurar el monitor
- Las rutas se validan antes de ser guardadas

## 🚀 Próximas características (futuras)

- [ ] Estadísticas de jugadores
- [ ] Gráficas de actividad
- [ ] Comandos RCON para controlar el servidor
- [ ] Backup automático
- [ ] Lista de jugadores online

## 💡 Tips

1. **Usa un canal dedicado** para las notificaciones de Minecraft
2. **Desactiva eventos ruidosos** si hay muchos jugadores (ej: conexiones)
3. **Prueba localmente** antes de configurar en producción
4. **Mantén actualizado** el bot para nuevas características

## 📞 Soporte

Si tienes problemas:
1. Revisa esta documentación
2. Usa `/minecraft status` para diagnosticar
3. Revisa los logs del bot
4. Verifica permisos de archivos
