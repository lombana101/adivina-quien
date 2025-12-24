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
    waitingForAnswer: false,
    socket: null,
    eliminatedCharacters: [], // Personajes eliminados por el jugador
    masterWon: false, // Si el maestro ganó la ronda
    currentModalCharacter: null, // Personaje actualmente mostrado en el modal
    guessedCharacters: [] // Personajes que han sido adivinados (para resaltar)
};

// Inicializar conexión Socket.IO
function initializeSocket() {
    GameState.socket = io();
    
    GameState.socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    GameState.socket.on('sessionJoined', (data) => {
        updateGameState(data.session);
        if (GameState.currentScreen === 'join-screen') {
            updatePlayersList();
        }
    });
    
    GameState.socket.on('playerJoined', (data) => {
        // Actualizar lista de jugadores en el estado
        if (data.players) {
            GameState.players = data.players;
        }
        updatePlayersList();
        // Si estamos en la pantalla de juego, actualizar el leaderboard también
        if (GameState.currentScreen === 'game-screen') {
            renderLeaderboard();
        }
        // Actualizar UI para reflejar cambios
        updateUI();
    });
    
    GameState.socket.on('playerConnected', (data) => {
        // Actualizar lista de jugadores en el estado
        if (data.players) {
            GameState.players = data.players;
        }
        updatePlayersList();
        // Si estamos en la pantalla de juego, actualizar el leaderboard también
        if (GameState.currentScreen === 'game-screen') {
            renderLeaderboard();
        }
        // Actualizar UI para reflejar cambios
        updateUI();
    });
    
    GameState.socket.on('roundStarted', (data) => {
        GameState.roundCharacters = data.roundCharacters;
        GameState.currentRound = data.currentRound;
        GameState.questionsRemaining = data.numQuestions;
        GameState.questions = [];
        GameState.answers = [];
        GameState.guesses = [];
        GameState.usedQuestions = [];
        GameState.eliminatedCharacters = []; // Resetear eliminados al inicio de ronda
        GameState.guessedCharacters = []; // Resetear personajes adivinados al inicio de ronda
        
        // Ocultar pantalla de generación
        const statusDiv = document.getElementById('variations-generation-status');
        if (statusDiv) {
            statusDiv.classList.add('hidden');
        }
        
        // Si es el maestro, ya vio el video al inicio de sesión
        // Si es un invitado, reproducir el video ahora
        if (GameState.isMaster) {
            updateUI();
            showScreen('game-screen');
        } else {
            // Los invitados ven el video cuando la ronda comienza
            playRoundStartVideo(() => {
                updateUI();
                showScreen('game-screen');
            });
        }
    });
    
    GameState.socket.on('variationsGenerationStarted', () => {
        // Ya está mostrando el status
    });
    
    GameState.socket.on('variationGenerated', (data) => {
        const statusDiv = document.getElementById('variations-generation-status');
        const progressBar = document.getElementById('progress-bar-fill');
        const progressText = document.getElementById('progress-text');
        const detail = document.getElementById('status-detail');
        
        if (progressBar) {
            progressBar.style.width = `${data.percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${data.percentage}%`;
        }
        
        if (detail) {
            detail.textContent = `Generando variación ${data.progress} de ${data.total}...`;
        }
    });
    
    GameState.socket.on('questionAsked', (data) => {
        GameState.questions.push(data.question);
        GameState.questionsRemaining = data.questionsRemaining;
        
        if (GameState.isMaster) {
            GameState.waitingForAnswer = true;
            GameState.currentQuestion = data.question;
        }
        
        updateUI();
    });
    
    GameState.socket.on('questionAnswered', (data) => {
        GameState.answers = data.answers;
        GameState.waitingForAnswer = false;
        GameState.currentQuestion = null;
        
        updateUI();
    });
    
    GameState.socket.on('guessMade', (data) => {
        GameState.guesses = data.guesses;
        // Agregar el personaje adivinado a la lista de personajes adivinados
        if (data.guess && data.guess.character) {
            if (!GameState.guessedCharacters.includes(data.guess.character.id)) {
                GameState.guessedCharacters.push(data.guess.character.id);
            }
        }
        updateUI();
        
        // Si alguien adivinó correctamente, mostrar modal y video
        if (data.isCorrect) {
            showThiefFoundModal(data.guess.playerName);
        }
    });
    
    GameState.socket.on('thiefFound', (data) => {
        showThiefFoundModal(data.finder);
    });
    
    GameState.socket.on('roundEnded', (data) => {
        GameState.thief = data.thief;
        GameState.guesses = data.guesses;
        GameState.sessionScores = data.sessionScores;
        GameState.players = data.players;
        GameState.masterWon = data.masterWon || false;
        
        showRoundEndScreen();
    });
    
    GameState.socket.on('sessionEnded', (data) => {
        GameState.players = data.players;
        GameState.sessionScores = data.sessionScores;
        showSessionEndScreen();
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    initializeSocket();
    initializeEventListeners();
    initializeVideoModal();
});

// Event Listeners
function initializeEventListeners() {
    // Home Screen
    document.getElementById('btn-start-master').addEventListener('click', () => showScreen('master-setup-screen'));
    document.getElementById('btn-join-round').addEventListener('click', () => showScreen('join-screen'));
    document.getElementById('btn-leaderboard').addEventListener('click', () => showLeaderboard());

    // Master Setup
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

    // Character Description Screen
    const charDescription = document.getElementById('character-description');
    if (charDescription) {
        charDescription.addEventListener('input', (e) => {
            const count = e.target.value.length;
            document.getElementById('char-count').textContent = count;
        });
    }
    document.getElementById('btn-generate-character').addEventListener('click', generateCharacter);
    document.getElementById('btn-confirm-character').addEventListener('click', confirmAndGenerateVariations);
    document.getElementById('btn-regenerate-character').addEventListener('click', () => {
        document.getElementById('generated-character-preview').classList.add('hidden');
        document.getElementById('character-description').value = '';
        document.getElementById('char-count').textContent = '0';
    });

    // Join Screen
    document.getElementById('btn-join-session').addEventListener('click', joinSession);
    document.getElementById('btn-back-home-2').addEventListener('click', () => showScreen('home-screen'));

    // Game Screen
    document.getElementById('btn-submit-question').addEventListener('click', submitQuestion);
    document.getElementById('question-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitQuestion();
        }
    });
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

    // Video Modal
    const closeVideoBtn = document.getElementById('close-video-btn');
    if (closeVideoBtn) {
        closeVideoBtn.addEventListener('click', closeVideoModal);
    }

    // Character Modal
    const closeCharacterModalBtn = document.getElementById('close-character-modal-btn');
    if (closeCharacterModalBtn) {
        closeCharacterModalBtn.addEventListener('click', closeCharacterModal);
    }
    
    const eliminateCharacterBtn = document.getElementById('btn-eliminate-character');
    if (eliminateCharacterBtn) {
        eliminateCharacterBtn.addEventListener('click', () => {
            if (GameState.currentModalCharacter) {
                eliminateCharacter(GameState.currentModalCharacter);
                closeCharacterModal();
            }
        });
    }
    
    const guessCharacterBtn = document.getElementById('btn-guess-character');
    if (guessCharacterBtn) {
        guessCharacterBtn.addEventListener('click', () => {
            if (GameState.currentModalCharacter) {
                selectCharacterForGuess(GameState.currentModalCharacter);
                closeCharacterModal();
            }
        });
    }
    
    // Cerrar modal al hacer click fuera
    const characterModal = document.getElementById('character-modal');
    if (characterModal) {
        characterModal.addEventListener('click', (e) => {
            if (e.target === characterModal) {
                closeCharacterModal();
            }
        });
    }
}

