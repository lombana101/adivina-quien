# ¿Quién Escondió los Shorts?

Un juego de deducción móvil web-friendly en español donde los jugadores deben descubrir quién escondió los shorts sagrados usando preguntas limitadas de sí/no.

## 🎮 Características

- **Juego de Deducción**: Usa 5-6 preguntas limitadas para identificar al ladrón
- **40+ Personajes Únicos**: Cada personaje tiene una combinación única de rasgos
- **Imágenes AI Generadas**: Personajes ilustrados con DALL-E 3
- **Backend en Tiempo Real**: Servidor Node.js con WebSockets para sincronización multi-dispositivo
- **Sesiones Persistentes**: Juega múltiples rondas con seguimiento de puntuación acumulativa
- **Multi-Jugador**: Un maestro controla las respuestas, múltiples jugadores adivinan
- **Diseño Mobile-First**: Optimizado para dispositivos móviles
- **Filtrado Dinámico**: Los personajes se desvanecen según las respuestas

## 🚀 Instalación

### Prerrequisitos

- Node.js (v16 o superior)
- npm o yarn
- Cuenta de OpenAI con API key (para generar imágenes)

### Pasos de Instalación

1. **Clonar o descargar el repositorio**

```bash
cd mobile-game
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita `.env` y agrega tu API key de OpenAI:

```
OPENAI_API_KEY=tu_api_key_aqui
PORT=3000
```

Puedes obtener tu API key de OpenAI en: https://platform.openai.com/api-keys

4. **Generar imágenes de personajes (Opcional pero recomendado)**

```bash
npm run generate-images
```

Este comando generará imágenes AI para los 40 personajes usando DALL-E 3. El proceso puede tardar varios minutos ya que hay un delay entre cada imagen para evitar rate limits.

**Nota:** Si no generas las imágenes, el juego usará emojis como fallback.

5. **Iniciar el servidor**

   ```bash
   npm start
   ```

   O para desarrollo con auto-reload:

   ```bash
   npm run dev
   ```

   El servidor estará disponible en: `http://localhost:3000`

   **Nota:** Cuando una ronda inicia, se reproducirá automáticamente un video de introducción. Puedes cerrarlo haciendo clic en la X o presionando Escape.

## 🎯 Cómo Jugar

### Para el Maestro (Head Master)

1. Abre la aplicación en tu navegador (o en múltiples dispositivos)
2. Haz clic en **"Iniciar Ronda (Maestro)"**
3. Configura:
   - Número de personajes (8-12)
   - Preguntas por ronda (5-6)
   - Número de rondas (1-10)
   - Tu nombre
4. Haz clic en **"Iniciar Ronda"**
5. Se generará un **ID de Sesión de 4 dígitos** - compártelo con otros jugadores
6. Cuando los jugadores hagan preguntas, responde **Sí** o **No**
7. Al final de cada ronda, verás los resultados y podrás iniciar la siguiente ronda

### Para los Adivinadores (Guessers)

1. Abre la aplicación en tu navegador (puede ser en diferentes dispositivos)
2. Haz clic en **"Unirse a Ronda"**
3. Ingresa:
   - El **ID de Sesión** de 4 dígitos (del maestro)
   - Tu nombre
4. Haz clic en **"Unirse"**
5. Verás todos los personajes en una cuadrícula
6. Selecciona preguntas de las categorías disponibles:
   - Altura
   - Accesorio
   - Objeto
   - Pose
   - Estado de Ánimo
   - Color de Acento
   - Camisa
   - Pantalones
7. Después de cada respuesta del maestro, los personajes que no coincidan se desvanecerán
8. Cuando estés listo, haz clic en **"Hacer Mi Adivinanza"** y selecciona el personaje que crees que es el ladrón

## 📊 Sistema de Puntuación

