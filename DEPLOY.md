# Elo Ranking ITMAB - Guía de Despliegue

## Arquitectura

- **Frontend**: React + Vite → despliegue en **Vercel**
- **Backend**: Node.js + Express + PostgreSQL → despliegue en **Render**
- **Base de datos**: PostgreSQL (Render Free Tier)

## Paso 1: Push al repositorio

```bash
cd ~/EloRankingITMAB
rm -rf server/node_modules server/elo-ranking.db node_modules dist

git init
git remote add origin https://github.com/agustinBarbesino/EloRankingITMAB.git
git add -A
git commit -m "feat: app completa con PostgreSQL y preparación para despliegue"
git push -u origin main --force
```

## Paso 2: Desplegar Backend en Render

1. Entrá a [https://render.com](https://render.com) e iniciá sesión con GitHub
2. Click en **New +** → **Blueprint**
3. Seleccioná el repositorio `EloRankingITMAB`
4. Render leerá el archivo `render.yaml` y creará automáticamente:
   - Un servicio web para el backend
   - Una base de datos PostgreSQL
5. En las variables de entorno del servicio web, configurá:
   - `SMTP_HOST`: tu servidor SMTP (ej: `smtp.gmail.com`)
   - `SMTP_PORT`: puerto SMTP (ej: `587`)
   - `SMTP_USER`: tu email
   - `SMTP_PASS`: tu contraseña de app
   - `SMTP_FROM`: `Elo Ranking ITMAB <noreply@itmab.edu.ar>`
6. Click en **Apply** y esperá a que despliegue
7. Copiá la URL del servicio (ej: `https://elo-ranking-api-xxx.onrender.com`)

> **Nota**: Sin SMTP configurado, los emails de confirmación se muestran solo en los logs del servidor.

## Paso 3: Desplegar Frontend en Vercel

1. Entrá a [https://vercel.com](https://vercel.com) e iniciá sesión con GitHub
2. Click en **Add New...** → **Project**
3. Importá el repositorio `EloRankingITMAB`
4. Configuración del build:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. En **Environment Variables**, agregá:
   - `VITE_API_URL`: la URL de tu backend en Render + `/api`
     - Ejemplo: `https://elo-ranking-api-xxx.onrender.com/api`
6. Click en **Deploy**

## Paso 4: Actualizar CORS en Render

1. Volvé a Render → tu servicio web → **Environment**
2. Actualizá `CORS_ORIGIN` con la URL de tu frontend en Vercel:
   - Ejemplo: `https://elo-ranking-itmab.vercel.app`
3. Redeploy (se hace automáticamente al guardar)

## Credenciales

- **Admin**: usuario `Administrador`, contraseña `itmab2026`
- Los estudiantes se registran desde el login con email y contraseña

## Estructura del proyecto

```
EloRankingITMAB/
├── src/                    # Frontend React
│   ├── components/
│   ├── pages/
│   ├── context/
│   └── services/api.js     # Comunicación con el backend
├── server/                 # Backend Express
│   ├── routes/             # Rutas API
│   ├── middleware/         # Auth middleware
│   ├── utils/              # Elo calculator + email service
│   ├── database.js         # Conexión PostgreSQL
│   └── index.js            # Entry point
├── render.yaml             # Configuración de despliegue Render
├── vite.config.js          # Configuración Vite
└── package.json
```

## Variables de entorno

### Backend (Render)
| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de PostgreSQL (auto-configurada por Render) |
| `CORS_ORIGIN` | URL del frontend en Vercel |
| `SMTP_HOST` | Servidor SMTP |
| `SMTP_PORT` | Puerto SMTP (587) |
| `SMTP_USER` | Usuario SMTP |
| `SMTP_PASS` | Contraseña SMTP |
| `SMTP_FROM` | Remitente de emails |

### Frontend (Vercel)
| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL del backend + `/api` |
