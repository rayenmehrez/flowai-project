# Test des Routes WhatsApp - Backend

## ✅ Routes Vérifiées et Corrigées

### 1. POST /api/whatsapp/generate-qr/:agentId
**Status:** ✅ Corrigé

**Fonctionnalité:**
- Génère un QR code pour connecter WhatsApp
- Vérifie la propriété de l'agent
- Initialise le client WhatsApp
- Retourne le QR code en base64

**Réponse:**
```json
{
  "success": true,
  "agentId": "uuid",
  "status": "connecting" | "connected",
  "connected": false | true,
  "qrCode": "data:image/png;base64,..." | null,
  "phoneNumber": "+1234567890" | null
}
```

**Test:**
```bash
curl -X POST http://localhost:3001/api/whatsapp/generate-qr/AGENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. GET /api/whatsapp/connection-status/:agentId
**Status:** ✅ Corrigé

**Fonctionnalité:**
- Vérifie le statut de connexion WhatsApp
- Retourne le statut actuel, le numéro de téléphone, et le QR code si disponible
- Utilisé pour le polling depuis le frontend

**Réponse:**
```json
{
  "success": true,
  "connected": true | false,
  "status": "connected" | "connecting" | "not_connected" | "qr_ready",
  "phoneNumber": "+1234567890" | null,
  "qrCode": "data:image/png;base64,..." | null
}
```

**Test:**
```bash
curl http://localhost:3001/api/whatsapp/connection-status/AGENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. POST /api/whatsapp/disconnect/:agentId
**Status:** ✅ Corrigé

**Fonctionnalité:**
- Déconnecte le client WhatsApp
- Nettoie les ressources
- Met à jour la base de données

**Réponse:**
```json
{
  "success": true,
  "message": "Disconnected successfully"
}
```

**Test:**
```bash
curl -X POST http://localhost:3001/api/whatsapp/disconnect/AGENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. GET /api/whatsapp/qr-status/:agentId
**Status:** ✅ Existe (optionnel)

**Fonctionnalité:**
- Retourne uniquement le statut du QR code
- Utile pour vérifier si un QR code est disponible

**Réponse:**
```json
{
  "success": true,
  "agentId": "uuid",
  "hasQR": true | false,
  "qrCode": "data:image/png;base64,..." | null,
  "status": "qr_ready" | "connecting" | "not_connected"
}
```

## 🔧 Fichiers Vérifiés

### Routes
- ✅ `backend/src/routes/whatsapp.routes.js` - Routes montées correctement
- ✅ Routes montées dans `server.js` à `/api/whatsapp`

### Contrôleurs
- ✅ `backend/src/controllers/whatsapp.controller.js` - Toutes les fonctions existent
- ✅ Authentification appliquée via middleware
- ✅ Vérification de propriété de l'agent
- ✅ Format de réponse cohérent

### Services
- ✅ `backend/src/services/whatsapp.service.js` - Service complet
- ✅ `initializeClient()` - Initialise le client et génère QR
- ✅ `getConnectionStatus()` - Retourne le statut de connexion
- ✅ `disconnectClient()` - Déconnecte le client
- ✅ `getQRStatus()` - Retourne le statut du QR code

### Middleware
- ✅ `backend/src/middleware/auth.js` - Authentification fonctionnelle
- ✅ Vérifie le token JWT Supabase
- ✅ Attache l'utilisateur à `req.user`

## 📋 Flux de Connexion WhatsApp

1. **Frontend appelle:** `POST /api/whatsapp/generate-qr/:agentId`
   - Backend initialise le client WhatsApp
   - Client génère un QR code
   - QR code est stocké en mémoire et en base de données
   - Retourne le QR code au frontend

2. **Frontend poll:** `GET /api/whatsapp/connection-status/:agentId` (toutes les 2 secondes)
   - Backend vérifie le statut de connexion
   - Retourne le statut actuel
   - Quand `connected: true`, le frontend arrête le polling

3. **Quand connecté:**
   - Le service WhatsApp met à jour la base de données
   - Le statut passe à `connected`
   - Le numéro de téléphone est enregistré
   - Le QR code est supprimé

4. **Déconnexion:** `POST /api/whatsapp/disconnect/:agentId`
   - Backend détruit le client
   - Nettoie les ressources
   - Met à jour la base de données

## 🐛 Problèmes Potentiels et Solutions

### Problème 1: QR Code ne s'affiche pas
**Cause:** Le QR code n'est pas généré assez rapidement
**Solution:** Le service attend 3 secondes après l'initialisation pour générer le QR code

### Problème 2: Statut ne se met pas à jour
**Cause:** Les événements WhatsApp ne sont pas capturés
**Solution:** Vérifier que les event handlers sont bien configurés dans `setupEventHandlers()`

### Problème 3: Erreur "Agent not found"
**Cause:** L'agent n'existe pas ou l'utilisateur n'a pas accès
**Solution:** Vérifier que l'agent existe et appartient à l'utilisateur

### Problème 4: CORS Error
**Cause:** CORS n'est pas configuré correctement
**Solution:** Vérifier la configuration CORS dans `server.js`

## ✅ Checklist de Test

- [ ] Démarrer le backend: `npm start` dans `backend/`
- [ ] Obtenir un token d'authentification (via login)
- [ ] Créer un agent (via POST /api/agents)
- [ ] Générer un QR code (POST /api/whatsapp/generate-qr/:id)
- [ ] Vérifier le statut (GET /api/whatsapp/connection-status/:id)
- [ ] Scanner le QR code avec WhatsApp
- [ ] Vérifier que le statut passe à "connected"
- [ ] Déconnecter (POST /api/whatsapp/disconnect/:id)

## 📝 Notes Importantes

1. **Base de données:** Le service met à jour les champs `whatsapp_qr_code`, `whatsapp_connected`, `whatsapp_phone_number` dans la table `agents`

2. **Sessions:** Les sessions WhatsApp sont stockées dans `.wwa-sessions/` (configurable via `SESSION_DIR`)

3. **Puppeteer:** Le service utilise Puppeteer pour contrôler WhatsApp Web. Sur Render.com, utilisez `PUPPETEER_EXECUTABLE_PATH`

4. **Logs:** Tous les événements sont loggés via `logger` pour faciliter le débogage

5. **Polling:** Le frontend doit poller toutes les 2 secondes et s'arrêter après 3 minutes maximum
