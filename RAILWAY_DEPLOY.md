# 🚀 Guía de Deployment en Railway

## Paso 1: Preparar el Repositorio en GitHub

1. **Si aún no tienes un repositorio en GitHub:**
   ```bash
   cd /Users/sergiolombana/Documents/mobile-game
   git init
   git add .
   git commit -m "Initial commit - Mobile game ready for deployment"
   ```

2. **Crear repositorio en GitHub:**
   - Ve a https://github.com/new
   - Crea un nuevo repositorio (puede ser privado o público)
   - **NO** inicialices con README, .gitignore o licencia

3. **Conectar y subir:**
   ```bash
   git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
   git branch -M main
   git push -u origin main
   ```
   (Reemplaza `TU_USUARIO` y `TU_REPO` con tus datos)

## Paso 2: Configurar Railway

1. **Iniciar sesión en Railway:**
   - Ve a https://railway.app
   - Inicia sesión con tu cuenta

2. **Crear nuevo proyecto:**
   - Click en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Autoriza Railway a acceder a tu GitHub si es necesario
   - Selecciona tu repositorio `mobile-game`

3. **Railway detectará automáticamente:**
   - Node.js
   - El comando de inicio desde `package.json` (`npm start`)
   - Comenzará el deploy automáticamente

## Paso 3: Configurar Variables de Entorno

1. **En el dashboard de Railway:**
   - Ve a tu proyecto
   - Click en "Variables" (o "Environment Variables")

2. **Agregar las siguientes variables:**
   ```
   OPENAI_API_KEY=tu_clave_de_openai_aqui
   NODE_ENV=production
   ```
   
   ⚠️ **IMPORTANTE:** Reemplaza `tu_clave_de_openai_aqui` con tu clave real de OpenAI (empieza con `sk-proj-...`)

3. **Railway configurará automáticamente:**
   - `PORT` - Railway lo asigna automáticamente

## Paso 4: Verificar el Deploy

1. **Esperar a que termine el build:**
   - Railway mostrará el progreso en el dashboard
   - Puede tardar 2-5 minutos la primera vez

2. **Verificar logs:**
   - Click en "Deployments"
   - Click en el deployment más reciente
   - Revisa los logs para asegurarte de que no hay errores

3. **Obtener la URL:**
   - Railway te dará una URL automática: `tu-app.railway.app`
   - Puedes verla en el dashboard, sección "Settings" → "Domains"

## Paso 5: Probar la Aplicación

1. **Abrir la URL en tu navegador:**
   - Deberías ver la pantalla de inicio del juego

2. **Probar funcionalidades:**
   - Crear una sesión
   - Generar un personaje
   - Verificar que las imágenes se generan correctamente

## Paso 6: Configurar Dominio Personalizado (Opcional)

1. **En Railway:**
   - Ve a "Settings" → "Domains"
   - Click en "Custom Domain"
   - Ingresa tu dominio
   - Sigue las instrucciones para configurar DNS

## ⚠️ Notas Importantes

### Almacenamiento de Imágenes

Las imágenes generadas se guardan en `images/rounds/{sessionId}/`. En Railway:
- ✅ Se guardan en el sistema de archivos del servidor
- ⚠️ Se perderán si el servidor se reinicia (Railway puede hacer esto)
- 💡 **Recomendación:** Para producción, considera usar Cloudinary o S3 para almacenar imágenes

### Límites de Railway

- **Tier gratuito:** $5 créditos al mes
- **Uso estimado:** ~100 horas de servidor al mes
- Si excedes, Railway te notificará

### Monitoreo

- Railway te enviará emails si hay problemas
- Puedes ver métricas en el dashboard
- Los logs están disponibles en tiempo real

## 🔧 Solución de Problemas

### Error: "Cannot find module"
- Verifica que `package.json` tenga todas las dependencias
- Railway ejecuta `npm install` automáticamente

### Error: "Port already in use"
- Railway asigna el puerto automáticamente
- Asegúrate de usar `process.env.PORT` en `server.js` ✅ (ya está configurado)

### Las imágenes no se guardan
- Verifica que el directorio `images/` exista
- Railway crea directorios automáticamente si no existen
- Revisa los logs para ver errores de permisos

### WebSockets no funcionan
- Railway soporta WebSockets nativamente
- Si hay problemas, verifica que Socket.IO esté configurado correctamente ✅ (ya está configurado)

## 📝 Checklist Final

- [ ] Repositorio en GitHub creado y código subido
- [ ] Proyecto creado en Railway
- [ ] Repositorio conectado a Railway
- [ ] Variables de entorno configuradas (`OPENAI_API_KEY`, `NODE_ENV`)
- [ ] Deploy completado exitosamente
- [ ] URL de Railway funcionando
- [ ] Aplicación probada (crear sesión, generar personaje)

## 🎉 ¡Listo!

Tu juego debería estar funcionando en Railway. Comparte la URL con tus amigos para que puedan jugar.

**URL de ejemplo:** `https://tu-app.railway.app`

---

## 💡 Próximos Pasos (Opcional)

1. **Almacenamiento persistente de imágenes:**
   - Integrar Cloudinary o AWS S3
   - Modificar `server.js` para subir imágenes a estos servicios

2. **Base de datos:**
   - Si quieres guardar sesiones permanentemente
   - Railway ofrece PostgreSQL como addon

3. **Monitoreo:**
   - Configurar alertas en Railway
   - Agregar logging más detallado

