// Estado global del juego
const GameState = {
    currentScreen: 'home-screen',
    sessionId: null,
    isMaster: false,
    playerName: '',
    currentRound: 1,
    totalRounds: 5,
    numCharacters: 10,
    numQuestions: 5,
    questionsRemaining: 5,
    roundCharacters: [],
    thief: null,
    players: [],
    questions: [],
    answers: [],
    guesses: [],
    sessionScores: {},
    usedQuestions: [],
    currentQuestion: null,
    waitingForAnswer: false
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    // No cargar sesión automáticamente al inicio
});

// Event Listeners
function initializeEventListeners() {
    // Home Screen
    document.getElementById('btn-start-master').addEventListener('click', () => showScreen('master-setup-screen'));
    document.getElementById('btn-join-round').addEventListener('click', () => showScreen('join-screen'));
    document.getElementById('btn-leaderboard').addEventListener('click', () => showLeaderboard());

    // Master Setup
    document.getElementById('num-characters').addEventListener('input', (e) => {
        document.getElementById('characters-display').textContent = e.target.value;
        GameState.numCharacters = parseInt(e.target.value);
    });
    document.getElementById('num-questions').addEventListener('input', (e) => {
        document.getElementById('questions-display').textContent = e.target.value;
        GameState.numQuestions = parseInt(e.target.value);
    });
    document.getElementById('num-rounds').addEventListener('input', (e) => {
        document.getElementById('rounds-display').textContent = e.target.value;
        GameState.totalRounds = parseInt(e.target.value);
    });
    document.getElementById('btn-start-round').addEventListener('click', startNewSession);
    document.getElementById('btn-back-home').addEventListener('click', () => showScreen('home-screen'));

    // Join Screen
    document.getElementById('btn-join-session').addEventListener('click', joinSession);
    document.getElementById('btn-back-home-2').addEventListener('click', () => showScreen('home-screen'));

    // Game Screen
    document.getElementById('btn-answer-yes').addEventListener('click', () => answerQuestion(true));
    document.getElementById('btn-answer-no').addEventListener('click', () => answerQuestion(false));
    document.getElementById('btn-make-guess').addEventListener('click', showGuessModal);

    // Round End Screen
    document.getElementById('btn-next-round').addEventListener('click', startNextRound);
    document.getElementById('btn-end-session').addEventListener('click', endSession);
    document.getElementById('btn-back-to-game').addEventListener('click', () => showScreen('game-screen'));

    // Session End Screen
    document.getElementById('btn-new-session').addEventListener('click', () => {
        resetGame();
        showScreen('home-screen');
    });
    document.getElementById('btn-back-home-final').addEventListener('click', () => {
        resetGame();
        showScreen('home-screen');
    });

    // Leaderboard Screen
    document.getElementById('btn-back-home-3').addEventListener('click', () => showScreen('home-screen'));
}

// Navegación de pantallas
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    GameState.currentScreen = screenId;

    if (screenId === 'game-screen') {
        renderGameScreen();
    }
}

// Iniciar nueva sesión (Head Master)
function startNewSession() {
    const masterName = document.getElementById('master-name').value.trim();
    if (!masterName) {
        alert('Por favor ingresa tu nombre');
        return;
    }

    GameState.isMaster = true;
    GameState.playerName = masterName;
    GameState.sessionId = generateSessionId();
    GameState.currentRound = 1;
    GameState.players = [{ name: masterName, isMaster: true, score: 0 }];
    GameState.sessionScores = { [masterName]: 0 };
    GameState.questionsRemaining = GameState.numQuestions;

    // Guardar en localStorage
    saveSessionToStorage();

    // Mostrar ID de sesión
    alert(`¡Sesión creada!\n\nID de Sesión: ${GameState.sessionId}\n\nComparte este ID con otros jugadores para que se unan.`);

    // Iniciar primera ronda
    startRound();
}

