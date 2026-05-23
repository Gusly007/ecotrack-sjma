# EcoTrack - QR Code & PWA Documentation

## Vue d'ensemble

EcoTrack utilise un générateur de QR codes (**HTML statique**) et une PWA (**Progressive Web App**) pour permettre le scan des conteneurs.

---

## 1. Générateur QR Code (Public - Pas besoin de connexion)

**Fichier:** `frontend/public/qr-generator.html`

Ce générateur fonctionne **sans backend** - il utilise la bibliothèque `qrcodejs` via CDN.

### Test en développement:
```
http://localhost:5173/qr-generator.html
```

### Utilisation:
1. Entrez l'UID du conteneur (ex: `CNT-00001`)
2. Cliquez "Générer"
3. Le QR code contient **uniquement l'UID** (pas d'URL complète)

### Après déploiement (Netlify, Vercel, etc.):
```
https://votre-site.netlify.app/qr-generator.html
```

---

## 2. Scan de conteneurs (Nécessite connexion)

**Pages React:**
- **Agents:** `/agent/scan` → `/agent/scan/result/:uid`
- **Autres rôles:** `/scan` → `/scan/result/:uid`

### Test en développement:
```
http://localhost:5173/agent/scan
```

⚠️ **Nécessite que le backend (`service-containers`) soit lancé sur `localhost:3000`**

---

## 3. PWA (Progressive Web App)

La PWA permet d'installer l'application sur mobile/desktop.

### Fonctionnalités:
- ✅ Fonctionne hors-ligne (service worker)
- ✅ Installation sur écran d'accueil (Android/iOS)
- ✅ Mise à jour automatique

### Test en développement (PC):
1. Ouvrez `http://localhost:5173/qr-generator.html`
2. Chrome → F12 → **Application** → **Service Workers**
3. Vérifiez que le SW est enregistré

### Test après déploiement (Mobile - Android):
1. Ouvrez l'URL déployée (HTTPS requis)
2. Menu Chrome (3 points) → **"Ajouter à l'écran d'accueil"**
3. L'app s'ouvre en mode **standalone** (sans barre de navigation)

### Test après déploiement (iOS):
1. Ouvrez l'URL dans Safari
2. Bouton **Partager** → **"Sur l'écran d'accueil"**

---

## 4. Structure des fichiers

```
frontend/
├── public/
│   ├── qr-generator.html      # Générateur QR (statique, public)
│   ├── icon-192x192.png     # Icône PWA
│   ├── icon-512x512.png     # Icône PWA
│   ├── manifest.webmanifest  # Généré par vite-plugin-pwa
│   └── sw.js                 # Service Worker (généré)
├── src/
│   ├── pages/
│   │   ├── mobile/
│   │   │   ├── agent/ScanPage.jsx      # Scan agents
│   │   │   └── shared/ScanPage.jsx    # Scan autres rôles
│   │   └── QRCodePage.jsx            # (Supprimé - utilise HTML)
│   └── components/
│       └── QRScanner.jsx             # Composant scan QR
├── dist/                         # Dossier généré après build
├── vite.config.js              # Config PWA
└── package.json
```

**Note:** `dist/` est généré après `npm run build`.

---

## 5. Variables d'environnement

Créez `.env.production` après déploiement du backend:

```bash
# .env.production
VITE_API_URL=https://votre-backend.railway.app
```

---

## 6. Déploiement

### Frontend (Netlify Drop - 2 min):
1. Build: `cd frontend && npm run build`
2. Upload dossier `dist/` sur https://app.netlify.com/drop
3. Récupérez l'URL HTTPS (ex: `https://admirable-gumption-6bf4a3.netlify.app`)

### Backend (Railway - 5 min):
1. Push code sur GitHub
2. Connectez repo à https://railway.app
3. Ajoutez variables d'environnement (DB, JWT_SECRET, etc.)

---

## 7. Notes importantes

-  **QR codes**: Contiennent uniquement l'UID (ex: `CNT-00001`), pas d'URL
- **PWA**: Nécessite HTTPS (sauf localhost)
-  **Scan**: Nécessite connexion au backend pour récupérer infos conteneur
-  **QR Generator**: Fonctionne sans backend, hors-ligne après cache PWA

---

## 8. Dépannage

### PWA ne s'installe pas:
- Vérifiez HTTPS (obligatoire sur mobile)
- Vérifiez icônes `icon-*.png` dans `public/`
- Chrome → F12 → Application → Manifest (vérifiez qu'il est valide)

### Scan ne fonctionne pas:
- Vérifiez connexion backend (`localhost:3000` en dev)
- Vérifiez que le backend est déployé (production)
- Vérifiez variable `VITE_API_URL` en production

### QR Generator ne charge pas:
- Vérifiez que `qrcode.min.js` est accessible via CDN
- Ouvrez console (F12) pour voir erreurs JavaScript

### Fichiers PWA manquants:
- `manifest.webmanifest` est généré automatiquement dans `dist/` après build
- Pour dev: vérifiez que `vite-plugin-pwa` est installé
