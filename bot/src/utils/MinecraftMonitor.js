const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { Tail } = require('tail');

/**
 * Sistema de monitoreo de servidor Minecraft
 * Lee logs en tiempo real y envía notificaciones a Discord
 */
class MinecraftMonitor {
    constructor(client) {
        this.client = client;
        this.monitors = new Map(); // guildId -> monitor config
        this.tails = new Map(); // guildId -> Tail instance
        this.onlinePlayers = new Map(); // guildId -> Set<playerName>
    }

    /**
     * Inicia el monitoreo para un servidor
     * @param {string} guildId - ID del servidor de Discord
     */
    start(guildId) {
        const config = this.client.minecraftConfig?.get(guildId);
        if (!config || !config.enabled) return;

        // Inicializar set de jugadores para este server
        if (!this.onlinePlayers.has(guildId)) {
            this.onlinePlayers.set(guildId, new Set());
        }

        // Detener monitor existente si hay uno
        this.stop(guildId);

        const logPath = config.logPath;

        // Verificar que el archivo existe
        if (!fs.existsSync(logPath)) {
            console.error(`❌ Archivo de log no encontrado: ${logPath}`);
            return;
        }

        console.log(`🎮 Monitor de Minecraft iniciado para servidor ${guildId}`);
        console.log(`📁 Monitoreando: ${logPath}`);

        try {
            // Crear tail para leer el archivo en tiempo real
            const tail = new Tail(logPath, {
                fromBeginning: false,
                follow: true,
                useWatchFile: true
            });

            tail.on('line', (line) => {
                this.processLogLine(line, guildId);
            });

            tail.on('error', (error) => {
                console.error(`❌ Error en monitor de Minecraft (${guildId}):`, error);
            });

            this.tails.set(guildId, tail);
            this.updateBotActivity(); // Actualizar presencia inicial

        } catch (error) {
            console.error(`❌ Error al iniciar monitor de Minecraft:`, error);
        }
    }

    /**
     * Detiene el monitoreo para un servidor
     * @param {string} guildId - ID del servidor de Discord
     */
    stop(guildId) {
        const tail = this.tails.get(guildId);
        if (tail) {
            tail.unwatch();
            this.tails.delete(guildId);
            this.onlinePlayers.delete(guildId); // Limpiar lista de jugadores
            this.updateBotActivity(); // Actualizar presencia
            console.log(`🛑 Monitor de Minecraft detenido para servidor ${guildId}`);
        }
    }

    /**
     * Actualiza la actividad del bot con el número de jugadores
     */
    updateBotActivity() {
        let totalPlayers = 0;
        for (const players of this.onlinePlayers.values()) {
            totalPlayers += players.size;
        }

        if (totalPlayers > 0) {
            const { ActivityType } = require("discord.js");
            this.client.user.setActivity(`🎮 Minecraft: ${totalPlayers} online`, { type: ActivityType.Playing });
        } else {
            // Si no hay jugadores, volver al estado rotativo normal (manejado en ready.js)
            // O poner un estado default
            const { ActivityType } = require("discord.js");
            this.client.user.setActivity(`Minecraft Server (Vacío)`, { type: ActivityType.Watching });
        }
    }

    /**
     * Procesa una línea del log de Minecraft
     * @param {string} line - Línea del log
     * @param {string} guildId - ID del servidor de Discord
     */
    async processLogLine(line, guildId) {
        const config = this.client.minecraftConfig?.get(guildId);
        if (!config || !config.enabled) return;

        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) return;

        const channel = guild.channels.cache.get(config.channelId);
        if (!channel) return;

        // Detectar eventos
        const event = this.detectEvent(line, guildId);
        if (!event) return;

        // Verificar si el tipo de evento está habilitado
        if (!config.events[event.type]) return;

        // Crear embed según el tipo de evento
        const embed = this.createEmbed(event);
        if (!embed) return;

