# Deployment Instructions

## Frontend (GitHub Pages)

El frontend se despliega automáticamente en GitHub Pages cuando haces push a `main`.

URL: https://b10sp4rt4n.github.io/Camara/

## Backend (Vercel)

### Opción 1: Deploy desde Vercel Dashboard

1. Ve a [vercel.com](https://vercel.com)
2. Importa este repositorio
3. Selecciona la carpeta `server/` como root directory
4. Agrega las variables de entorno:
   - `OPENAI_API_KEY`: Tu API key de OpenAI
   - `NODE_ENV`: production
5. Deploy

### Opción 2: Deploy con Vercel CLI

```bash
cd server
npm install -g vercel
vercel login
vercel --prod
```

Cuando te pregunte por variables de entorno, agrega:
- `OPENAI_API_KEY`
- `NODE_ENV=production`

### Actualizar la URL del backend

Una vez desplegado el backend en Vercel, obtendrás una URL como:
`https://tu-proyecto-xyz.vercel.app`

Actualiza el archivo `.env.production`:
```
VITE_API_URL=https://tu-proyecto-xyz.vercel.app
```

Luego haz commit y push para que el frontend use la nueva URL.

## Verificación

1. El frontend estará en: https://b10sp4rt4n.github.io/Camara/
2. El backend estará en: https://tu-proyecto-xyz.vercel.app
3. Prueba subiendo una foto del INE

## Variables de Entorno

### Backend (.env en Vercel)
- `OPENAI_API_KEY`: Tu OpenAI API key
- `NODE_ENV`: production
- `PORT`: 3001 (opcional, Vercel lo maneja automáticamente)

### Frontend (.env.production)
- `VITE_API_URL`: URL de tu backend en Vercel
