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
   - `SMTP_USER`: tu email de Gmail
   - `SMTP_PASS`: tu contraseña de aplicación de Google (ver abajo cómo generarla)
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_PORT`: `587`
   - `SMTP_FROM`: `Elo Ranking ITMAB <tu-email@gmail.com>`
   - `APP_URL`: la URL de tu frontend en Vercel (ej: `https://elo-ranking-itmab.vercel.app`)
6. Click en **Apply** y esperá a que despliegue
7. Copiá la URL del servicio (ej: `https://elo-ranking-api-xxx.onrender.com`)

> **Nota**: Sin SMTP configurado, los emails de confirmación se muestran solo en los logs del servidor.

## Configuración de Gmail (para emails)

1. Iniciá sesión en tu cuenta de Gmail
2. Andá a [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Si no tenés habilitada la verificación en dos pasos, activala primero
4. Creá una **Contraseña de aplicación**:
   - Nombre: `Elo Ranking ITMAB`
   - Copiá la contraseña de 16 caracteres que te da Google
5. En Render, andá a tu servicio web → **Environment**
6. Agregá las variables:
   - `SMTP_USER` = tu email de Gmail
   - `SMTP_PASS` = la contraseña de aplicación (16 caracteres)
   - `SMTP_HOST` = `smtp.gmail.com`
   - `SMTP_PORT` = `587`
   - `SMTP_FROM` = `Elo Ranking ITMAB <tu-email@gmail.com>`
7. El servicio se redeploya automáticamente

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

- **Admin**: usuario `agustinbarbesino@gmail.com`, contraseña `67Sist2187`
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
| `SMTP_USER` | Tu email de Gmail |
| `SMTP_PASS` | Contraseña de aplicación de Google (16 caracteres) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_FROM` | Remitente de emails |
| `APP_URL` | URL del frontend en Vercel |

### Frontend (Vercel)
| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL del backend + `/api` |
