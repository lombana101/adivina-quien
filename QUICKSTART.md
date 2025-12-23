# Guía Rápida de Inicio

## Pasos Rápidos

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar API Key de OpenAI:**
   - Crea un archivo `.env` en la raíz del proyecto
   - Agrega: `OPENAI_API_KEY=tu_api_key_aqui`
   - Obtén tu API key en: https://platform.openai.com/api-keys

3. **Generar imágenes (Opcional):**
   ```bash
   npm run generate-images
   ```
   ⚠️ Esto puede tardar 5-10 minutos y consume créditos de OpenAI (~$0.04 por imagen)

4. **Iniciar servidor:**
   ```bash
   npm start
   ```

5. **Abrir en navegador:**
   - Ve a: http://localhost:3000
   - El maestro crea una sesión
   - Otros jugadores se unen con el ID de 4 dígitos

## Notas Importantes

- **Sin imágenes:** Si no generas las imágenes, el juego usará emojis como fallback
- **Multi-dispositivo:** Ahora funciona en diferentes dispositivos gracias al backend
- **WebSockets:** Requiere que el servidor esté corriendo para la sincronización en tiempo real

## Estructura de Archivos

- `public/` - Frontend (HTML, CSS, JS)
- `server.js` - Backend con Express y Socket.IO
- `scripts/generateImages.js` - Generador de imágenes AI
- `images/characters/` - Imágenes generadas (se crean automáticamente)

## Troubleshooting

**Error: "OPENAI_API_KEY not found"**
- Asegúrate de crear el archivo `.env` con tu API key

**Las imágenes no se cargan**
- Verifica que las imágenes estén en `images/characters/`
- Revisa la consola del navegador para errores 404

**Error de conexión WebSocket**
- Asegúrate de que el servidor esté corriendo
- Verifica que el puerto 3000 esté disponible

