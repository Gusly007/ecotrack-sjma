# 📋 Journal de Déploiement — EcoTrack Frontend sur GitHub Pages

> **Date :** 24 mai 2026  
> **Dépôt :** `Gusly007/ecotrack-sjma`  
> **URL déployée :** https://gusly007.github.io/ecotrack-sjma/  
> **Branche source :** `main`  
> **Répertoire frontend :** `ecotrack-sjma/ecotrack-sjma/frontend/`

---

## 🎯 Objectif

Déployer le frontend React/Vite du projet EcoTrack sur GitHub Pages depuis le chemin `ecotrack-sjma/ecotrack-sjma/frontend`.

---

## 📝 Étapes détaillées

### Étape 1 — Changement de la source GitHub Pages

**Fichier modifié :** Paramètres GitHub → Settings → Pages  
**Commit :** *(action via interface web)*

La source de GitHub Pages était configurée sur **"Deploy from a branch"** (branche `CD/deployment-frontend-vers-GitHub-Pages`). Elle a été changée vers **"GitHub Actions"** pour permettre un pipeline de build personnalisé.

- Navigation vers `Settings > Pages`
- Clic sur le menu déroulant "Source"
- Sélection de **"GitHub Actions"**
- Sauvegarde automatique confirmée par le message *"GitHub Pages source saved."*

---

### Étape 2 — Création du workflow GitHub Actions de déploiement

**Fichier créé :** `.github/workflows/deploy-frontend.yml`  
**Commit :** `f488f4a` — *"Add GitHub Actions workflow for frontend deployment"*

Création du fichier de workflow pour builder et déployer automatiquement le frontend.