// Inicializar modal de video
function initializeVideoModal() {
    const video = document.getElementById('round-start-video');
    const iframe = document.getElementById('round-start-video-iframe');
    
    if (video) {
        // Cuando el video termine, cerrar el modal automáticamente
        video.addEventListener('ended', () => {
            closeVideoModal();
        });
    }
    
    // Permitir cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !document.getElementById('round-video-modal').classList.contains('hidden')) {
            closeVideoModal();
        }
    });
    
    // Detectar cuando el iframe termina (si es posible)
    if (iframe) {
        // Los iframes de Google Drive no permiten detectar el fin del video fácilmente
        // Por lo que el usuario deberá cerrar manualmente o esperar un tiempo
    }
}

// Mostrar modal de ladrón encontrado y reproducir video
function showThiefFoundModal(finderName) {
    const modal = document.getElementById('thief-found-modal');
    const finderNameElement = document.getElementById('thief-finder-name');
    
    if (modal && finderNameElement) {
        finderNameElement.textContent = `${finderName} encontró al ladrón!`;
        modal.classList.remove('hidden');
        
        // Después de 3 segundos, cerrar el modal y reproducir el video
        setTimeout(() => {
            modal.classList.add('hidden');
            playThiefFoundVideo();
        }, 3000);
    }
}

// Reproducir video de ladrón encontrado
function playThiefFoundVideo() {
    const videoModal = document.getElementById('thief-found-video-modal');
    const iframe = document.getElementById('thief-found-video-iframe');
    
    if (!videoModal || !iframe) return;
    
    // ID del video de Google Drive: 1TjCZdjiqxrVS5te8JgdpSHdAUeL4LgCh
    const fileId = '1TjCZdjiqxrVS5te8JgdpSHdAUeL4LgCh';
    const iframeUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    
    iframe.src = iframeUrl;
    videoModal.classList.remove('hidden');
    
    // Cerrar automáticamente después de 30 segundos (ajustar según duración del video)
    setTimeout(() => {
        if (!videoModal.classList.contains('hidden')) {
            closeThiefFoundVideoModal();
        }
    }, 30000);
}