        try {
            await channel.send({ embeds: [embed] });
            console.log(`✅ Evento de Minecraft enviado: ${event.type} - ${event.player || 'N/A'}`);
        } catch (error) {
            console.error(`❌ Error al enviar evento de Minecraft:`, error);
        }
    }

    /**
     * Detecta el tipo de evento en una línea del log
     * @param {string} line - Línea del log
     * @param {string} guildId - ID del servidor para actualizar conteo
     * @returns {Object|null} Objeto con información del evento
     */
    detectEvent(line, guildId) {
        // Jugador se conectó
        const joinMatch = line.match(/\]: (\S+) joined the game/);
        if (joinMatch) {
            const player = joinMatch[1];

            // Asegurar que el Set existe
            if (!this.onlinePlayers.has(guildId)) {
                this.onlinePlayers.set(guildId, new Set());
            }

            this.onlinePlayers.get(guildId).add(player);
            console.log(`➕ Jugador agregado: ${player} (Total guild: ${this.onlinePlayers.get(guildId).size})`);

            this.updateBotActivity();

            return {
                type: 'join',
                player: player,
                message: `${player} se unió al juego`
            };
        }

        // Jugador se desconectó
        const leaveMatch = line.match(/\]: (\S+) left the game/);
        if (leaveMatch) {
            const player = leaveMatch[1];

            if (this.onlinePlayers.has(guildId)) {
                this.onlinePlayers.get(guildId).delete(player);
                console.log(`➖ Jugador removido: ${player} (Total guild: ${this.onlinePlayers.get(guildId).size})`);
                this.updateBotActivity();
            }

            return {
                type: 'leave',
                player: player,
                message: `${player} salió del juego`
            };
        }

        // Muerte de jugador
        const deathMatch = line.match(/\]: (\w+) (.+)/);
        if (deathMatch && this.isDeathMessage(deathMatch[2])) {
            return {
                type: 'death',
                player: deathMatch[1],
                message: deathMatch[2] // Pasamos el mensaje crudo para procesarlo después
            };
        }

        // Logro conseguido
        const achievementMatch = line.match(/\]: (\w+) has made the advancement \[(.+)\]/);
        if (achievementMatch) {
            return {
                type: 'achievement',
                player: achievementMatch[1],
                achievement: achievementMatch[2],
                message: `${achievementMatch[1]} ha conseguido el avance [${achievementMatch[2]}]`
            };
        }

        // Desafío completado
        const challengeMatch = line.match(/\]: (\w+) has completed the challenge \[(.+)\]/);
        if (challengeMatch) {
            return {
                type: 'challenge',
                player: challengeMatch[1],
                achievement: challengeMatch[2],
                message: `${challengeMatch[1]} ha completado el desafío [${challengeMatch[2]}]`
            };
        }

        // Meta conseguida
        const goalMatch = line.match(/\]: (\w+) has reached the goal \[(.+)\]/);
        if (goalMatch) {
            return {
                type: 'goal',
                player: goalMatch[1],
                achievement: goalMatch[2],
                message: `${goalMatch[1]} ha alcanzado la meta [${goalMatch[2]}]`
            };
        }

        return null;
    }

    /**
     * Verifica si un mensaje es de muerte
     * @param {string} message - Mensaje a verificar
     * @returns {boolean}
     */
    isDeathMessage(message) {
        const deathKeywords = [
            'was slain by', 'was shot by', 'was pummeled by', 'was pricked to death',
            'walked into a cactus', 'drowned', 'experienced kinetic energy', 'blew up',
            'was blown up by', 'was killed by', 'hit the ground too hard', 'fell from a high place',
            'fell off a ladder', 'fell off some vines', 'fell out of the world', 'was squashed by',
            'was squished too much', 'was skewered by', 'went up in flames', 'burned to death',
            'was burnt to a crisp', 'walked into fire', 'tried to swim in lava', 'was struck by lightning',
            'discovered floor was lava', 'was killed by magic', 'starved to death', 'suffocated in a wall',
            'was impaled on', 'was poked to death', 'was fireballed by', 'withered away',
            'was frozen to death', 'was doomed to fall', 'fell too far and was finished'
        ];

        return deathKeywords.some(keyword => message.includes(keyword));
    }

    /**
     * Crea un embed según el tipo de evento
     * @param {Object} event - Información del evento
     * @returns {EmbedBuilder|null}
     */
    createEmbed(event) {
        const colors = {
            join: 0x00FF00,      // Verde
            leave: 0xFF0000,     // Rojo
            death: 0x2C2F33,     // Negro/Gris oscuro (Luto)
            achievement: 0xFFD700, // Dorado
            challenge: 0x9932CC,  // Púrpura épico
            goal: 0x00CED1       // Turquesa
        };

        const emojis = {
            join: '📥',
            leave: '📤',
            death: '💀',
            achievement: '🏆',
            challenge: '🌟',
            goal: '🎯'
        };

        const embed = new EmbedBuilder()
            .setColor(colors[event.type] || 0x00FF00)
            .setTimestamp();

        switch (event.type) {
            case 'join':
                const joinMessages = [
                    `¡Ya llegó por quien lloraban! **${event.player}** se conectó 🤠`,
                    `¡Aguas! **${event.player}** entró a hacer desmadre 🔥`,
                    `**${event.player}** aterrizó en el servidor 🛬`,
                    `¡Qué milagro! **${event.player}** se dignó a entrar 🙏`,
                    `**${event.player}** se unió alv (a la vida) 🎮`
                ];
                embed.setDescription(`${emojis.join} ${joinMessages[Math.floor(Math.random() * joinMessages.length)]}`);
                // Calcular total online para el footer
                let total = 0;
                for (const players of this.onlinePlayers.values()) total += players.size;
                embed.setFooter({ text: `Jugadores online: ${total}` });
                break;

            case 'leave':
                const leaveMessages = [
                    `**${event.player}** se fue a la vrg 👋`,
                    `**${event.player}** ragequit? se desconectó 🏃`,
                    `¡Se nos fue **${event.player}**! 😭`,
                    `**${event.player}** fue a tocar pasto 🌿`,
                    `**${event.player}** dijo "ahí se ven losers" 🚪`
                ];
                embed.setDescription(`${emojis.leave} ${leaveMessages[Math.floor(Math.random() * leaveMessages.length)]}`);
                // Calcular total online para el footer
                let totalLeave = 0;
                for (const players of this.onlinePlayers.values()) totalLeave += players.size;
                embed.setFooter({ text: `Jugadores online: ${totalLeave}` });
                break;

            case 'death':
                // Traducir y personalizar mensaje de muerte
                const { translated, mob } = this.translateDeathMessage(event.message, event.player);

                embed.setDescription(`## ${emojis.death} ¡SE MURIÓ ALV!\n\n${translated}`);

                if (mob === 'Creeper') embed.setImage('https://media.tenor.com/T_1C2zL_uD0AAAAM/minecraft-creeper.gif');
                if (mob === 'Zombie') embed.setImage('https://media.tenor.com/et1aGgaaXb0AAAAM/minecraft-zombie.gif');
                if (mob === 'Skeleton') embed.setImage('https://media.tenor.com/P1X2tLd58z4AAAAM/skeleton-minecraft.gif');
                if (mob === 'Lava') embed.setImage('https://media.tenor.com/_wXj0q8j-uUAAAAM/terminator-thumbs-up.gif');

                embed.setFooter({ text: 'F en el chat raza' });
                break;

            case 'achievement':
            case 'challenge':
            case 'goal':
                const achievementTitles = {
                    achievement: '¡LOGRO DESBLOQUEADO! 🔓',
                    challenge: '¡DESAFÍO COMPLETADO! 🔥',
                    goal: '¡META ALCANZADA! 🎯'
                };

                const achievementMessages = [
                    `¡Bien ahí! **${event.player}** no es tan manco:`,
                    `**${event.player}** anda con todo y consiguió:`,
                    `¡Aplausos para **${event.player}**! Se ganó:`,
                    `**${event.player}** desbloqueó esta madre:`
                ];

                embed.setTitle(achievementTitles[event.type]);
                embed.setDescription(
                    `${achievementMessages[Math.floor(Math.random() * achievementMessages.length)]}\n### 🏅 ${event.achievement}`
                );
                embed.setFooter({ text: `Orgullo del servidor: ${event.player}` });
                break;

            default:
                return null;
        }

        return embed;
    }

    /**
     * Traduce mensajes de muerte al español con estilo mexicano y bien grosero
     * @returns {Object} { translated: string, mob: string }
     */
    translateDeathMessage(message, player) {
        let mob = 'Generic';
        let customMessage = `**${player}** colgó los tenis.`;

        // Lógica específica para mobs y causas
        if (message.includes('was slain by Zombie')) {
            mob = 'Zombie';
            const msg = [
                `**${player}** se dejó comer por un pinche Zombie pendejo.`,
                `Un Zombie le comió el cerebro a **${player}** (no tenía mucho).`,
                `**${player}** valió madres contra un Zombie básico.`
            ];
            customMessage = msg[Math.floor(Math.random() * msg.length)];
        }
        else if (message.includes('was slain by Skeleton') || message.includes('was shot by Skeleton')) {
            mob = 'Skeleton';
            const msg = [
                `A **${player}** lo balacearon los municipales (Esqueleto).`,
                `**${player}** quedó como coladera por un Esqueleto camper.`,
                `Un Esqueleto le metió una flecha por el culo a **${player}**.`
            ];
            customMessage = msg[Math.floor(Math.random() * msg.length)];
        }
        else if (message.includes('was slain by Spider') || message.includes('Cave Spider')) {
            mob = 'Spider';
            const msg = [
                `A **${player}** se lo llevó la araña patona.`,
                `**${player}** necesita fumigar, lo mató una pinche araña.`,
                `Spiderman (versión chafa) mató a **${player}**.`
            ];
            customMessage = msg[Math.floor(Math.random() * msg.length)];
        }
        else if (message.includes('blown up by Creeper')) {
            mob = 'Creeper';
            const msg = [
                `¡AW MAN! Un Creeper voló a **${player}** a la verga.`,
                `**${player}** no escuchó el "tsssss" y explotó como pendejo.`,
                `Un Creeper hizo Allahu Akbar con **${player}**.`
            ];
            customMessage = msg[Math.floor(Math.random() * msg.length)];
        }
        else if (message.includes('Enderman')) {
            mob = 'Enderman';
            const msg = [
                `**${player}** miró feo a un Enderman y le partieron su madre.`,
                `El Slenderman de cubos (Enderman) violó a **${player}**.`
            ];
            customMessage = msg[Math.floor(Math.random() * msg.length)];
        }
        else if (message.includes('lava') || message.includes('magma')) {
            mob = 'Lava';
            const msg = [
                `**${player}** intentó nadar en la lava. Spoiler: Quema, pendejo.`,
                `**${player}** es el nuevo Terminator, se fundió en la lava.`,
                `Se le quemaron las nalgas a **${player}** en la lava.`
            ];
            customMessage = msg[Math.floor(Math.random() * msg.length)];
        }
        else if (message.includes('fell from a high place') || message.includes('hit the ground too hard')) {
            mob = 'Fall';
            const msg = [
                `**${player}** creyó que tenía Elytras y se partió la madre.`,
                `La gravedad es una perra, ¿verdad **${player}**?`,
                `**${player}** se estampó contra el piso como mosca.`,
                `¡Suelo! **${player}** besó el pavimento.`
            ];
            customMessage = msg[Math.floor(Math.random() * msg.length)];
        }
        else if (message.includes('drowned')) {
            mob = 'Water';
            const msg = [
                `**${player}** se le olvidó respirar y se ahogó el wey.`,
                `**${player}** fue a visitar a Bob Esponja y se murió.`
            ];
            customMessage = msg[Math.floor(Math.random() * msg.length)];
        }
        else if (message.includes('starved')) {
            const msg = [
                `**${player}** se murió de hambre (como en Venezuela alv).`,
                `Dale un pan a **${player}**, se murió por no comer.`
            ];
            customMessage = msg[Math.floor(Math.random() * msg.length)];
        }
        else {
            // Mensaje generico traducido
            const translations = {
                'was slain by': 'fue asesinado brutalmente por',
                'was shot by': 'fue baleado por',
                'blew up': 'explotó en mil pedazos',
                'was killed by': 'fue enviado al lobby por',
                'withered away': 'se hizo polvo',
                'was frozen to death': 'se convirtió en paleta de hielo'
            };
            let translated = message;
            for (const [english, spanish] of Object.entries(translations)) {
                translated = translated.replace(new RegExp(english, 'gi'), spanish);
            }
            customMessage = `${emojis.death} **${player}** ${translated} (F)`;
        }

        return { translated: customMessage, mob };
    }

    /**
     * Inicializa todos los monitores guardados al iniciar el bot
     */
    initializeAll() {
        if (!this.client.minecraftConfig) return;

        for (const [guildId, config] of this.client.minecraftConfig.entries()) {
            if (config.enabled) {
                this.start(guildId);
            }
        }

        console.log(`🎮 ${this.tails.size} monitores de Minecraft inicializados`);
    }

    /**
     * Detiene todos los monitores (útil al apagar el bot)
     */
    stopAll() {
        for (const guildId of this.tails.keys()) {
            this.stop(guildId);
        }
    }
}

module.exports = MinecraftMonitor;
