# Railway Environment Variables Troubleshooting Guide

## Problema: OPENAI_API_KEY no se está aplicando en Railway

### Diagnóstico Agregado

El código ahora incluye diagnóstico completo que mostrará en los logs:
- Todas las variables de entorno disponibles
- Variables que contienen "OPENAI" o "NODE"
- Información detallada para debugging

### Posibles Causas y Soluciones

#### 1. Variables no aplicadas (más común)
**Síntoma:** Variables configuradas pero no disponibles en runtime

**Solución:**
- En Railway, después de agregar/modificar variables, **DEBES hacer clic en "Deploy" o "Redeploy"**
- Las variables con fondo morado indican cambios no aplicados
- Ve a "Deployments" → Haz clic en los tres puntos → "Redeploy"

#### 2. Variables en el lugar incorrecto
**Síntoma:** Variables visibles en el dashboard pero no en el servicio

**Solución:**
- Asegúrate de que las variables estén en el **SERVICIO**, no solo en el proyecto
- Haz clic directamente en el servicio (card con el nombre)
- Ve a "Variables" del servicio (no del proyecto)
- Si están en "Shared Variables", muévelas al servicio específico

#### 3. Comillas en el Raw Editor
**Síntoma:** Variable configurada pero valor vacío o con comillas

**Solución:**
- En Railway → Variables → Raw Editor
- Asegúrate de que sea así (SIN comillas):
  ```
  OPENAI_API_KEY=sk-proj-tu-clave-aqui
  NODE_ENV=production
  ```
- NO así (CON comillas):
  ```
  OPENAI_API_KEY="sk-proj-tu-clave-aqui"
  ```

#### 4. Nombre de variable incorrecto
**Síntoma:** Variable con nombre similar pero no exacto

**Solución:**
- El nombre debe ser exactamente: `OPENAI_API_KEY` (case-sensitive)
- No `openai_api_key`, no `OPENAIKEY`, no `OpenAI_Api_Key`
- Verifica que no haya espacios antes o después del nombre

#### 5. Variable vacía o con espacios
**Síntoma:** Variable existe pero está vacía o tiene espacios

**Solución:**
- Verifica que el valor no tenga espacios al inicio o final
- Verifica que el valor sea la clave completa
- Elimina y recrea la variable si es necesario

#### 6. Timing - Variables no disponibles al inicio
**Síntoma:** Servidor falla antes de que Railway cargue las variables

**Solución:**
- El código ahora intenta múltiples variaciones del nombre
- Railway debería cargar las variables antes de ejecutar el código
- Si persiste, verifica los logs para ver qué variables están disponibles

### Pasos de Verificación

1. **Verificar en Railway:**
   - Servicio → Variables → Ver que `OPENAI_API_KEY` existe
   - Raw Editor → Verificar formato (sin comillas)
   - Hacer clic en "Deploy" o "Redeploy"

2. **Verificar en Logs:**
   - Después del deploy, revisa los logs
   - Deberías ver la sección "=== Environment Variables Diagnostic ==="
   - Verifica que `OPENAI_API_KEY` aparezca en la lista

3. **Verificar el Código:**
   - El código ahora intenta múltiples nombres de variable
   - Limpia comillas y espacios automáticamente
   - Muestra información detallada de diagnóstico

### Comandos Útiles (Railway CLI)

Si tienes Railway CLI instalado:

```bash
# Ver variables del servicio
railway variables

# Establecer variable
railway variables set OPENAI_API_KEY=tu-clave-aqui

# Ver logs
railway logs
```

### Referencias

- [Railway Variables Documentation](https://docs.railway.com/guides/variables)
- [Railway Troubleshooting](https://docs.railway.com/troubleshooting)

### Próximos Pasos

1. Revisa los logs después del próximo deploy
2. Busca la sección de diagnóstico
3. Compara las variables disponibles con lo que esperas
4. Si `OPENAI_API_KEY` no aparece, sigue los pasos de solución arriba


