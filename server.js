const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('openai');
const fs = require('fs');
const https = require('https');
// Cargar variables de entorno (solo en desarrollo local)
// En producción (Railway), las variables ya están en process.env
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// Verificar que OPENAI_API_KEY esté disponible
let apiKey = process.env.OPENAI_API_KEY;

// Si no está en variables de entorno, intentar leer de todas las posibles fuentes
if (!apiKey || apiKey.trim() === '') {
    // Intentar diferentes nombres de variable (por si Railway usa otro nombre)
    apiKey = process.env.OPENAI_API_KEY || 
             process.env.openai_api_key || 
             process.env.OPENAIKEY ||
             process.env.openai_key;
}

// Si aún no está disponible, mostrar error detallado
if (!apiKey || apiKey.trim() === '') {
    console.error('ERROR: OPENAI_API_KEY environment variable is missing or empty!');
    console.error('NODE_ENV:', process.env.NODE_ENV);
    console.error('All env vars:', Object.keys(process.env).sort());
    console.error('Available env vars with OPENAI:', Object.keys(process.env).filter(k => k.includes('OPENAI') || k.toLowerCase().includes('openai')));
    console.error('Available env vars with NODE:', Object.keys(process.env).filter(k => k.includes('NODE')));
    console.error('Please configure OPENAI_API_KEY in Railway Variables');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: apiKey.trim()
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Almacenamiento en memoria (en producción usar Redis o DB)
const sessions = new Map();
const players = new Map(); // socketId -> playerInfo

// Importar datos de personajes
let CHARACTERS = [];
try {
    const charsModule = require('./characters.js');
    CHARACTERS = charsModule.CHARACTERS || charsModule.default?.CHARACTERS || [];
} catch (e) {
    console.error('Error loading characters:', e);
    // Fallback: definir personajes básicos si hay error
    CHARACTERS = [];
}

// Crear directorio de imágenes de rondas si no existe
const roundsImagesDir = path.join(__dirname, 'images', 'rounds');
if (!fs.existsSync(roundsImagesDir)) {
    fs.mkdirSync(roundsImagesDir, { recursive: true });
}

// Rutas API (ANTES de las rutas estáticas)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.post('/api/session/create', (req, res) => {
    const { masterName, numQuestions, totalRounds } = req.body;
    
    if (!masterName) {
        return res.status(400).json({ error: 'Master name is required' });
    }

    const sessionId = Math.floor(1000 + Math.random() * 9000).toString();
    
    const session = {
        sessionId,
        masterName,
        numQuestions: numQuestions || 5,
        totalRounds: totalRounds || 5,
        currentRound: 1,
        players: [{ name: masterName, isMaster: true, score: 0, socketId: null }],
        sessionScores: { [masterName]: 0 },
        roundCharacters: [],
        thief: null,
        originalCharacter: null,
        originalCharacterImage: null,
        questions: [],
        answers: [],
        guesses: [],
        usedQuestions: [],
        status: 'waiting' // waiting, characterDescription, generating, playing, roundEnd, sessionEnd
    };

    sessions.set(sessionId, session);
    
    res.json({ sessionId, session });
});

app.get('/api/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
});

app.post('/api/session/:sessionId/join', (req, res) => {
    const { sessionId } = req.params;
    const { playerName } = req.body;
    
    const session = sessions.get(sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    if (!playerName) {
        return res.status(400).json({ error: 'Player name is required' });
    }
    
    // Verificar si el jugador ya existe
    const existingPlayer = session.players.find(p => p.name === playerName);
    if (existingPlayer) {
        return res.json({ session, message: 'Player already in session' });
    }
    
    // Agregar jugador
    session.players.push({ name: playerName, isMaster: false, score: 0, socketId: null });
    session.sessionScores[playerName] = 0;
    
    sessions.set(sessionId, session);
    
    // Notificar a todos los clientes conectados
    io.to(sessionId).emit('playerJoined', { playerName, players: session.players });
    
    res.json({ session });
});

// Generar imagen del personaje original
app.post('/api/session/:sessionId/generate-character', async (req, res) => {
    const { sessionId } = req.params;
    const { description } = req.body;
    const session = sessions.get(sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    if (!description || description.trim().length === 0) {
        return res.status(400).json({ error: 'Character description is required' });
    }
    
    try {
        // Generar imagen del personaje original
        const prompt = `A hyperrealistic professional photograph of a ridiculous-looking real person. This must look like an actual photo taken with a camera, NOT a drawing, NOT an illustration, NOT 3D render, NOT cartoon, NOT animation style. ONE REAL PERSON ONLY, no duplicates, no multiple people.

Person description: ${description}

CRITICAL STYLE REQUIREMENTS:
- Hyperrealistic photography - must look like a real photograph taken with a DSLR camera
- Ridiculous, absurd, funny-looking person - NOT attractive, NOT good-looking
- Awkward proportions, quirky features, comical appearance but still realistic
- Real person with natural skin texture, pores, realistic hair, natural lighting
- Professional portrait photography quality
- Natural lighting with realistic shadows and highlights
- Simple, clean background (solid color or blurred bokeh effect)
- Full body shot, front view
- Single real person only, no duplicates or multiple people
- Positive, friendly, or playful expression - NO sad or worried looks
- Natural colors, realistic skin tones, photographic quality
- NO illustration style, NO cartoon style, NO 3D render style, NO animation style
- Must look like an actual candid or portrait photograph of a real, ridiculous-looking human being
- The person should look funny, awkward, or absurd - intentionally not attractive`;

        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
            style: "vivid"
        });

        const imageUrl = response.data[0].url;
        
        // Descargar y guardar la imagen
        const imagesDir = path.join(__dirname, 'images', 'rounds', sessionId);
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }
        
        const imagePath = path.join(imagesDir, 'original.png');
        await downloadImage(imageUrl, imagePath);
        
        session.originalCharacter = description;
        session.originalCharacterImage = `/images/rounds/${sessionId}/original.png`;
        session.status = 'characterGenerated';
        sessions.set(sessionId, session);
        
        res.json({ 
            imageUrl: session.originalCharacterImage,
            description: description
        });
    } catch (error) {
        console.error('Error generating character:', error);
        res.status(500).json({ error: 'Error generating character image: ' + error.message });
    }
});