// Generar ID de sesión de 4 dígitos
function generateSessionId() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Unirse a sesión
function joinSession() {
    const sessionId = document.getElementById('session-id-input').value.trim();
    const playerName = document.getElementById('player-name').value.trim();

    if (!sessionId || sessionId.length !== 4) {
        alert('Por favor ingresa un ID de sesión válido (4 dígitos)');
        return;
    }

    if (!playerName) {
        alert('Por favor ingresa tu nombre');
        return;
    }

    // Cargar sesión existente
    const existingSession = loadSessionFromStorage(sessionId);
    
    if (existingSession && existingSession.sessionId === sessionId) {
        // Cargar estado de la sesión
        GameState.sessionId = existingSession.sessionId;
        GameState.currentRound = existingSession.currentRound;
        GameState.totalRounds = existingSession.totalRounds;
        GameState.numCharacters = existingSession.numCharacters;
        GameState.numQuestions = existingSession.numQuestions;
        GameState.players = existingSession.players || [];
        GameState.sessionScores = existingSession.sessionScores || {};
        GameState.roundCharacters = existingSession.roundCharacters || [];
        GameState.thief = existingSession.thief || null;
        
        // Agregar jugador si no existe
        if (!GameState.players.find(p => p.name === playerName)) {
            GameState.players.push({ name: playerName, isMaster: false, score: GameState.sessionScores[playerName] || 0 });
            if (!GameState.sessionScores[playerName]) {
                GameState.sessionScores[playerName] = 0;
            }
        }
        
        GameState.playerName = playerName;
        GameState.isMaster = false;
        
        // Guardar sesión actualizada
        saveSessionToStorage();
        
        // Actualizar lista de jugadores en la UI
        updatePlayersList();
        
        // Si hay una ronda en curso, ir al juego, sino iniciar nueva ronda
        if (GameState.roundCharacters.length > 0 && GameState.thief) {
            // Restaurar estado de la ronda actual
            GameState.questionsRemaining = GameState.numQuestions - (existingSession.questions || []).length;
            GameState.questions = existingSession.questions || [];
            GameState.answers = existingSession.answers || [];
            GameState.guesses = existingSession.guesses || [];
            GameState.usedQuestions = existingSession.usedQuestions || [];
            
            showScreen('game-screen');
        } else {
            // Mostrar mensaje de espera
            alert('Te has unido a la sesión. Esperando a que el maestro inicie la primera ronda...');
            // El jugador verá la pantalla de unión con la lista de jugadores
            showScreen('join-screen');
        }
    } else {
        alert('Sesión no encontrada. Asegúrate de que el ID sea correcto y que el maestro haya iniciado la sesión.');
    }
}

// Iniciar ronda
function startRound() {
    // Seleccionar personajes aleatorios
    const shuffled = [...CHARACTERS].sort(() => Math.random() - 0.5);
    GameState.roundCharacters = shuffled.slice(0, GameState.numCharacters);
    
    // Seleccionar ladrón aleatorio
    GameState.thief = GameState.roundCharacters[Math.floor(Math.random() * GameState.roundCharacters.length)];
    
    // Resetear estado de ronda
    GameState.questionsRemaining = GameState.numQuestions;
    GameState.questions = [];
    GameState.answers = [];
    GameState.guesses = [];
    GameState.usedQuestions = [];
    GameState.currentQuestion = null;
    GameState.waitingForAnswer = false;

    // Guardar estado
    saveSessionToStorage();

    // Actualizar UI
    document.getElementById('current-round').textContent = GameState.currentRound;
    document.getElementById('total-rounds').textContent = GameState.totalRounds;
    document.getElementById('session-id-display').textContent = GameState.sessionId;
    document.getElementById('questions-remaining').textContent = GameState.questionsRemaining;

    showScreen('game-screen');
}

// Renderizar pantalla de juego
function renderGameScreen() {
    renderCharacterGrid();
    renderQuestions();
    renderLeaderboard();
    updateGameStatus();
    
    // Guardar estado periódicamente
    saveSessionToStorage();
}