- **Adivinanza Correcta**: 50 puntos
- **Bonus por Eficiencia**: +10 puntos si usas 3 o menos preguntas
- **Bonus por Velocidad**: +5 puntos si eres el primero en adivinar correctamente
- **Adivinanza Incorrecta**: 0 puntos

Las puntuaciones se acumulan a lo largo de todas las rondas de la sesión.

## 🎯 Estrategia

- Cada rasgo individual aparece en al menos 5 personajes
- **Ninguna pregunta individual puede identificar al ladrón**
- Debes combinar múltiples respuestas para reducir las posibilidades
- Observa qué personajes quedan después de cada pregunta
- Usa tus preguntas sabiamente - solo tienes 5-6 por ronda

## 🛠️ Tecnologías

### Frontend
- HTML5
- CSS3 (Mobile-First, Responsive Design)
- JavaScript Vanilla (ES6+)
- Socket.IO Client

### Backend
- Node.js
- Express.js
- Socket.IO (WebSockets para tiempo real)
- OpenAI API (DALL-E 3 para generación de imágenes)

## 📁 Estructura del Proyecto

```
mobile-game/
├── public/                 # Archivos estáticos del frontend
│   ├── index.html
│   ├── styles.css
│   ├── characters.js
│   └── game-client.js
├── images/                 # Imágenes generadas
│   └── characters/         # Imágenes de personajes
├── scripts/                # Scripts de utilidad
│   └── generateImages.js   # Generador de imágenes AI
├── server.js               # Servidor Express + Socket.IO
├── package.json
├── .env                    # Variables de entorno (no commitear)
└── README.md
```

## 🔧 Scripts Disponibles

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor en modo desarrollo con auto-reload
- `npm run generate-images` - Genera imágenes AI para todos los personajes
- `npm run download-video` - Descarga el video de inicio de ronda desde Google Drive (opcional)

## 🌐 Despliegue

### Opciones de Despliegue

1. **Heroku**
   - Agregar `Procfile` con: `web: node server.js`
   - Configurar variables de entorno en el dashboard

2. **Railway**
   - Conectar repositorio
   - Configurar variables de entorno

3. **Vercel/Netlify**
   - Requiere configuración especial para WebSockets
   - Considerar usar un servicio separado para Socket.IO

4. **VPS (DigitalOcean, AWS, etc.)**
   - Instalar Node.js
   - Usar PM2 para gestión de procesos
   - Configurar Nginx como reverse proxy

## 📝 Notas de Desarrollo

- Las sesiones se almacenan en memoria del servidor (en producción usar Redis o DB)
- Las imágenes se generan una vez y se almacenan localmente
- El sistema usa WebSockets para sincronización en tiempo real
- Soporta múltiples jugadores en diferentes dispositivos simultáneamente

## 🎨 Personalización

Puedes modificar:
- Número de personajes en `characters.js`
- Categorías de preguntas en `characters.js` (objeto `QUESTION_CATEGORIES`)
- Estilos en `public/styles.css`
- Lógica del juego en `server.js` y `public/game-client.js`
- Prompts de generación de imágenes en `scripts/generateImages.js`

## 🔐 Seguridad

- No compartas tu `.env` file
- En producción, usa variables de entorno del servidor
- Considera agregar autenticación para sesiones
- Implementa rate limiting para las APIs

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso educativo y personal.

## 🐛 Troubleshooting

### Las imágenes no se cargan
- Verifica que las imágenes se hayan generado en `images/characters/`
- Asegúrate de que el servidor esté sirviendo archivos estáticos desde `/images`
- Revisa la consola del navegador para errores 404

### Error al generar imágenes
- Verifica que tu API key de OpenAI sea válida
- Asegúrate de tener créditos en tu cuenta de OpenAI
- Revisa los rate limits de la API

### Problemas de conexión WebSocket
- Verifica que el puerto esté disponible
- En producción, asegúrate de que WebSockets estén habilitados
- Revisa la configuración de CORS si es necesario

---

¡Disfruta descubriendo quién escondió los shorts! 🩳