```yaml
name: Deploy Frontend to GitHub Pages

on:
  push:
    branches:
      - main
    paths:
      - 'ecotrack-sjma/frontend/**'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    name: Build Frontend
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: ecotrack-sjma/frontend/package-lock.json
      - name: Install dependencies
        working-directory: ecotrack-sjma/frontend
        run: npm install
      - name: Build
        working-directory: ecotrack-sjma/frontend
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ecotrack-sjma/frontend/dist

  deploy:
    name: Deploy to GitHub Pages
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Déclencheurs configurés :**
- Push sur `main` avec des changements dans `ecotrack-sjma/frontend/**`
- Déclenchement manuel via `workflow_dispatch`

---

### Étape 3 — Correction : npm ci → npm install + Node.js 20 → 22

**Fichier modifié :** `.github/workflows/deploy-frontend.yml`  
**Commit :** `0a27047` — *"Update Node.js version and change npm command"*

**Problème rencontré :** Le premier run (#1) a échoué avec l'erreur :
```
npm error `npm ci` can only install packages when your package.json and
package-lock.json are in sync.
```

**Cause :** Le `package-lock.json` n'était pas synchronisé avec le `package.json`. De plus, certains packages exigeaient Node.js `>=22.19.0`.

**Corrections apportées :**
- `npm ci` → `npm install` (plus tolérant aux désynchronisations du lockfile)
- Node.js `20` → `22`

---

### Étape 4 — Correction : Fichier manquant `NotificationContext.jsx`

**Fichier créé :** `ecotrack-sjma/frontend/src/context/NotificationContext.jsx`  
**Commit :** `29132ae` — *"Add NotificationContext for managing notifications"*

**Problème rencontré :** Le run #2 a échoué lors du build Vite avec :
```
Could not resolve "./context/NotificationContext" from "src/App.jsx"
```

**Cause :** `App.jsx` importait `NotificationProvider` depuis `./context/NotificationContext`, mais ce fichier était absent du dépôt (seul `AuthContext.jsx` existait dans le dossier `context/`).

**Correction :** Création d'un fichier `NotificationContext.jsx` fonctionnel :

```jsx
import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { ...notification, id }]);
    if (notification.duration !== 0) {
      setTimeout(() => removeNotification(id), notification.duration || 5000);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const notify = useCallback((message, type = 'info', duration = 5000) => {
    addNotification({ message, type, duration });
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, notify }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

export default NotificationContext;
```

---

### Étape 5 — Correction : Fonction `fetchTourneeById` dupliquée

**Fichier modifié :** `ecotrack-sjma/frontend/src/services/tourneeService.js`  
**Commit :** `74cf1af` — *"fix: remove duplicate fetchTourneeById function in tourneeService.js"*

**Problème rencontré :** Le run #3 a échoué avec :
```
src/services/tourneeService.js (269:22): Identifier "fetchTourneeById" has already been declared
```

**Cause :** La fonction `fetchTourneeById` était déclarée deux fois dans le fichier (lignes 99 et 269). La deuxième déclaration (lignes 269–272) était un doublon identique.

**Correction :** Suppression de la deuxième occurrence de `fetchTourneeById` (lignes 269–272, soit 6 lignes supprimées sur 309 → 303 lignes).

✅ **Ce commit a déclenché le run #4 qui s'est terminé avec succès (42s)**

---

### Étape 6 — Correction : Base URL Vite manquante (page blanche)

**Fichier modifié :** `ecotrack-sjma/frontend/vite.config.js`  
**Commit :** `a1b11b4` — *"Set base path for Vite configuration"*

**Problème rencontré :** Le site déployé affichait une **page blanche**. Les requêtes réseau montraient des erreurs 503 :
```
GET https://gusly007.github.io/assets/index-CS0Sk1En.js → 503
GET https://gusly007.github.io/assets/index-8qRLSxBK.css → 503
```

**Cause :** Sans `base` définie dans `vite.config.js`, Vite génère les chemins d'assets relatifs à la racine du domaine (`/assets/...`) au lieu du sous-répertoire (`/ecotrack-sjma/assets/...`).

**Correction :**
```js
// Avant
export default defineConfig({
  plugins: [react()],
  server: { ... }
})

// Après
export default defineConfig({
  base: '/ecotrack-sjma/',  // ← ligne ajoutée
  plugins: [react()],
  server: { ... }
})
```

---

### Étape 7 — Correction : BrowserRouter sans basename (page grise, router cassé)

**Fichier modifié :** `ecotrack-sjma/frontend/src/App.jsx`  
**Commit :** `8bfc2b2` — *"fix: add basename to BrowserRouter for GitHub Pages deployment"*

**Problème rencontré :** Même après le fix de la base URL Vite, la zone principale restait grise. La console affichait :
```
Warning: No routes matched location "/ecotrack-sjma/"
```

**Cause :** Le `BrowserRouter` de React Router DOM ne savait pas que l'application était servie depuis un sous-répertoire `/ecotrack-sjma/`. Sans `basename`, il interprétait `/ecotrack-sjma/` comme une route inconnue.

**Correction :**
```jsx
// Avant (ligne 77 de App.jsx)
<BrowserRouter>

// Après
<BrowserRouter basename="/ecotrack-sjma">
```

✅ **Ce commit a déclenché le run #6 qui s'est terminé avec succès (41s)**  
✅ **Le site s'affiche correctement : page de login EcoTrack visible**

---

## ✅ Résultat Final

| Élément | Statut |
|---|---|
| URL du site | https://gusly007.github.io/ecotrack-sjma/ |
| Page affichée | Page de connexion EcoTrack ✅ |
| Assets JS/CSS | Chargés correctement (200 OK) ✅ |
| React Router | Fonctionnel avec basename ✅ |
| Déploiement auto | À chaque push sur `main` dans `ecotrack-sjma/frontend/**` ✅ |

---

## 📁 Fichiers modifiés / créés

| Fichier | Action | Raison |
|---|---|---|
| `.github/workflows/deploy-frontend.yml` | **Créé** | Workflow CI/CD pour builder et déployer le frontend |
| `ecotrack-sjma/frontend/src/context/NotificationContext.jsx` | **Créé** | Fichier manquant requis par App.jsx |
| `ecotrack-sjma/frontend/src/services/tourneeService.js` | **Modifié** | Suppression de la fonction `fetchTourneeById` dupliquée |
| `ecotrack-sjma/frontend/vite.config.js` | **Modifié** | Ajout de `base: '/ecotrack-sjma/'` |
| `ecotrack-sjma/frontend/src/App.jsx` | **Modifié** | Ajout de `basename="/ecotrack-sjma"` au BrowserRouter |

---

## 🔁 Historique des runs GitHub Actions

| Run | Commit | Résultat | Durée | Cause d'échec |
|---|---|---|---|---|
| #1 | `f488f4a` | ❌ Échec | 18s | `npm ci` désynchronisé + Node 20 trop vieux |
| #2 | `0a27047` | ❌ Échec | 24s | `NotificationContext.jsx` manquant |
| #3 | `29132ae` | ❌ Échec | 27s | `fetchTourneeById` déclaré deux fois |
| #4 | `74cf1af` | ✅ Succès | 42s | — |
| #5 | `a1b11b4` | ✅ Succès | 41s | — |
| #6 | `8bfc2b2` | ✅ Succès | 41s | — |