// Cerrar modal de video de ladrón encontrado
function closeThiefFoundVideoModal() {
    const videoModal = document.getElementById('thief-found-video-modal');
    const iframe = document.getElementById('thief-found-video-iframe');
    
    if (videoModal) {
        if (iframe) {
            iframe.src = '';
        }
        videoModal.classList.add('hidden');
    }
}

// Reproducir video de inicio de ronda
function playRoundStartVideo(callback) {
    const videoModal = document.getElementById('round-video-modal');
    const video = document.getElementById('round-start-video');
    const iframe = document.getElementById('round-start-video-iframe');
    
    if (!videoModal) return;
    
    // ID del archivo de Google Drive: 16_fhGoYY2BjzG751RCUiqWiq7t_M25FY
    const fileId = '16_fhGoYY2BjzG751RCUiqWiq7t_M25FY';
    
    // Primero intentar con video local (si existe)
    const localVideoUrl = '/videos/round-start.mp4';
    
    // Verificar si existe el video local
    fetch(localVideoUrl, { method: 'HEAD' })
        .then(response => {
            if (response.ok && video) {
                // Usar video local
                video.src = localVideoUrl;
                video.muted = false;
                video.autoplay = true;
                video.playsInline = true;
                video.classList.remove('hidden');
                if (iframe) iframe.classList.add('hidden');
                
                videoModal.classList.remove('hidden');
                
                video.play().catch(error => {
                    console.warn('Error al reproducir video local:', error);
                    // Fallback a Google Drive
                    useGoogleDriveVideo();
                });
                
                // Cerrar cuando termine el video
                const onVideoEnd = () => {
                    closeVideoModal();
                    // Si estamos esperando que termine para mostrar la pantalla de descripción
                    if (GameState.waitingForVideoToComplete) {
                        showScreen('character-description-screen');
                        GameState.waitingForVideoToComplete = false;
                    }
                };
                video.addEventListener('ended', onVideoEnd, { once: true });
                
                // Si estamos esperando que el video complete, configurar el botón de cerrar
                if (GameState.waitingForVideoToComplete) {
                    const originalCloseBtn = document.getElementById('close-video-btn');
                    if (originalCloseBtn) {
                        const tempHandler = () => {
                            closeVideoModal();
                            showScreen('character-description-screen');
                            GameState.waitingForVideoToComplete = false;
                        };
                        originalCloseBtn.addEventListener('click', tempHandler, { once: true });
                    }
                }
            } else {
                // Usar Google Drive como fallback
                useGoogleDriveVideo();
            }
        })
        .catch(() => {
            // Si falla la verificación, usar Google Drive
            useGoogleDriveVideo();
        });
    
    function useGoogleDriveVideo() {
        // Intentar con iframe de Google Drive
        if (iframe) {
            // URL de preview/embed de Google Drive
            const iframeUrl = `https://drive.google.com/file/d/${fileId}/preview`;
            iframe.src = iframeUrl;
            iframe.classList.remove('hidden');
            if (video) video.classList.add('hidden');
            
            // Mostrar el modal
            videoModal.classList.remove('hidden');
            
            // Si estamos esperando que el video complete para mostrar la pantalla de descripción
            if (GameState.waitingForVideoToComplete) {
                // Cerrar automáticamente después de 30 segundos y mostrar pantalla de descripción
                setTimeout(() => {
                    if (!videoModal.classList.contains('hidden')) {
                        closeVideoModal();
                        showScreen('character-description-screen');
                        GameState.waitingForVideoToComplete = false;
                    }
                }, 30000); // 30 segundos - ajusta según la duración real del video
                
                // También permitir cerrar manualmente
                const originalCloseBtn = document.getElementById('close-video-btn');
                if (originalCloseBtn) {
                    const tempHandler = () => {
                        closeVideoModal();
                        showScreen('character-description-screen');
                        GameState.waitingForVideoToComplete = false;
                        originalCloseBtn.removeEventListener('click', tempHandler);
                    };
                    originalCloseBtn.addEventListener('click', tempHandler, { once: true });
                }
            } else {
                // Comportamiento normal - si hay callback, ejecutarlo cuando se cierre
                const closeHandler = () => {
                    if (callback && typeof callback === 'function') {
                        callback();
                    }
                };
                
                // Cerrar automáticamente después de 30 segundos
                setTimeout(() => {
                    if (!videoModal.classList.contains('hidden')) {
                        closeVideoModal();
                        closeHandler();
                    }
                }, 30000);
                
                // También permitir cerrar manualmente
                const closeBtn = document.getElementById('close-video-btn');
                if (closeBtn) {
                    const tempHandler = () => {
                        closeVideoModal();
                        closeHandler();
                        closeBtn.removeEventListener('click', tempHandler);
                    };
                    closeBtn.addEventListener('click', tempHandler, { once: true });
                }
            }
        } else if (video) {
            // Último fallback: intentar con video HTML5 directo desde Google Drive
            const videoUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            
            video.src = videoUrl;
            video.muted = false;
            video.autoplay = true;
            video.playsInline = true;
            video.classList.remove('hidden');
            if (iframe) iframe.classList.add('hidden');
            
            videoModal.classList.remove('hidden');
            
            video.play().catch(error => {
                console.warn('Error al reproducir video automáticamente:', error);
                // Si falla, mostrar mensaje al usuario
                alert('No se pudo reproducir el video automáticamente. Por favor, haz clic en el video para reproducirlo.');
            });
        }
    }
}

