# Guía de Deployment - Opciones de Hosting Gratuito/Barato

## 🏆 Mejor Opción: Railway (Recomendado)

**Railway** es la mejor opción porque:
- ✅ **$5 créditos gratis al mes** (suficiente para apps pequeñas)
- ✅ Soporta **WebSockets** (Socket.IO funciona perfectamente)
- ✅ **Deploy automático** desde GitHub
- ✅ **Persistencia de archivos** (las imágenes se guardan)
- ✅ **HTTPS automático**
- ✅ Muy fácil de usar

### Pasos para deploy en Railway:

1. **Crear cuenta en Railway:**
   - Ve a https://railway.app
   - Regístrate con GitHub

2. **Preparar el proyecto:**
   ```bash
   # Asegúrate de tener un repositorio en GitHub
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <tu-repo-url>
   git push -u origin main
   ```

3. **Crear archivo de configuración para Railway:**
   - Railway detecta automáticamente Node.js
   - Asegúrate de que `package.json` tenga el script `start`

4. **Variables de entorno en Railway:**
   - En el dashboard de Railway, ve a Variables
   - Agrega: `OPENAI_API_KEY=tu_key_aqui`
   - Agrega: `PORT` (Railway lo configura automáticamente, pero puedes ponerlo)

5. **Deploy:**
   - Conecta tu repositorio de GitHub
   - Railway detectará automáticamente Node.js
   - El deploy comenzará automáticamente

6. **Configurar dominio:**
   - Railway te da un dominio gratis: `tu-app.railway.app`
   - Puedes agregar un dominio personalizado si quieres

**Costo:** Gratis con $5 créditos/mes (suficiente para ~100 horas de uso)

---

## 🥈 Alternativa 1: Render

**Render** también es buena opción:
- ✅ **Tier gratuito** disponible
- ✅ Soporta WebSockets (con configuración)
- ✅ Deploy desde GitHub
- ⚠️ Puede tener "spinning down" después de inactividad

### Pasos para Render:

1. Crear cuenta en https://render.com
2. Crear nuevo "Web Service"
3. Conectar repositorio de GitHub
4. Configurar:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Agregar variables de entorno
6. Deploy

**Costo:** Gratis (con limitaciones de inactividad)

---

## 🥉 Alternativa 2: Fly.io

**Fly.io** es otra opción sólida:
- ✅ **Tier gratuito** generoso
- ✅ Soporta WebSockets
- ✅ Muy rápido (edge computing)

### Pasos para Fly.io:

1. Instalar Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Crear app: `fly launch`
4. Deploy: `fly deploy`

**Costo:** Gratis con límites generosos

---

## 💡 Opción Híbrida: Frontend + Backend Separados

Si quieres maximizar lo gratis:

### Frontend (Gratis):
- **Vercel** o **Netlify** para el frontend estático
- Deploy automático desde GitHub
- CDN global incluido

### Backend (Gratis):
- **Railway** o **Render** para el backend con WebSockets
- Solo necesitas el servidor Node.js

**Ventajas:**
- Frontend completamente gratis
- Backend en tier gratuito
- Mejor performance (CDN para assets)

**Desventajas:**
- Necesitas configurar CORS correctamente
- Más complejo de mantener

---

## 📦 Almacenamiento de Imágenes

### Opción 1: En el mismo servidor (Recomendado para empezar)
- Las imágenes van en `public/images/characters/`
- Se sirven desde el mismo servidor
- **Railway/Render/Fly.io** permiten esto

### Opción 2: Cloudinary (Gratis hasta 25GB)
- **Tier gratuito:** 25GB almacenamiento, 25GB bandwidth/mes
- Subir imágenes a Cloudinary
- Usar URLs de Cloudinary en el código
- **Ventaja:** CDN global, más rápido

### Opción 3: GitHub como CDN
- Subir imágenes al repositorio
- Usar `raw.githubusercontent.com` URLs
- **Gratis** pero puede ser lento

### Opción 4: Imgur API
- Gratis, sin límites claros
- Subir imágenes y usar URLs

---

## 🚀 Guía Rápida: Deploy en Railway (Recomendado)

### 1. Preparar archivos necesarios:

Crea `railway.json` (opcional, Railway detecta automáticamente):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Asegúrate de que `server.js` use el puerto correcto:

```javascript
const PORT = process.env.PORT || 3000;
```

### 3. En Railway:
- New Project → Deploy from GitHub repo
- Selecciona tu repositorio
- Railway detectará Node.js automáticamente
- Agrega variables de entorno:
  - `OPENAI_API_KEY`
  - `NODE_ENV=production` (opcional)

### 4. Las imágenes:
- Sube las imágenes generadas al repositorio
- O usa un servicio de almacenamiento externo

---

## 💰 Comparación de Costos

| Servicio | Plan Gratis | WebSockets | Almacenamiento | Mejor Para |
|----------|-------------|------------|-----------------|------------|
| **Railway** | $5 créditos/mes | ✅ Sí | ✅ Sí | **Recomendado** |
| **Render** | Tier gratis | ⚠️ Con límites | ✅ Sí | Alternativa |
| **Fly.io** | Tier gratis | ✅ Sí | ✅ Sí | Alternativa |
| **Vercel** | Tier gratis | ❌ No | ❌ No | Solo frontend |
| **Netlify** | Tier gratis | ❌ No | ❌ No | Solo frontend |
| **Heroku** | ❌ No gratis | ✅ Sí | ✅ Sí | Pago ($5/mes) |

---

## 📝 Checklist de Deployment

- [ ] Repositorio en GitHub
- [ ] Variables de entorno configuradas
- [ ] Imágenes subidas al repositorio o servicio externo
- [ ] `package.json` con script `start`
- [ ] Puerto configurado para usar `process.env.PORT`
- [ ] CORS configurado (si frontend y backend separados)
- [ ] Dominio configurado (opcional)

---

## 🎯 Recomendación Final

**Para tu juego, usa Railway:**
1. Es gratis con $5 créditos/mes
2. Soporta WebSockets perfectamente
3. Muy fácil de usar
4. Deploy automático desde GitHub
5. Las imágenes pueden ir en el mismo servidor

**Costo total:** $0/mes (dentro del tier gratuito)

Si necesitas más recursos más adelante, Railway tiene planes desde $5/mes.

---

## 🔗 Enlaces Útiles

- Railway: https://railway.app
- Render: https://render.com
- Fly.io: https://fly.io
- Cloudinary: https://cloudinary.com (para imágenes)
- Vercel: https://vercel.com (solo frontend)


