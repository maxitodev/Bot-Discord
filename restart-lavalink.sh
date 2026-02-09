#!/bin/bash

echo "🔄 Reiniciando Lavalink..."

# Buscar el proceso de Lavalink
LAVALINK_PID=$(ps aux | grep '[L]avalink.jar' | awk '{print $2}')

if [ -z "$LAVALINK_PID" ]; then
    echo "⚠️ Lavalink no está corriendo"
else
    echo "🛑 Deteniendo Lavalink (PID: $LAVALINK_PID)..."
    kill $LAVALINK_PID
    sleep 2
    
    # Verificar si se detuvo
    if ps -p $LAVALINK_PID > /dev/null; then
        echo "⚠️ Forzando detención..."
        kill -9 $LAVALINK_PID
    fi
    echo "✅ Lavalink detenido"
fi

echo "🚀 Iniciando Lavalink con nueva configuración..."
cd "$(dirname "$0")"
nohup java -jar Lavalink.jar > lavalink.log 2>&1 &
NEW_PID=$!

echo "✅ Lavalink iniciado (PID: $NEW_PID)"
echo "📋 Para ver los logs: tail -f lavalink.log"
