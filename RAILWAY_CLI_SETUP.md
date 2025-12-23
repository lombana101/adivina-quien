# Railway CLI - Configurar Variables de Entorno

## Instalación de Railway CLI

### macOS/Linux:
```bash
curl -fsSL https://railway.app/install.sh | sh
```

### O usando npm:
```bash
npm install -g @railway/cli
```

### O usando Homebrew (macOS):
```bash
brew install railway
```

## Configurar la Variable de Entorno

### Paso 1: Login
```bash
railway login
```
Esto abrirá tu navegador para autenticarte.

### Paso 2: Conectar al Proyecto
```bash
cd /Users/sergiolombana/Documents/mobile-game
railway link
```
Selecciona tu proyecto `adivina-quien` cuando te lo pida.

### Paso 3: Establecer la Variable
```bash
railway variables set OPENAI_API_KEY=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
```

**Nota:** Reemplaza la clave con tu clave real de OpenAI.

### Paso 4: Verificar
```bash
railway variables
```
Esto mostrará todas las variables configuradas.

### Paso 5: Redeploy
Después de configurar la variable, Railway debería hacer redeploy automáticamente, pero si no:
```bash
railway up
```

## Comandos Útiles

### Ver todas las variables:
```bash
railway variables
```

### Ver una variable específica:
```bash
railway variables get OPENAI_API_KEY
```

### Eliminar una variable:
```bash
railway variables unset OPENAI_API_KEY
```

### Ver logs:
```bash
railway logs
```

### Ver estado del servicio:
```bash
railway status
```

## Solución de Problemas

Si `railway` no se encuentra después de instalar:
- Cierra y abre una nueva terminal
- O ejecuta: `source ~/.bashrc` o `source ~/.zshrc`

Si el comando `railway link` no encuentra el proyecto:
- Asegúrate de estar en el directorio correcto
- O especifica el proyecto: `railway link --project adivina-quien`