// Cerrar modal de video
function closeVideoModal() {
    const videoModal = document.getElementById('round-video-modal');
    const video = document.getElementById('round-start-video');
    const iframe = document.getElementById('round-start-video-iframe');
    
    if (videoModal) {
        if (video) {
            video.pause();
            video.currentTime = 0;
            video.classList.add('hidden');
        }
        
        if (iframe) {
            // Limpiar el src del iframe para detener la reproducción
            iframe.src = '';
            iframe.classList.add('hidden');
        }
        
        videoModal.classList.add('hidden');
    }
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

// Actualizar estado del juego desde el servidor
function updateGameState(session) {
    GameState.sessionId = session.sessionId;
        GameState.currentRound = session.currentRound;
        GameState.totalRounds = session.totalRounds;
        GameState.numQuestions = session.numQuestions;
    GameState.players = session.players || [];
    GameState.sessionScores = session.sessionScores || {};
    GameState.roundCharacters = session.roundCharacters || [];
    GameState.thief = session.thief || null;
    GameState.questions = session.questions || [];
    GameState.answers = session.answers || [];
    GameState.guesses = session.guesses || [];
    GameState.usedQuestions = session.usedQuestions || [];
    GameState.questionsRemaining = session.numQuestions - (session.questions || []).length;
}

// Iniciar nueva sesión (Head Master)
async function startNewSession() {
    const masterName = document.getElementById('master-name').value.trim();
    if (!masterName) {
        alert('Por favor ingresa tu nombre');
        return;
    }

    // Validar numQuestions
    const numQuestions = parseInt(GameState.numQuestions) || 5;
    if (numQuestions < 1 || numQuestions > 10) {
        alert('El número de preguntas debe estar entre 1 y 10');
        return;
    }

    // Validar totalRounds
    const totalRounds = parseInt(GameState.totalRounds) || 5;
    if (totalRounds < 1 || totalRounds > 10) {
        alert('El número de rondas debe estar entre 1 y 10');
        return;
    }

    try {
        const response = await fetch('/api/session/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                masterName,
                numQuestions: numQuestions,
                totalRounds: totalRounds
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error creating session');
        }

        GameState.isMaster = true;
        GameState.playerName = masterName;
        updateGameState(data.session);
        
        // Conectar al socket
        GameState.socket.emit('joinSession', { 
            sessionId: GameState.sessionId, 
            playerName: masterName 
        });

        alert(`¡Sesión creada!\n\nID de Sesión: ${GameState.sessionId}\n\nComparte este ID con otros jugadores para que se unan.`);
        
        // Reproducir video primero, luego ir a la pantalla de descripción cuando termine
        GameState.waitingForVideoToComplete = true;
        playRoundStartVideo();
        
        // Configurar callback para cuando el video termine
        const video = document.getElementById('round-start-video');
        const videoModal = document.getElementById('round-video-modal');
        
        if (video) {
            const onVideoEnd = () => {
                closeVideoModal();
                showScreen('character-description-screen');
                video.removeEventListener('ended', onVideoEnd);
            };
            video.addEventListener('ended', onVideoEnd);
        }
        
        // Si el usuario cierra el video manualmente, también continuar
        const originalCloseBtn = document.getElementById('close-video-btn');
        if (originalCloseBtn) {
            const tempHandler = () => {
                closeVideoModal();
                showScreen('character-description-screen');
                originalCloseBtn.removeEventListener('click', tempHandler);
            };
            originalCloseBtn.addEventListener('click', tempHandler, { once: true });
        }
    } catch (error) {
        alert('Error al crear sesión: ' + error.message);
        console.error(error);
    }
}

// Unirse a sesión
async function joinSession() {
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

    try {
        // Obtener información de la sesión
        const sessionResponse = await fetch(`/api/session/${sessionId}`);
        if (!sessionResponse.ok) {
            throw new Error('Sesión no encontrada');
        }

        // Unirse a la sesión
        const joinResponse = await fetch(`/api/session/${sessionId}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName })
        });

        const data = await joinResponse.json();
        
        if (!joinResponse.ok) {
            throw new Error(data.error || 'Error joining session');
        }

        GameState.playerName = playerName;
        GameState.isMaster = false;
        GameState.sessionId = sessionId; // Asegurar que el sessionId se establece
        updateGameState(data.session);
        
        // Conectar al socket
        GameState.socket.emit('joinSession', { 
            sessionId: GameState.sessionId, 
            playerName: playerName 
        });

        updatePlayersList();
        
        // Actualizar el ID de sesión en la UI
        updateUI();
        
        // Si hay una ronda en curso, ir al juego
        if (data.session.roundCharacters.length > 0 && data.session.thief) {
            // Si la ronda ya comenzó, reproducir el video inicial primero
            playRoundStartVideo(() => {
                showScreen('game-screen');
            });
        } else {
            alert('Te has unido a la sesión. Esperando a que el maestro inicie la primera ronda...');
        }
    } catch (error) {
        alert('Error al unirse a sesión: ' + error.message);
        console.error(error);
    }
}

// Generar personaje desde descripción
async function generateCharacter() {
    const description = document.getElementById('character-description').value.trim();
    
    if (!description || description.length < 10) {
        alert('Por favor ingresa una descripción más detallada del personaje (mínimo 10 caracteres)');
        return;
    }
    
    const statusDiv = document.getElementById('character-generation-status');
    const previewDiv = document.getElementById('generated-character-preview');
    
    statusDiv.classList.remove('hidden');
    previewDiv.classList.add('hidden');
    
    try {
        const response = await fetch(`/api/session/${GameState.sessionId}/generate-character`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error generating character');
        }
        
        const data = await response.json();
        
        // Mostrar la imagen generada
        const imageContainer = document.getElementById('character-image-container');
        imageContainer.innerHTML = `<img src="${data.imageUrl}" alt="Personaje generado" style="max-width: 100%; border-radius: 8px; box-shadow: var(--shadow-lg);">`;
        
        statusDiv.classList.add('hidden');
        previewDiv.classList.remove('hidden');
        
        // Guardar en el estado
        GameState.originalCharacter = description;
        GameState.originalCharacterImage = data.imageUrl;
        
    } catch (error) {
        statusDiv.classList.add('hidden');
        alert('Error al generar personaje: ' + error.message);
        console.error(error);
    }
}

// Confirmar personaje y generar variaciones
async function confirmAndGenerateVariations() {
    const statusDiv = document.getElementById('variations-generation-status');
    const previewDiv = document.getElementById('generated-character-preview');
    
    statusDiv.classList.remove('hidden');
    previewDiv.classList.add('hidden');
    
    try {
        const response = await fetch(`/api/session/${GameState.sessionId}/generate-variations`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error generating variations');
        }
        
        // El evento 'roundStarted' del socket actualizará el estado cuando termine
        // Mientras tanto, mostrar el progreso
        
    } catch (error) {
        statusDiv.classList.add('hidden');
        alert('Error al generar variaciones: ' + error.message);
        console.error(error);
    }
}

// Iniciar ronda (ya no se usa, pero mantenemos por compatibilidad)
async function startRound() {
    // Esta función ya no se usa directamente
    // El flujo ahora es: generateCharacter -> confirmAndGenerateVariations
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

// Renderizar pantalla de juego
function renderGameScreen() {
    renderCharacterGrid();
    
    // Ocultar panel de preguntas para todos (los jugadores no pueden enviar preguntas)
    const questionPanel = document.getElementById('question-panel');
    const guessPanel = document.getElementById('guess-panel');
    
    questionPanel.classList.add('hidden');
    
    if (GameState.isMaster) {
        guessPanel.classList.add('hidden');
        renderQuestions();
    } else {
        // Para guessers, mostrar panel de adivinanza solo si no quedan preguntas
        if (GameState.questionsRemaining === 0) {
            guessPanel.classList.remove('hidden');
        } else {
            guessPanel.classList.add('hidden');
        }
    }
    
    renderLeaderboard();
    updateGameStatus();
}

// Renderizar grid de personajes
function renderCharacterGrid() {
    const grid = document.getElementById('character-grid');
    grid.innerHTML = '';

    // Aleatorizar el orden de los personajes para los guessers
    // El maestro ve el orden original, los guessers ven orden aleatorio
    let charactersToShow = [...GameState.roundCharacters];
    if (!GameState.isMaster) {
        // Crear una copia y aleatorizar solo para guessers
        charactersToShow = [...GameState.roundCharacters].sort(() => Math.random() - 0.5);
    }

    charactersToShow.forEach(character => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.characterId = character.id;
        
        // Verificar si el personaje debe estar blur (por respuestas del maestro)
        const isBlurred = shouldBlurCharacter(character);
        if (isBlurred) {
            card.classList.add('blurred');
        }

        // Verificar si el jugador lo eliminó
        const isEliminated = GameState.eliminatedCharacters.includes(character.id);
        if (isEliminated) {
            card.classList.add('eliminated');
        }

        // Verificar si este personaje fue adivinado por algún jugador
        const isGuessed = GameState.guessedCharacters.includes(character.id);
        if (isGuessed) {
            card.classList.add('guessed');
        }

        // Solo el maestro puede ver que es el ladrón (highlight y nombre especial)
        // Los guessers nunca ven el highlight, incluso si conocen el ID
        if (GameState.isMaster && GameState.thief && character.id === GameState.thief.id) {
            card.classList.add('thief');
        }
        
        // Asegurarse de que los guessers nunca vean la clase 'thief'
        if (!GameState.isMaster) {
            card.classList.remove('thief');
        }

        // Usar imagen del personaje (puede ser de variaciones generadas o predefinidas)
        const imageUrl = character.imageUrl || `/images/characters/character_${character.id}.png`;
        
        // Los guessers no deben ver "El Ladrón" - usar nombre genérico
        let characterName = character.name || `Personaje ${character.id}`;
        if (!GameState.isMaster && character.isThief) {
            // Para guessers, el ladrón tiene un nombre genérico basado en su posición
            const allCharacters = GameState.roundCharacters;
            const characterIndex = allCharacters.findIndex(c => c.id === character.id);
            characterName = `Personaje ${characterIndex + 1}`;
        }
        
        // Si el nombre contiene "El Ladrón", reemplazarlo para guessers
        if (!GameState.isMaster && characterName.includes('Ladrón')) {
            const allCharacters = GameState.roundCharacters;
            const characterIndex = allCharacters.findIndex(c => c.id === character.id);
            characterName = `Personaje ${characterIndex + 1}`;
        }

        card.innerHTML = `
            <div class="character-avatar">
                <img src="${imageUrl}" alt="${characterName}" 
                     onerror="this.parentElement.innerHTML='${getCharacterEmoji(character)}'; this.onerror=null;"
                     style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
            </div>
            <div class="character-name">${characterName}</div>
            ${isEliminated ? '<div class="eliminated-badge">✕ Eliminado</div>' : ''}
            ${isGuessed ? '<div class="guessed-badge">✓ Adivinado</div>' : ''}
        `;

        // Si es el maestro, no permitir interacción
        if (GameState.isMaster) {
            // El maestro solo ve, no interactúa
        } else {
            // Los guessers pueden hacer click para ver en pantalla completa
            if (!isBlurred && !isEliminated) {
                card.addEventListener('click', () => showCharacterModal(character));
                card.style.cursor = 'pointer';
                card.title = 'Toca para ver en pantalla completa';
            } else if (isEliminated) {
                // Si está eliminado, permitir restaurarlo
                card.addEventListener('click', () => showCharacterModal(character));
                card.style.cursor = 'pointer';
                card.title = 'Toca para restaurar';
            }
        }

        grid.appendChild(card);
    });
}

// Obtener emoji para personaje (fallback)
function getCharacterEmoji(character) {
    if (character.name.includes('Niña') || character.name.includes('Girl')) return '👧';
    if (character.name.includes('Niño') || character.name.includes('Boy')) return '👦';
    if (character.name.includes('Mujer') || character.name.includes('Woman')) return '👩';
    if (character.name.includes('Hombre') || character.name.includes('Man')) return '👨';
    if (character.name.includes('Mayor') || character.name.includes('Elderly') || character.name.includes('Old')) return '👴';
    return '🧑';
}

// Verificar si un personaje debe estar blur
// Nota: Como ahora las preguntas son libres, el sistema de blur automático ya no aplica
// Los jugadores eliminan personajes manualmente basándose en las respuestas del maestro
function shouldBlurCharacter(character) {
    // Ya no usamos blur automático - los jugadores eliminan manualmente
    return false;
}

// Renderizar UI de preguntas
function renderQuestions() {
    // Si es el maestro, mostrar panel de respuestas si hay pregunta pendiente
    if (GameState.isMaster) {
        document.getElementById('question-panel').classList.add('hidden');
        document.getElementById('guess-panel').classList.add('hidden');
        
        if (GameState.waitingForAnswer && GameState.currentQuestion) {
            document.getElementById('master-answer-panel').classList.remove('hidden');
            document.getElementById('current-question-text').textContent = GameState.currentQuestion.text;
            document.getElementById('question-author-name').textContent = GameState.currentQuestion.playerName || 'Un jugador';
        } else {
            document.getElementById('master-answer-panel').classList.add('hidden');
        }
        return;
    }

    // Si es guesser, ocultar panel de preguntas (solo mostrar contador)
    document.getElementById('master-answer-panel').classList.add('hidden');
    
    // Actualizar contador de preguntas
    document.getElementById('questions-remaining-display').textContent = GameState.questionsRemaining;
    
    // Ocultar el panel de preguntas completamente - los jugadores no pueden enviar preguntas
    document.getElementById('question-panel').classList.add('hidden');
    
    // Si no quedan preguntas, mostrar panel de adivinanza
    if (GameState.questionsRemaining === 0) {
        document.getElementById('guess-panel').classList.remove('hidden');
    } else {
        document.getElementById('guess-panel').classList.add('hidden');
    }
}

// Enviar pregunta (para guessers)
async function submitQuestion() {
    if (GameState.isMaster) return;
    if (GameState.questionsRemaining === 0) {
        alert('Ya no tienes más preguntas disponibles');
        return;
    }
    
    const questionInput = document.getElementById('question-input');
    const questionText = questionInput.value.trim();
    
    if (!questionText || questionText.length < 3) {
        alert('Por favor escribe una pregunta válida (mínimo 3 caracteres)');
        return;
    }
    
    // Deshabilitar el botón mientras se envía
    const submitBtn = document.getElementById('btn-submit-question');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    
    try {
        const response = await fetch(`/api/session/${GameState.sessionId}/question`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: questionText,
                playerName: GameState.playerName
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error sending question');
        }

        // Limpiar el input
        questionInput.value = '';
        
        // El evento 'questionAsked' del socket actualizará el estado
    } catch (error) {
        alert('Error al enviar pregunta: ' + error.message);
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Pregunta';
    }
}

// Esta función ya no se usa - las preguntas ahora son libres
// Mantenida por compatibilidad pero no se llama
async function askQuestion(category, question) {
    // Deprecated - usar submitQuestion() en su lugar
}

// Responder pregunta (solo maestro)
async function answerQuestion(answer) {
    if (!GameState.isMaster || !GameState.waitingForAnswer) return;

    try {
        const response = await fetch(`/api/session/${GameState.sessionId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                answer,
                masterName: GameState.playerName
            })
        });

        if (!response.ok) {
            throw new Error('Error answering question');
        }

        // El evento 'questionAnswered' del socket actualizará el estado
    } catch (error) {
        alert('Error al responder pregunta: ' + error.message);
        console.error(error);
    }
}