// Renderizar grid de personajes
function renderCharacterGrid() {
    const grid = document.getElementById('character-grid');
    grid.innerHTML = '';

    GameState.roundCharacters.forEach(character => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.characterId = character.id;
        
        // Verificar si el personaje debe estar blur
        const isBlurred = shouldBlurCharacter(character);
        if (isBlurred) {
            card.classList.add('blurred');
        }

        // Verificar si es el ladrón (solo mostrar al final)
        if (GameState.thief && character.id === GameState.thief.id) {
            card.classList.add('thief');
        }

        card.innerHTML = `
            <div class="character-avatar">${getCharacterEmoji(character)}</div>
            <div class="character-name">${character.name}</div>
        `;

        // Solo permitir click si no está blur y no es el maestro
        if (!isBlurred && !GameState.isMaster) {
            card.addEventListener('click', () => selectCharacterForGuess(character));
        }

        grid.appendChild(card);
    });
}

// Obtener emoji para personaje
function getCharacterEmoji(character) {
    // Emojis simples basados en género/edad aproximada
    if (character.name.includes('Niña') || character.name.includes('Girl')) return '👧';
    if (character.name.includes('Niño') || character.name.includes('Boy')) return '👦';
    if (character.name.includes('Mujer') || character.name.includes('Woman')) return '👩';
    if (character.name.includes('Hombre') || character.name.includes('Man')) return '👨';
    if (character.name.includes('Mayor') || character.name.includes('Elderly') || character.name.includes('Old')) return '👴';
    return '🧑';
}

// Verificar si un personaje debe estar blur
function shouldBlurCharacter(character) {
    if (GameState.isMaster) return false; // El maestro ve todos los personajes
    
    for (let i = 0; i < GameState.answers.length; i++) {
        const answer = GameState.answers[i];
        const question = GameState.questions[i];
        
        if (!matchesAnswer(character, question, answer)) {
            return true;
        }
    }
    
    return false;
}

// Verificar si un personaje coincide con una respuesta
function matchesAnswer(character, question, answer) {
    const { category, value } = question;
    
    // Casos especiales
    if (value === 'hasAccessory') {
        return answer ? character.accessory !== 'None' : character.accessory === 'None';
    }
    
    if (value === 'hasProp') {
        return answer ? (character.prop && character.prop !== 'None') : (!character.prop || character.prop === 'None');
    }
    
    // Mapeo de categorías a campos del personaje
    const categoryMap = {
        'height': 'height',
        'accessory': 'accessory',
        'prop': 'prop',
        'pose': 'pose',
        'mood': 'mood',
        'colorAccent': 'colorAccent',
        'shirt': 'shirt',
        'pants': 'pants'
    };
    
    const characterField = categoryMap[category];
    if (!characterField) {
        return true; // Si no hay mapeo, no filtrar
    }
    
    const characterValue = character[characterField];
    
    // Comparación: si la respuesta es "sí", el personaje debe tener ese valor
    // Si la respuesta es "no", el personaje NO debe tener ese valor
    return answer ? characterValue === value : characterValue !== value;
}

// Renderizar preguntas
function renderQuestions() {
    const questionsList = document.getElementById('questions-list');
    questionsList.innerHTML = '';

    // Si es el maestro, mostrar panel de respuestas si hay pregunta pendiente
    if (GameState.isMaster && GameState.waitingForAnswer) {
        document.getElementById('master-answer-panel').classList.remove('hidden');
        document.getElementById('current-question-text').textContent = GameState.currentQuestion.text;
        return;
    }

    document.getElementById('master-answer-panel').classList.add('hidden');

    // Si no quedan preguntas, mostrar panel de adivinanza
    if (GameState.questionsRemaining === 0 || GameState.usedQuestions.length >= GameState.numQuestions) {
        document.getElementById('guess-panel').classList.remove('hidden');
        return;
    }

    document.getElementById('guess-panel').classList.add('hidden');

    // Generar lista de preguntas disponibles
    Object.keys(QUESTION_CATEGORIES).forEach(categoryKey => {
        const category = QUESTION_CATEGORIES[categoryKey];
        category.questions.forEach(question => {
            const questionId = `${categoryKey}-${question.value}`;
            const isUsed = GameState.usedQuestions.includes(questionId);

            const btn = document.createElement('button');
            btn.className = `question-btn ${isUsed ? 'used' : ''}`;
            btn.textContent = question.text;
            btn.disabled = isUsed || GameState.questionsRemaining === 0;
            
            if (!isUsed) {
                btn.addEventListener('click', () => askQuestion(categoryKey, question));
            }

            questionsList.appendChild(btn);
        });
    });
}