// Función auxiliar para descargar imágenes
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                https.get(response.headers.location, (redirectResponse) => {
                    if (redirectResponse.statusCode !== 200) {
                        reject(new Error(`Failed to download: ${redirectResponse.statusCode}`));
                        return;
                    }
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                }).on('error', reject);
            } else if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
            } else {
                reject(new Error(`Failed to download: ${response.statusCode}`));
            }
        }).on('error', reject);
    });
}

// Generar 25 variaciones del personaje
app.post('/api/session/:sessionId/generate-variations', async (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    if (!session.originalCharacter) {
        return res.status(400).json({ error: 'Original character not generated yet' });
    }
    
    try {
        session.status = 'generating';
        sessions.set(sessionId, session);
        
        // Notificar que comenzó la generación
        io.to(sessionId).emit('variationsGenerationStarted');
        
        const variations = [];
        const funnyDifferences = [
            'wearing mismatched socks',
            'has a ridiculous hat',
            'wearing oversized glasses',
            'has a funny mustache',
            'wearing a cape',
            'has a monocle',
            'wearing clown shoes',
            'has a fake beard',
            'wearing a propeller hat',
            'has a unibrow',
            'wearing a bow tie that is too big',
            'has a funny wig',
            'wearing suspenders with no pants',
            'has a fake nose',
            'wearing a superhero mask',
            'has a funny tattoo visible',
            'wearing a tutu',
            'has a funny expression',
            'wearing mismatched gloves',
            'has a funny haircut',
            'wearing a funny backpack',
            'has a funny prop',
            'wearing a funny accessory',
            'has a funny pose',
            'wearing a funny combination of clothes'
        ];
        
        // Generar 7 variaciones en paralelo (más rápido)
        const numVariations = 7;
        const batchSize = 3; // Generar 3 a la vez para evitar rate limits excesivos
        let completedCount = 0;
        
        // Función para generar una variación
        const generateVariation = async (index) => {
            const difference = funnyDifferences[index % funnyDifferences.length];
            const variationPrompt = `A hyperrealistic professional photograph of a ridiculous-looking real person. This must look like an actual photo taken with a camera, NOT a drawing, NOT an illustration, NOT 3D render, NOT cartoon, NOT animation style. ONE REAL PERSON ONLY, no duplicates, no multiple people.

Base person description: ${session.originalCharacter}

IMPORTANT: This person looks VERY SIMILAR to the base description but with ONE FUNNY DIFFERENCE: ${difference}. The person should be almost identical but with this one notable, funny difference that makes them stand out.

CRITICAL STYLE REQUIREMENTS:
- Hyperrealistic photography - must look like a real photograph taken with a DSLR camera
- Ridiculous, absurd, funny-looking person - NOT attractive, NOT good-looking
- Awkward proportions, quirky features, comical appearance but still realistic
- Real person with natural skin texture, pores, realistic hair, natural lighting
- Professional portrait photography quality
- Natural lighting with realistic shadows and highlights
- Simple, clean background (solid color or blurred bokeh effect)
- Full body shot, front view
- Single real person only, no duplicates or multiple people
- Positive, friendly, or playful expression - NO sad or worried looks
- Natural colors, realistic skin tones, photographic quality
- NO illustration style, NO cartoon style, NO 3D render style, NO animation style
- Must look like an actual candid or portrait photograph of a real, ridiculous-looking human being
- The person should look funny, awkward, or absurd - intentionally not attractive
- The person must look VERY SIMILAR to the base description but with the funny difference: ${difference}`;

            try {
                const response = await openai.images.generate({
                    model: "dall-e-3",
                    prompt: variationPrompt,
                    n: 1,
                    size: "1024x1024",
                    quality: "standard",
                    style: "vivid"
                });

                const imageUrl = response.data[0].url;
                const imagesDir = path.join(__dirname, 'images', 'rounds', sessionId);
                const imagePath = path.join(imagesDir, `variation_${index + 1}.png`);
                
                // Descargar imagen en paralelo (no esperar)
                downloadImage(imageUrl, imagePath).catch(err => {
                    console.error(`Error downloading image ${index + 1}:`, err);
                });
                
                const variation = {
                    id: index + 1,
                    name: `Personaje ${index + 1}`,
                    imageUrl: `/images/rounds/${sessionId}/variation_${index + 1}.png`,
                    difference: difference
                };
                
                // Notificar progreso
                completedCount++;
                const progress = Math.round((completedCount / numVariations) * 100);
                io.to(sessionId).emit('variationGenerated', {
                    progress: completedCount,
                    total: numVariations,
                    percentage: progress,
                    variation: variation
                });
                
                return variation;
            } catch (error) {
                console.error(`Error generating variation ${index + 1}:`, error);
                return null;
            }
        };
        
        // Generar en batches paralelos
        for (let i = 0; i < numVariations; i += batchSize) {
            const batch = [];
            for (let j = 0; j < batchSize && (i + j) < numVariations; j++) {
                batch.push(generateVariation(i + j));
            }
            
            const batchResults = await Promise.all(batch);
            variations.push(...batchResults.filter(v => v !== null));
            
            // Sin delay entre batches para máxima velocidad
        }
        
        // Agregar el personaje original a las variaciones (será el ladrón)
        // NO incluir el nombre "El Ladrón" - solo será identificado internamente
        const originalCharacter = {
            id: 0,
            name: `Personaje ${variations.length + 1}`, // Nombre genérico, no "El Ladrón"
            imageUrl: session.originalCharacterImage,
            difference: 'Original character',
            isThief: true
        };
        
        variations.push(originalCharacter);
        
        // Aleatorizar el orden de todos los personajes
        const shuffled = variations.sort(() => Math.random() - 0.5);
        
        session.roundCharacters = shuffled;
        session.thief = originalCharacter; // Guardar referencia al ladrón
        session.questions = [];
        session.answers = [];
        session.guesses = [];
        session.usedQuestions = [];
        session.status = 'playing';
        
        sessions.set(sessionId, session);
        
        // Notificar que terminó la generación
        io.to(sessionId).emit('roundStarted', {
            roundCharacters: session.roundCharacters,
            currentRound: session.currentRound,
            numQuestions: session.numQuestions
        });
        
        res.json({ 
            success: true,
            characters: session.roundCharacters,
            thiefIndex: originalIndex
        });
    } catch (error) {
        console.error('Error generating variations:', error);
        session.status = 'error';
        sessions.set(sessionId, session);
        res.status(500).json({ error: 'Error generating variations: ' + error.message });
    }
});