// Mostrar modal de personaje en pantalla completa
function showCharacterModal(character) {
    if (GameState.isMaster) return;
    
    GameState.currentModalCharacter = character;
    
    const modal = document.getElementById('character-modal');
    const modalImage = document.getElementById('character-modal-image');
    const modalName = document.getElementById('character-modal-name');
    const eliminateBtn = document.getElementById('btn-eliminate-character');
    const guessBtn = document.getElementById('btn-guess-character');
    
    const imageUrl = character.imageUrl || `/images/characters/character_${character.id}.png`;
    let characterName = character.name || `Personaje ${character.id}`;
    
    // Ocultar "El Ladrón" para guessers
    if (!GameState.isMaster && character.isThief) {
        const allCharacters = GameState.roundCharacters;
        const characterIndex = allCharacters.findIndex(c => c.id === character.id);
        characterName = `Personaje ${characterIndex + 1}`;
    }
    if (!GameState.isMaster && characterName.includes('Ladrón')) {
        const allCharacters = GameState.roundCharacters;
        const characterIndex = allCharacters.findIndex(c => c.id === character.id);
        characterName = `Personaje ${characterIndex + 1}`;
    }
    
    modalImage.src = imageUrl;
    modalName.textContent = characterName;
    
    // Verificar si está eliminado
    const isEliminated = GameState.eliminatedCharacters.includes(character.id);
    if (isEliminated) {
        eliminateBtn.textContent = '✓ Restaurar';
        eliminateBtn.className = 'btn btn-success';
    } else {
        eliminateBtn.textContent = '✕ Eliminar';
        eliminateBtn.className = 'btn btn-danger';
    }
    
    // Verificar si puede adivinar (no eliminado y tiene preguntas restantes)
    if (isEliminated || GameState.questionsRemaining === 0) {
        guessBtn.style.display = 'none';
    } else {
        guessBtn.style.display = 'block';
    }
    
    modal.classList.remove('hidden');
}

