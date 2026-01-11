# Configuration CORS pour FlowAI

## Problème résolu

Le backend a été configuré pour accepter les requêtes depuis plusieurs origines, notamment :
- `http://localhost:3000` (développement local)
- `http://localhost:8000` (serveur local alternatif)
- `https://v0-flowai-website-design.vercel.app` (Vercel)
- Toute URL définie dans `FRONTEND_URL`

## Configuration sur Render.com

Dans les variables d'environnement de votre service Render, ajoutez :

```
FRONTEND_URL=https://v0-flowai-website-design.vercel.app
NODE_ENV=production
```

## Pour autoriser toutes les origines (développement uniquement)

Si vous voulez temporairement autoriser toutes les origines (non recommandé en production), ajoutez :

```
ALLOW_ALL_ORIGINS=true
```

⚠️ **Attention** : Ne faites cela qu'en développement. En production, spécifiez explicitement les origines autorisées.

## Vérification

Pour vérifier que CORS fonctionne :

1. Ouvrez la console du navigateur
2. Vérifiez qu'il n'y a plus d'erreurs CORS
3. Les requêtes vers `/api/auth/register` et `/api/auth/login` devraient fonctionner

## Dépannage

Si vous avez encore des erreurs CORS :

1. Vérifiez que `FRONTEND_URL` est correctement configuré sur Render
2. Vérifiez que l'URL dans `app.js` du frontend correspond à votre backend Render
3. Redéployez le backend après avoir modifié les variables d'environnement
4. Vérifiez les logs Render pour voir les erreurs CORS détaillées