app.post('/api/session/:sessionId/start-round', (req, res) => {
    // Esta ruta ya no se usa, pero la mantenemos por compatibilidad
    res.json({ message: 'Use /generate-character and /generate-variations instead' });
});

app.post('/api/session/:sessionId/question', (req, res) => {
    const { sessionId } = req.params;
    const { question, playerName } = req.body;
    
    const session = sessions.get(sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    if (!question || question.trim().length === 0) {
        return res.status(400).json({ error: 'Question text is required' });
    }
    
    if (session.questions.length >= session.numQuestions) {
        return res.status(400).json({ error: 'No more questions allowed' });
    }
    
    // Agregar pregunta
    const questionObj = {
        id: session.questions.length + 1,
        text: question.trim(),
        playerName: playerName,
        timestamp: Date.now()
    };
    
    session.questions.push(questionObj);
    
    sessions.set(sessionId, session);
    
    // Notificar a todos los clientes (especialmente al maestro)
    io.to(sessionId).emit('questionAsked', {
        question: questionObj,
        questionsRemaining: session.numQuestions - session.questions.length
    });
    
    res.json({ 
        success: true,
        question: questionObj,
        questionsRemaining: session.numQuestions - session.questions.length
    });
});

app.post('/api/session/:sessionId/answer', (req, res) => {
    const { sessionId } = req.params;
    const { answer, masterName } = req.body;
    
    const session = sessions.get(sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.masterName !== masterName) {
        return res.status(403).json({ error: 'Only master can answer' });
    }
    
    session.answers.push(answer);
    
    sessions.set(sessionId, session);
    
    // Notificar a todos los clientes
    io.to(sessionId).emit('questionAnswered', {
        answer,
        answerIndex: session.answers.length - 1,
        questions: session.questions,
        answers: session.answers
    });
    
    res.json({ session });
});

app.post('/api/session/:sessionId/guess', (req, res) => {
    const { sessionId } = req.params;
    const { playerName, characterId } = req.body;
    
    const session = sessions.get(sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    const character = session.roundCharacters.find(c => c.id === characterId);
    if (!character) {
        return res.status(400).json({ error: 'Character not found' });
    }
    
    // Verificar si ya hizo una adivinanza
    const existingGuess = session.guesses.find(g => g.playerName === playerName);
    if (existingGuess) {
        return res.status(400).json({ error: 'Player already guessed' });
    }
    
    const guess = {
        playerName,
        character,
        timestamp: Date.now(),
        questionsUsed: session.numQuestions - (session.numQuestions - session.questions.length)
    };
    
    session.guesses.push(guess);
    sessions.set(sessionId, session);
    
    // Notificar a todos los clientes
    io.to(sessionId).emit('guessMade', {
        guess,
        guesses: session.guesses
    });
    
    // Verificar si todos han adivinado
    const nonMasterPlayers = session.players.filter(p => !p.isMaster).length;
    if (session.guesses.length >= nonMasterPlayers || 
        session.questions.length >= session.numQuestions) {
        endRound(sessionId);
    }
    
    res.json({ session });
});

function endRound(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return;
    
    // Calcular puntuaciones según el nuevo sistema
    const correctGuesses = session.guesses.filter(g => g.character.id === session.thief.id);
    
    // Inicializar puntuaciones si no existen
    if (!session.sessionScores) {
        session.sessionScores = {};
    }
    
    // Resetear puntos de esta ronda para todos los jugadores
    session.guesses.forEach(guess => {
        guess.points = 0;
    });
    
    if (correctGuesses.length === 0) {
        // Nadie adivinó correctamente - el maestro gana 50 puntos
        const masterPlayer = session.players.find(p => p.isMaster);
        if (masterPlayer) {
            session.sessionScores[session.masterName] = (session.sessionScores[session.masterName] || 0) + 50;
            // Marcar que el maestro ganó
            session.masterWon = true;
        }
    } else {
        // Alguien adivinó correctamente - cada uno gana 20 puntos
        correctGuesses.forEach(guess => {
            session.sessionScores[guess.playerName] = (session.sessionScores[guess.playerName] || 0) + 20;
            guess.points = 20;
        });
        session.masterWon = false;
    }
    
    // Actualizar puntuaciones de jugadores
    session.players.forEach(player => {
        player.score = session.sessionScores[player.name] || 0;
    });
    
    session.status = 'roundEnd';
    sessions.set(sessionId, session);
    
    // Notificar a todos los clientes
    io.to(sessionId).emit('roundEnded', {
        thief: session.thief,
        guesses: session.guesses,
        sessionScores: session.sessionScores,
        players: session.players,
        masterWon: session.masterWon || false
    });
}

app.post('/api/session/:sessionId/next-round', (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    session.currentRound++;
    
    if (session.currentRound > session.totalRounds) {
        session.status = 'sessionEnd';
        io.to(sessionId).emit('sessionEnded', {
            players: session.players,
            sessionScores: session.sessionScores
        });
    } else {
        // Resetear para nueva ronda
        session.roundCharacters = [];
        session.thief = null;
        session.questions = [];
        session.answers = [];
        session.guesses = [];
        session.usedQuestions = [];
        session.status = 'waiting';
    }
    
    sessions.set(sessionId, session);
    res.json({ session });
});

// WebSocket connections
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('joinSession', ({ sessionId, playerName }) => {
        socket.join(sessionId);
        players.set(socket.id, { sessionId, playerName });
        
        const session = sessions.get(sessionId);
        if (session) {
            // Actualizar socketId del jugador
            const player = session.players.find(p => p.name === playerName);
            if (player) {
                player.socketId = socket.id;
            }
            
            socket.emit('sessionJoined', { session });
            io.to(sessionId).emit('playerConnected', { playerName, players: session.players });
        }
    });
    
    socket.on('disconnect', () => {
        const playerInfo = players.get(socket.id);
        if (playerInfo) {
            const session = sessions.get(playerInfo.sessionId);
            if (session) {
                io.to(playerInfo.sessionId).emit('playerDisconnected', { 
                    playerName: playerInfo.playerName 
                });
            }
            players.delete(socket.id);
        }
        console.log('Client disconnected:', socket.id);
    });
});

// Rutas estáticas (DESPUÉS de las rutas API)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/videos', express.static(path.join(__dirname, 'public', 'videos')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});

