# Configuration Render.com pour FlowAI Backend

## Configuration du Service

### Paramètres de Base
- **Name**: flowai-backend (ou votre nom)
- **Environment**: Node
- **Region**: Choisissez la région la plus proche
- **Branch**: main (ou votre branche)

### Build & Deploy

**Root Directory**: `backend`

**Build Command**: (laisser vide ou `npm install`)

**Start Command**: `npm start`

### Variables d'Environnement Requises

Ajoutez toutes ces variables dans la section "Environment" :

```
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://votre-frontend.vercel.app

SUPABASE_URL=votre_url_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
SUPABASE_ANON_KEY=votre_anon_key

OPENROUTER_API_KEY=votre_cle_openrouter

REDIS_URL=votre_url_redis

JWT_SECRET=votre_secret_jwt_aleatoire
```

### Important

1. **Root Directory**: Assurez-vous que "Root Directory" est défini à `backend` dans les paramètres du service Render
2. Si vous n'avez pas de Root Directory configuré, le chemin dans package.json devrait être `backend/src/app.js` au lieu de `src/app.js`

### Alternative si Root Directory n'est pas configuré

Si vous ne pouvez pas configurer le Root Directory, changez le script start dans package.json à :
```json
"start": "node backend/src/app.js"
```

Mais la meilleure solution est de configurer Root Directory = `backend` dans Render.