// Hacer una pregunta
function askQuestion(category, question) {
    if (GameState.questionsRemaining === 0) return;

    const questionId = `${category}-${question.value}`;
    GameState.usedQuestions.push(questionId);
    GameState.questions.push({ category, value: question.value, text: question.text });
    GameState.questionsRemaining--;
    GameState.currentQuestion = question;

    document.getElementById('questions-remaining').textContent = GameState.questionsRemaining;

    // Guardar estado
    saveSessionToStorage();

    // Si es el maestro, puede responder inmediatamente
    if (GameState.isMaster) {
        GameState.waitingForAnswer = true;
        renderQuestions();
    } else {
        // Los guessers esperan la respuesta del maestro
        GameState.waitingForAnswer = true;
        updateGameStatus('Esperando respuesta del maestro...');
    }

    renderQuestions();
}

// Responder pregunta (solo maestro)
function answerQuestion(answer) {
    if (!GameState.isMaster || !GameState.waitingForAnswer) return;

    GameState.answers.push(answer);
    GameState.waitingForAnswer = false;
    GameState.currentQuestion = null;

    // Guardar estado
    saveSessionToStorage();

    // Aplicar filtro a los personajes
    renderCharacterGrid();
    renderQuestions();
    updateGameStatus();
}

// Seleccionar personaje para adivinanza
function selectCharacterForGuess(character) {
    if (GameState.isMaster) return;

    // Confirmar adivinanza
    if (confirm(`¿Estás seguro de que el ladrón es ${character.name}?`)) {
        makeGuess(character);
    }
}

// Mostrar modal de adivinanza
function showGuessModal() {
    if (GameState.isMaster) {
        alert('El maestro no puede hacer adivinanzas. Debes esperar a que los jugadores adivinen.');
        return;
    }

    const unblurredCharacters = GameState.roundCharacters.filter(c => !shouldBlurCharacter(c));
    
    if (unblurredCharacters.length === 0) {
        alert('No hay personajes disponibles para adivinar.');
        return;
    }

    // Mostrar personajes disponibles
    let message = 'Selecciona el personaje que crees que es el ladrón:\n\n';
    unblurredCharacters.forEach((char, index) => {
        message += `${index + 1}. ${char.name}\n`;
    });

    const choice = prompt(message + '\nIngresa el número del personaje:');
    const index = parseInt(choice) - 1;

    if (index >= 0 && index < unblurredCharacters.length) {
        makeGuess(unblurredCharacters[index]);
    }
}

// Hacer adivinanza
function makeGuess(character) {
    const guess = {
        playerName: GameState.playerName,
        character: character,
        timestamp: Date.now(),
        questionsUsed: GameState.numQuestions - GameState.questionsRemaining
    };

    // Verificar si ya hizo una adivinanza
    const existingGuess = GameState.guesses.find(g => g.playerName === GameState.playerName);
    if (existingGuess) {
        alert('Ya has hecho tu adivinanza en esta ronda.');
        return;
    }

    GameState.guesses.push(guess);
    
    // Guardar estado
    saveSessionToStorage();

    // Si todos han adivinado o no quedan preguntas, terminar ronda
    const nonMasterPlayers = GameState.players.filter(p => !p.isMaster).length;
    if (GameState.guesses.length >= nonMasterPlayers || GameState.questionsRemaining === 0) {
        // Esperar un momento antes de terminar para que todos puedan ver
        setTimeout(() => {
            endRound();
        }, 1000);
    } else {
        updateGameStatus(`${GameState.playerName} ha hecho su adivinanza. Esperando a otros jugadores...`);
    }
}

// Terminar ronda
function endRound() {
    // Calcular puntuaciones
    calculateRoundScores();

    // Mostrar pantalla de fin de ronda
    showRoundEndScreen();
}