// Cerrar modal de personaje
function closeCharacterModal() {
    const modal = document.getElementById('character-modal');
    modal.classList.add('hidden');
    GameState.currentModalCharacter = null;
}

// Eliminar personaje de sospechosos
function eliminateCharacter(character) {
    if (GameState.isMaster) return;
    
    // Verificar si ya está eliminado
    if (GameState.eliminatedCharacters.includes(character.id)) {
        // Si ya está eliminado, permitir restaurarlo
        GameState.eliminatedCharacters = GameState.eliminatedCharacters.filter(id => id !== character.id);
    } else {
        // Eliminar el personaje
        GameState.eliminatedCharacters.push(character.id);
    }
    
    // Guardar en localStorage para persistencia
    saveEliminatedCharacters();
    
    // Re-renderizar el grid
    renderCharacterGrid();
}

// Seleccionar personaje para adivinanza
function selectCharacterForGuess(character) {
    if (GameState.isMaster) return;
    
    // Verificar si está eliminado
    if (GameState.eliminatedCharacters.includes(character.id)) {
        alert('No puedes adivinar un personaje que has eliminado. Restáuralo primero haciendo click en él.');
        return;
    }

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
async function makeGuess(character) {
    try {
        const response = await fetch(`/api/session/${GameState.sessionId}/guess`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerName: GameState.playerName,
                characterId: character.id
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error making guess');
        }

        // El evento 'guessMade' o 'roundEnded' del socket actualizará el estado
    } catch (error) {
        alert('Error al hacer adivinanza: ' + error.message);
        console.error(error);
    }
}

// Mostrar pantalla de fin de ronda
function showRoundEndScreen() {
    const thiefDiv = document.getElementById('thief-character');
    const imageUrl = GameState.thief.imageUrl || `/images/characters/character_${GameState.thief.id}.png`;
    // Mostrar "El Ladrón" solo al final cuando se revela
    const thiefName = 'El Ladrón';
    
    thiefDiv.innerHTML = `
        <div class="character-card" style="max-width: 200px; margin: 0 auto;">
            <div class="character-avatar" style="width: 100px; height: 100px;">
                <img src="${imageUrl}" alt="${thiefName}" 
                     onerror="this.parentElement.innerHTML='${getCharacterEmoji(GameState.thief)}'; this.onerror=null;"
                     style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
            </div>
            <div class="character-name" style="font-size: 1.2rem; margin-top: 1rem;">
                ${thiefName}
            </div>
        </div>
    `;

    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = '';

    // Mostrar resultados de los guessers
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
    
    // Si el maestro ganó (nadie adivinó), mostrarlo
    if (GameState.masterWon) {
        const masterPlayer = GameState.players.find(p => p.isMaster);
        if (masterPlayer) {
            const li = document.createElement('li');
            li.className = 'correct';
            li.innerHTML = `
                <div>
                    <strong>${masterPlayer.name} (Maestro) 👑</strong><br>
                    <small>Nadie adivinó correctamente</small>
                </div>
                <div>
                    <strong>+50 pts</strong>
                </div>
            `;
            resultsList.appendChild(li);
        }
    }

    const isLastRound = GameState.currentRound >= GameState.totalRounds;
    document.getElementById('btn-next-round').classList.toggle('hidden', isLastRound);
    document.getElementById('btn-end-session').classList.toggle('hidden', !isLastRound);

    document.getElementById('round-progress').textContent = GameState.currentRound;
    document.getElementById('total-rounds-progress').textContent = GameState.totalRounds;

    showScreen('round-end-screen');
}

// Iniciar siguiente ronda
async function startNextRound() {
    if (!GameState.isMaster) return;

    try {
        const response = await fetch(`/api/session/${GameState.sessionId}/next-round`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Error starting next round');
        }

        const data = await response.json();
        
        if (data.session.status === 'sessionEnd') {
            showSessionEndScreen();
        } else {
            // startRound() disparará el evento 'roundStarted' que reproducirá el video
            await startRound();
        }
    } catch (error) {
        alert('Error al iniciar siguiente ronda: ' + error.message);
        console.error(error);
    }
}

// Finalizar sesión
function endSession() {
    showSessionEndScreen();
}

// Mostrar pantalla de fin de sesión
function showSessionEndScreen() {
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

// Actualizar UI
function updateUI() {
    document.getElementById('current-round').textContent = GameState.currentRound;
    document.getElementById('total-rounds').textContent = GameState.totalRounds;
    document.getElementById('session-id-display').textContent = GameState.sessionId;
    document.getElementById('questions-remaining').textContent = GameState.questionsRemaining;
    
    // Cargar personajes eliminados guardados
    loadEliminatedCharacters();
    
    renderCharacterGrid();
    renderQuestions();
    renderLeaderboard();
    updateGameStatus();
}

// Guardar personajes eliminados en localStorage
function saveEliminatedCharacters() {
    if (GameState.sessionId) {
        localStorage.setItem(`eliminated_${GameState.sessionId}_${GameState.currentRound}`, 
            JSON.stringify(GameState.eliminatedCharacters));
    }
}

// Cargar personajes eliminados de localStorage
function loadEliminatedCharacters() {
    if (GameState.sessionId) {
        const saved = localStorage.getItem(`eliminated_${GameState.sessionId}_${GameState.currentRound}`);
        if (saved) {
            GameState.eliminatedCharacters = JSON.parse(saved);
        }
    }
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
        waitingForAnswer: false,
        eliminatedCharacters: [],
        guessedCharacters: []
    });
    
    if (GameState.socket) {
        GameState.socket.disconnect();
        initializeSocket();
    }
}