// Calcular puntuaciones de la ronda
function calculateRoundScores() {
    const correctGuesses = GameState.guesses.filter(g => g.character.id === GameState.thief.id);
    const fastestGuess = correctGuesses.length > 0 
        ? correctGuesses.reduce((fastest, guess) => 
            guess.timestamp < fastest.timestamp ? guess : fastest, correctGuesses[0])
        : null;

    GameState.guesses.forEach(guess => {
        let points = 0;
        
        if (guess.character.id === GameState.thief.id) {
            points = 50; // Puntos base por adivinanza correcta
            
            // Bonus por usar 3 o menos preguntas
            if (guess.questionsUsed <= 3) {
                points += 10;
            }
            
            // Bonus por ser el más rápido
            if (fastestGuess && guess.playerName === fastestGuess.playerName) {
                points += 5;
            }
        }

        // Actualizar puntuación de sesión
        if (!GameState.sessionScores[guess.playerName]) {
            GameState.sessionScores[guess.playerName] = 0;
        }
        GameState.sessionScores[guess.playerName] += points;
        guess.points = points;
    });

    // Actualizar puntuaciones de jugadores
    GameState.players.forEach(player => {
        player.score = GameState.sessionScores[player.name] || 0;
    });
}

// Mostrar pantalla de fin de ronda
function showRoundEndScreen() {
    const thiefDiv = document.getElementById('thief-character');
    thiefDiv.innerHTML = `
        <div class="character-card" style="max-width: 200px; margin: 0 auto;">
            <div class="character-avatar" style="width: 100px; height: 100px; font-size: 4rem;">
                ${getCharacterEmoji(GameState.thief)}
            </div>
            <div class="character-name" style="font-size: 1.2rem; margin-top: 1rem;">
                ${GameState.thief.name}
            </div>
        </div>
    `;

    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = '';

    GameState.guesses.forEach(guess => {
        const li = document.createElement('li');
        li.className = guess.character.id === GameState.thief.id ? 'correct' : 'incorrect';
        li.innerHTML = `
            <div>
                <strong>${guess.playerName}</strong><br>
                <small>Adivinó: ${guess.character.name}</small>
            </div>
            <div>
                <strong>${guess.points || 0} pts</strong>
            </div>
        `;
        resultsList.appendChild(li);
    });

    // Mostrar/ocultar botones según el estado
    const isLastRound = GameState.currentRound >= GameState.totalRounds;
    document.getElementById('btn-next-round').classList.toggle('hidden', isLastRound);
    document.getElementById('btn-end-session').classList.toggle('hidden', !isLastRound);

    document.getElementById('round-progress').textContent = GameState.currentRound;
    document.getElementById('total-rounds-progress').textContent = GameState.totalRounds;

    showScreen('round-end-screen');
}

// Iniciar siguiente ronda
function startNextRound() {
    GameState.currentRound++;
    startRound();
}

// Finalizar sesión
function endSession() {
    showSessionEndScreen();
}

// Mostrar pantalla de fin de sesión
function showSessionEndScreen() {
    // Ordenar jugadores por puntuación
    const sortedPlayers = [...GameState.players].sort((a, b) => b.score - a.score);

    const leaderboardList = document.getElementById('final-leaderboard-list');
    leaderboardList.innerHTML = '';

    sortedPlayers.forEach((player, index) => {
        const li = document.createElement('li');
        if (index === 0) {
            li.style.background = 'linear-gradient(135deg, #F39C12 0%, #E67E22 100%)';
            li.style.color = 'white';
        }
        li.innerHTML = `
            <span>${index + 1}. ${player.name} ${player.isMaster ? '(Maestro)' : ''}</span>
            <strong>${player.score} pts</strong>
        `;
        leaderboardList.appendChild(li);
    });

    // Mostrar estadísticas
    const statsContent = document.getElementById('stats-content');
    statsContent.innerHTML = `
        <div class="stat-item">
            <span>Rondas Jugadas:</span>
            <strong>${GameState.currentRound}</strong>
        </div>
        <div class="stat-item">
            <span>Total de Jugadores:</span>
            <strong>${GameState.players.length}</strong>
        </div>
    `;

    showScreen('session-end-screen');
}

// Mostrar leaderboard
function showLeaderboard() {
    const content = document.getElementById('leaderboard-content');
    
    if (Object.keys(GameState.sessionScores).length === 0) {
        content.innerHTML = '<p>No hay puntuaciones aún. ¡Inicia una sesión para comenzar!</p>';
    } else {
        const sorted = Object.entries(GameState.sessionScores)
            .sort((a, b) => b[1] - a[1])
            .map(([name, score], index) => `
                <div class="stat-item">
                    <span>${index + 1}. ${name}</span>
                    <strong>${score} pts</strong>
                </div>
            `).join('');
        
        content.innerHTML = sorted;
    }

    showScreen('leaderboard-screen');
}

// Renderizar leaderboard en juego
function renderLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';

    const sorted = [...GameState.players].sort((a, b) => b.score - a.score);

    sorted.forEach((player, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="player-name">${index + 1}. ${player.name} ${player.isMaster ? '👑' : ''}</span>
            <span class="player-score">${player.score} pts</span>
        `;
        list.appendChild(li);
    });
}

// Actualizar estado del juego
function updateGameStatus(message) {
    const statusEl = document.getElementById('game-status');
    if (message) {
        statusEl.textContent = message;
    } else if (GameState.questionsRemaining > 0) {
        statusEl.textContent = `Preguntas restantes: ${GameState.questionsRemaining}`;
    } else {
        statusEl.textContent = 'Haz tu adivinanza';
    }
}

// Guardar sesión en localStorage
function saveSessionToStorage() {
    if (!GameState.sessionId) return;
    
    const sessionData = {
        sessionId: GameState.sessionId,
        currentRound: GameState.currentRound,
        totalRounds: GameState.totalRounds,
        numCharacters: GameState.numCharacters,
        numQuestions: GameState.numQuestions,
        players: GameState.players,
        sessionScores: GameState.sessionScores,
        roundCharacters: GameState.roundCharacters,
        thief: GameState.thief,
        questions: GameState.questions,
        answers: GameState.answers,
        guesses: GameState.guesses,
        usedQuestions: GameState.usedQuestions,
        questionsRemaining: GameState.questionsRemaining
    };
    
    localStorage.setItem(`session_${GameState.sessionId}`, JSON.stringify(sessionData));
    localStorage.setItem('currentSessionId', GameState.sessionId);
}

// Cargar sesión de localStorage
function loadSessionFromStorage(sessionId) {
    const sessionIdToLoad = sessionId || localStorage.getItem('currentSessionId');
    if (!sessionIdToLoad) return null;

    const data = localStorage.getItem(`session_${sessionIdToLoad}`);
    if (!data) return null;

    try {
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
}

// Actualizar lista de jugadores
function updatePlayersList() {
    const playersList = document.getElementById('players-list');
    if (!playersList) return;
    
    playersList.innerHTML = '';
    
    if (GameState.players.length === 0) {
        playersList.innerHTML = '<li>No hay jugadores aún</li>';
        return;
    }
    
    GameState.players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.name} ${player.isMaster ? '👑 (Maestro)' : ''}`;
        playersList.appendChild(li);
    });
}

// Resetear juego
function resetGame() {
    Object.assign(GameState, {
        currentScreen: 'home-screen',
        sessionId: null,
        isMaster: false,
        playerName: '',
        currentRound: 1,
        totalRounds: 5,
        numCharacters: 10,
        numQuestions: 5,
        questionsRemaining: 5,
        roundCharacters: [],
        thief: null,
        players: [],
        questions: [],
        answers: [],
        guesses: [],
        sessionScores: {},
        usedQuestions: [],
        currentQuestion: null,
        waitingForAnswer: false
    });
    
    // Limpiar localStorage
    if (GameState.sessionId) {
        localStorage.removeItem(`session_${GameState.sessionId}`);
    }
    localStorage.removeItem('currentSessionId');
}

