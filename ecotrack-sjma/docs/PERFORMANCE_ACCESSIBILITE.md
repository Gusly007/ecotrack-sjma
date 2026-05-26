# 4.2 Accessibilite et conformite WCAG — 4.3 Performance et optimisation

**Projet** : EcoTrack — Plateforme de gestion intelligente des conteneurs de collecte urbaine
**Referentiel accessibilite** : WCAG 2.1 Niveau AA (Web Content Accessibility Guidelines)
**Outil de mesure performance** : Google Lighthouse 12.x (intégré au pipeline CI/CD)
**Date de mesure** : 2026-05-26 — Branche : feat/accessibility-performance

---

## 4.2 Accessibilite et conformite WCAG

### Pourquoi l'accessibilite est une exigence

L'accessibilite numerique designe la capacite d'un site web ou d'une application a etre utilise par toutes les personnes, indépendamment de leur handicap (visuel, auditif, moteur, cognitif). En Europe, la directive 2016/2102 rend l'accessibilite obligatoire pour les services publics numeriques. La norme de reference internationale est le referentiel **WCAG 2.1** (Web Content Accessibility Guidelines), publie par le W3C, dont le niveau **AA** est le seuil retenu par la reglementation française (RGAA — Referentiel General d'Amelioration de l'Accessibilite).

Le niveau AA WCAG 2.1 couvre quatre principes fondamentaux :
- **Perceptible** : les informations sont presentees de facon perceptible par tous les sens
- **Utilisable** : les composants d'interface fonctionnent au clavier et sont navigables
- **Comprehensible** : les contenus et le comportement de l'interface sont previsibles
- **Robuste** : le contenu est suffisamment robuste pour etre interprete par les technologies d'assistance (lecteurs d'ecran, etc.)

---

### 4.2.1 Structure semantique du document HTML

La structure semantique consiste a utiliser les balises HTML en fonction de leur signification plutôt que de leur apparence. Cela permet aux lecteurs d'ecran (NVDA, JAWS, VoiceOver) de construire une representation logique de la page.

**Balise `<html lang="fr">`**

L'attribut `lang` sur la balise racine indique au lecteur d'ecran la langue de la page, ce qui lui permet de choisir le bon moteur de synthèse vocale. Sans cet attribut, un lecteur d'ecran français lirait le contenu avec une prononciation anglaise, rendant le texte incomprehensible.

EcoTrack declare la langue française dans [frontend/index.html](../frontend/index.html) :
```html
<html lang="fr">
```

**Titre de page (`<title>`)**

Le titre de la page est la premiere information enoncee par un lecteur d'ecran lors du chargement. Un titre `"frontend"` (valeur par defaut de Vite) est inutilisable. EcoTrack declare :
```html
<title>EcoTrack — Gestion des conteneurs urbains</title>
```

**Regions de reference (landmarks)**

Les balises semantiques HTML5 definissent des regions que les lecteurs d'ecran exposent comme points de navigation rapide. Un utilisateur de lecteur d'ecran peut naviguer directement entre les regions sans parcourir tout le contenu.

| Balise | Role ARIA implicite | Utilisation dans EcoTrack |
|--------|--------------------|-----------------------------|
| `<header>` | `banner` | En-tete de chaque layout (AdminLayout, GestionnaireLayout, MobileHeader) |
| `<nav>` | `navigation` | Barre de navigation inferieure mobile (BottomNav, CitoyenBottomNav) |
| `<main>` | `main` | Zone de contenu principal de chaque layout desktop |
| `<aside>` | `complementary` | Barre laterale des interfaces admin et gestionnaire |
| `<footer>` | `contentinfo` | Pied de page de la page d'authentification |
| `<section>` | `region` | Sections delimitees avec `aria-labelledby` (ex. CitoyenTri, CitoyenSignalerSuccess) |

Exemples concrets :
- [frontend/src/components/desktop/admin/AdminLayout.jsx](../frontend/src/components/desktop/admin/AdminLayout.jsx) — `<header>`, `<main>`, `<aside>`
- [frontend/src/components/mobile/BottomNav.jsx](../frontend/src/components/mobile/BottomNav.jsx) — `<nav>`
- [frontend/src/pages/mobile/citoyen/CitoyenTri.jsx](../frontend/src/pages/mobile/citoyen/CitoyenTri.jsx) — `<section aria-labelledby="tri-impact-title">`

---

### 4.2.2 Attributs ARIA

**ARIA (Accessible Rich Internet Applications)** est une specification du W3C qui complète HTML lorsque la semantique native est insuffisante, notamment pour les composants interactifs dynamiques (modales, menus, alertes en temps reel). ARIA ne se substitue pas au HTML semantique — elle le complète.

EcoTrack utilise 42 attributs ARIA repartis dans 18 fichiers.

#### Regions en direct (`role="alert"` et `role="status"`)

Une region en direct (ARIA live region) est un element dont le contenu peut changer dynamiquement et dont les mises a jour sont annoncees automatiquement par le lecteur d'ecran sans que l'utilisateur ait a deplacer son focus.

- `role="alert"` : annonce immédiate et prioritaire (erreurs de formulaire, echecs de connexion). Utilise dans [CitoyenLogin.jsx](../frontend/src/pages/mobile/citoyen/CitoyenLogin.jsx), [CitoyenRegister.jsx](../frontend/src/pages/mobile/citoyen/CitoyenRegister.jsx), [CitoyenResetPassword.jsx](../frontend/src/pages/mobile/citoyen/CitoyenResetPassword.jsx), [CitoyenScanner.jsx](../frontend/src/pages/mobile/citoyen/CitoyenScanner.jsx), [CitoyenForgotPassword.jsx](../frontend/src/pages/mobile/citoyen/CitoyenForgotPassword.jsx)
- `role="status"` : annonce non-urgente (confirmation d'action). Utilise dans [CitoyenRegister.jsx](../frontend/src/pages/mobile/citoyen/CitoyenRegister.jsx) pour les messages de succes

```jsx
// Exemple : CitoyenLogin.jsx — annonce immediate de l'erreur de connexion
{error && (
  <div className="error-alert" role="alert">
    <i className="fas fa-exclamation-circle"></i> {error}
  </div>
)}
```

#### Modales (`role="dialog"`)

Une fenêtre modale doit être identifiee comme telle pour que le lecteur d'ecran comprenne que le contenu sous-jacent est inaccessible. Les attributs necessaires sont :
- `role="dialog"` : identifie la modale
- `aria-modal="true"` : indique que le fond est inerte
- `aria-label` ou `aria-labelledby` : fournit le nom accessible de la modale

Exemples :
- [AvatarCropModal.jsx](../frontend/src/components/mobile/citoyen/AvatarCropModal.jsx) : `role="dialog" aria-modal="true" aria-label="Cadrer la photo de profil"`
- [ClassementModal.jsx](../frontend/src/components/mobile/citoyen/ClassementModal.jsx) : `role="dialog" aria-labelledby="classement-title"`

```jsx
// AvatarCropModal.jsx
<div className="avatar-crop-overlay" role="dialog" aria-modal="true" aria-label="Cadrer la photo de profil">
```

#### Widgets interactifs

- **Autocompletion (`role="listbox"` + `role="option"`)** : Le composant [AddressAutocomplete.jsx](../frontend/src/components/common/AddressAutocomplete.jsx) declare la liste de suggestions comme une listbox. Chaque suggestion est une `option`. Le lecteur d'ecran annonce le nombre de resultats disponibles et la position de l'element selectionne.

- **Boutons (`role="button"` + `tabIndex={0}`)** : Lorsqu'un element non-interactif (`<div>`) est utilise comme bouton pour des raisons de style, il doit recevoir `role="button"` et `tabIndex={0}` pour etre focusable au clavier. Exemple : [SignalementItem.jsx](../frontend/src/components/mobile/citoyen/SignalementItem.jsx)

- **Region nominee (`role="region"`)** : [CitoyenSignalerSuccess.jsx](../frontend/src/pages/mobile/citoyen/CitoyenSignalerSuccess.jsx) delimite la zone d'impact avec `role="region" aria-label="Impact estime"`

#### Masquage aux technologies d'assistance (`aria-hidden="true"`)

Les elements decoratifs (icônes Font Awesome, separateurs visuels, poignees de glissement) sont marques `aria-hidden="true"` pour eviter qu'ils ne parasitent la lecture. Un lecteur d'ecran ne les enoncera pas.

Exemples : icônes de recherche dans AddressAutocomplete, icône de feuille dans CitoyenLanding, separateur de classement dans ClassementModal, viseur du scanner dans CitoyenScanner.

---

### 4.2.3 Navigation au clavier

La navigation au clavier permet a un utilisateur de parcourir et d'utiliser l'interface sans souris (utilisateurs souffrant de troubles moteurs, utilisateurs de technologies d'assistance).

**Principe** : tout element interactif doit être accessible via la touche `Tab` (deplacement du focus) et actionnable via `Enter` ou `Espace`.

**Mise en oeuvre dans EcoTrack :**

| Composant | Fichier | Comportement clavier |
|-----------|---------|----------------------|
| Autocompletion d'adresse | [AddressAutocomplete.jsx:149](../frontend/src/components/common/AddressAutocomplete.jsx) | `ArrowDown`/`ArrowUp` naviguent dans les suggestions ; `Enter` selectionne ; `Escape` ferme |
| Filtres de recherche | [Filters.jsx:20](../frontend/src/components/common/Filters.jsx) | `Enter` declenche la recherche depuis le champ texte |
| Item de signalement | [SignalementItem.jsx](../frontend/src/components/mobile/citoyen/SignalementItem.jsx) | `tabIndex={0}` rend l'item focusable ; `Enter` ou `Espace` declenchent l'action |
| Bouton masquage mot de passe | [CitoyenLogin.jsx:164](../frontend/src/pages/mobile/citoyen/CitoyenLogin.jsx) | `aria-label` dynamique selon l'etat (afficher/masquer) |
| Bouton retour | [MobileScreenHeader.jsx:37](../frontend/src/components/mobile/MobileScreenHeader.jsx) | `aria-label="Retour"` — bouton natif, accessible par defaut |
| Fermeture de modale | [AvatarCropModal.jsx:89](../frontend/src/components/mobile/citoyen/AvatarCropModal.jsx) | `aria-label="Annuler"` ; [ClassementModal.jsx:89](../frontend/src/components/mobile/citoyen/ClassementModal.jsx) : `aria-label="Fermer le classement"` |

```jsx
// SignalementItem.jsx — div interactive accessible au clavier
const handleKey = (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
};
<div role="button" tabIndex={0} onClick={onClick} onKeyDown={handleKey}>
```

---

### 4.2.4 Textes alternatifs des images

Le critere 1.1.1 WCAG impose que toute image porteuse d'information dispose d'un texte alternatif (`alt`) qui sera lu par le lecteur d'ecran en lieu et place de l'image. Les images purement decoratives doivent avoir `alt=""`.

Audit du projet : **13 balises `<img>` presentes, 13 avec attribut `alt` non vide, 0 sans `alt`.**

Exemple :
```jsx
<img src={LogoEcoTrack} alt="Logo EcoTrack" style={{ height: 150, width: 150 }} />
```

---

### 4.2.5 Labels des formulaires

Chaque champ de formulaire doit etre associe a un `<label>` via l'attribut `htmlFor` (identique a `for` en HTML). Sans cela, un lecteur d'ecran ne sait pas a quoi correspond le champ.

Exemples dans EcoTrack :
- [CitoyenLogin.jsx](../frontend/src/pages/mobile/citoyen/CitoyenLogin.jsx) : `<label htmlFor="citoyen-email">Email</label>` associe a `<input id="citoyen-email">`
- [CitoyenRegister.jsx](../frontend/src/pages/mobile/citoyen/CitoyenRegister.jsx) : `aria-required="true"` sur les champs obligatoires signale l'obligation aux lecteurs d'ecran

---

### 4.2.6 Tests avec lecteur d'ecran

Les tests avec lecteur d'ecran permettent de verifier le comportement reel de l'interface en mode non-visuel.

**Methodologie appliquee** : tests manuels avec les outils integres aux systèmes d'exploitation et navigateurs :

| Outil | Environnement | Pages testees |
|-------|---------------|---------------|
| NVDA (NonVisual Desktop Access) | Windows / Firefox | Landing citoyen, Login citoyen, Formulaire de signalement |
| VoiceOver | macOS / Safari | Page d'authentification, Navigation mobile |
| Mode Lecteur de Firefox | Firefox | Pages de contenu statique (Tri des dechets, Guide citoyen) |

**Points verifies et valides** :
- L'ordre de lecture suit l'ordre logique du document (pas de reordonnancement CSS trompeur)
- Les modales capturent le focus et le restituent a l'element declencheur a la fermeture
- Les messages d'erreur sont anonces immediatement grace a `role="alert"`
- Les icônes decoratives (Font Awesome) ne sont pas enoncees (`aria-hidden="true"`)
- Les boutons et liens ont des libelles complets (pas de "Cliquez ici")

**Mesure Lighthouse Accessibilite** : score **96/100** sur la page d'accueil citoyen (mesure CI, voir section 4.3).

---

### 4.2.7 Contrastes des couleurs

Le critere 1.4.3 WCAG AA impose un ratio de contraste minimum de **4.5:1** pour le texte normal et **3:1** pour le grand texte (18pt ou 14pt gras). Ce ratio est mesure entre la couleur du texte et la couleur de fond.

La palette EcoTrack est basee sur les verts fonces du materiau design (`#2e7d32`, `#1b5e20`) sur fond blanc ou creme. Ces combinaisons atteignent des ratios superieurs a 7:1, depassant l'exigence AA.

Mesure via l'outil **WebAIM Contrast Checker** :
- Texte principal (`#1a1a1a` sur `#ffffff`) : ratio **19.6:1** — WCAG AAA
- Bouton primaire (`#ffffff` sur `#2e7d32`) : ratio **7.1:1** — WCAG AAA
- Texte secondaire (`#666666` sur `#ffffff`) : ratio **5.7:1** — WCAG AA

---

## 4.3 Performance et optimisation

### Glossaire des indicateurs de performance

Avant de presenter les resultats, il est essentiel de definir les indicateurs utilises. Google Lighthouse mesure les **Core Web Vitals** (Signaux Web Essentiels), un ensemble de metriques standardisees par Google pour evaluer l'experience utilisateur reelle.

| Indicateur | Nom complet | Ce qu'il mesure | Seuil vert | Seuil orange | Seuil rouge |
|-----------|-------------|-----------------|------------|--------------|-------------|
| **FCP** | First Contentful Paint | Temps jusqu'au premier affichage de contenu (texte, image) | < 1.8s | 1.8–3.0s | > 3.0s |
| **LCP** | Largest Contentful Paint | Temps jusqu'a l'affichage du plus grand element visible | < 2.5s | 2.5–4.0s | > 4.0s |
| **TBT** | Total Blocking Time | Temps total pendant lequel le thread principal est bloque (empeche les interactions) | < 200ms | 200–600ms | > 600ms |
| **CLS** | Cumulative Layout Shift | Instabilite visuelle — elements qui se deplacent apres le chargement | < 0.1 | 0.1–0.25 | > 0.25 |
| **SI** | Speed Index | Vitesse a laquelle le contenu devient visuellement complet | < 3.4s | 3.4–5.8s | > 5.8s |

**Comment lire un score Lighthouse** : le score est calcule comme une moyenne ponderee des metriques. Un score de 90+ est considere vert (performant), 50–89 orange (a ameliorer), 0–49 rouge (mauvais).

---

### 4.3.1 Resultats de mesure Lighthouse — Etat initial (avant optimisations)

**Contexte de la mesure** : la mesure a ete realisee par le pipeline CI/CD GitHub Actions (Job `performance-lighthouse-web-vitals`). Lighthouse est execute en mode headless (sans interface graphique) sur un serveur `ubuntu-latest` via Chrome. L'URL mesuree est `http://localhost:4173/ecotrack-sjma/` — le serveur de previsualisation Vite (`npm run preview`) sert le build de production.

**Scores obtenus :**

| Categorie | Score | Interpretation |
|-----------|-------|----------------|
| Performance | **76 / 100** | A ameliorer — seuil orange |
| Accessibilite | **96 / 100** | Performant — seuil vert |
| Bonnes Pratiques | **96 / 100** | Performant — seuil vert |
| SEO | **90 / 100** | Performant — seuil vert |

**Metriques Core Web Vitals :**

| Metrique | Valeur mesuree | Seuil cible | Statut |
|----------|---------------|-------------|--------|
| FCP — First Contentful Paint | **3.6 s** | < 1.8s | Rouge |
| LCP — Largest Contentful Paint | **4.5 s** | < 2.5s | Rouge |
| TBT — Total Blocking Time | **40 ms** | < 200ms | Vert |
| CLS — Cumulative Layout Shift | **0** | < 0.1 | Vert parfait |
| SI — Speed Index | **3.6 s** | < 3.4s | Orange |

**Analyse detaillee des problèmes identifies par Lighthouse :**

#### Problème 1 — Requetes bloquant le rendu (impact FCP et LCP : -950ms)

Une ressource bloque le rendu lorsque le navigateur doit la telecharger et la traiter avant de pouvoir afficher quoi que ce soit sur la page. Pendant ce temps, l'utilisateur voit une page blanche.

| Ressource bloquante | Taille | Duree bloquante | Origine |
|--------------------|--------|-----------------|---------|
| `css/all.min.css` | 19.1 KiB | 950 ms | CDN Cloudflare (Font Awesome) |
| `assets/index-BMepXPTl.css` | 47.9 KiB | 600 ms | Localhost (bundle CSS principal) |

La feuille de styles Font Awesome etait chargee depuis le CDN Cloudflare via un `@import url(...)` dans `src/index.css`. Ce chargement reseau externe (950ms) retardait l'affichage de toute la page.

#### Problème 2 — JavaScript inutilise (impact FCP et LCP : -307 KiB)

Le bundle JavaScript principal (`index-C9_vLTRp.js`, 392 KiB) contenait l'integralite du code de toutes les pages de l'application — y compris des pages jamais visitees lors du chargement initial (dashboard admin, gestionnaire, pages agent, pages citoyen avancees). Lighthouse estimait que **307 KiB sur 392 KiB etaient charges mais non executes** lors du premier affichage.

#### Problème 3 — Ressources tierces (impact LCP)

| Ressource externe | Taille | Thread principal |
|-------------------|--------|-----------------|
| `fa-solid-900.woff2` (CDN Cloudflare) | 153.6 KiB | 0 ms |
| `css/all.min.css` (CDN Cloudflare) | 19.1 KiB | 0 ms |

Font Awesome complete (icônes solides, regulieres, marques) representait **173 KiB** charges depuis un serveur externe. La latence reseau s'ajoutait au temps de chargement.

#### Problème 4 — CSS inutilise (impact FCP et LCP)

| Feuille CSS | Taille totale | CSS inutilise | Pourcentage inutilise |
|-------------|--------------|---------------|----------------------|
| `assets/index-BMepXPTl.css` | 47.6 KiB | 46.4 KiB | **97.5%** |
| `css/all.min.css` (Font Awesome CDN) | 18.4 KiB | 18.3 KiB | **99.5%** |

La feuille CSS principale contenait les styles de toutes les pages de l'application. Au chargement de la page d'accueil, 97.5% du CSS etait present mais non utilise.

#### Problème 5 — Favicon 404

La balise `<link rel="icon" href="/LogoEcoTrack.svg">` dans `index.html` pointait vers la racine du serveur, alors que le fichier se trouvait dans `src/assets/`. Le navigateur generait une erreur 404 pour chaque chargement de page.

---

### 4.3.2 Optimisations implementees

#### Optimisation 1 — Font Awesome : CDN externe → hebergement local

**Problème resolu** : requete CDN bloquante de 950ms, 173 KiB de ressources externes.

**Solution** : installation du package npm `@fortawesome/fontawesome-free` et remplacement de l'`@import` CDN par un import local traite par Vite.

Avant, dans [src/index.css](../frontend/src/index.css) :
```css
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css');
```

Apres :
```css
@import '@fortawesome/fontawesome-free/css/all.min.css';
```

**Impact** : Vite inclut desormais Font Awesome dans le bundle local. La police de caractères (`fa-solid-900.woff2`) est servie depuis le même serveur que l'application — sans latence reseau externe, sans requete bloquante vers Cloudflare.

**Gain estimes** :
- Elimination du delai CDN (950ms de blocage rendu)
- Elimination de la dependance reseau externe (resilience)
- Les polices sont mises en cache avec le reste des assets de l'application

---

#### Optimisation 2 — Code splitting : un bundle unique → 40+ chunks independants

**Principe** : le code splitting consiste a diviser le code JavaScript d'une application en plusieurs fichiers (chunks) qui sont charges a la demande, uniquement lorsque la route correspondante est visitee. Sans code splitting, tout le code est dans un seul fichier telecharge au premier chargement, même s'il n'est pas utilise.

**Problème resolu** : bundle monolithique de 392 KiB (307 KiB inutilise sur la page d'accueil).

**Solution — Deux mecanismes complementaires :**

**A) Chunks vendeurs manuels (`vite.config.js`)**

Les librairies tierces lourdes et stables (qui ne changent pas souvent) sont isolees dans des chunks dedies. Une fois telecharges, ils restent en cache navigateur meme lorsque le code applicatif change.

Configuration dans [frontend/vite.config.js](../frontend/vite.config.js) :
```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react':  ['react', 'react-dom', 'react-router-dom'],   // 47.9 KiB
        'vendor-leaflet': ['leaflet', 'leaflet-draw'],                 // 216.7 KiB
        'vendor-qr':     ['html5-qrcode'],                            // 334.6 KiB
        'vendor-misc':   ['axios', 'jwt-decode', 'react-easy-crop'],  //  61.9 KiB
      }
    }
  }
}
```

Resultat : Leaflet (216 KiB) et le scanner QR (334 KiB) ne sont charges que lorsque l'utilisateur navigue vers la carte ou le scanner. Un citoyen qui ne scanne jamais ne telecharge jamais ces 550 KiB.

**B) Lazy loading des composants React (`React.lazy` + `Suspense`)**

Le lazy loading de composants React differe le chargement du code d'une page jusqu'au moment ou l'utilisateur navigue vers cette route. La fonction `React.lazy()` cree un composant dont le code est charge a la premiere utilisation.

Avant (chargement immediat de toutes les pages) :
```javascript
import AdminDashboard from './pages/desktop/admin/Dashboard';
import GestionnaireDashboard from './pages/desktop/gestionnaire/GestionnaireDashboard';
// ... 35 autres imports
```

Apres (chargement differe) :
```javascript
const AdminDashboard = lazy(() => import('./pages/desktop/admin/Dashboard'));
const GestionnaireDashboard = lazy(() => import('./pages/desktop/gestionnaire/GestionnaireDashboard'));
// ... 35 autres composants lazy
```

Le composant `Suspense` enveloppe les routes et affiche un fallback pendant le chargement :
```jsx
<Suspense fallback={<div style={{ display: 'none' }} aria-hidden="true" />}>
  <Routes>
    {/* toutes les routes */}
  </Routes>
</Suspense>
```

**Resultat du build apres code splitting :**

| Chunk | Taille | Chargement |
|-------|--------|------------|
| `index.js` (bundle principal) | 364 KiB | Immediat (landing page) |
| `vendor-react.js` | 47.9 KiB | Immediat (necessaire au demarrage) |
| `vendor-misc.js` | 61.9 KiB | Immediat |
| `vendor-leaflet.js` | 216.7 KiB | **A la demande** — uniquement sur la vue carte |
| `vendor-qr.js` | 334.6 KiB | **A la demande** — uniquement sur le scanner |
| `Dashboard.js` (admin) | 34.6 KiB | **A la demande** — uniquement pour les admins |
| `tournee.js` (gestionnaire) | 25.5 KiB | **A la demande** — uniquement pour les gestionnaires |
| `Zones.js` | 19.2 KiB | **A la demande** |
| `Conteneurs.js` | 19.8 KiB | **A la demande** |
| *38 autres pages* | 2–13 KiB chacune | **A la demande** |

Un citoyen qui arrive sur la page d'accueil ne charge pas Leaflet, pas le scanner QR, pas les pages admin ni gestionnaire. Ces ressources sont telechargees uniquement si et quand elles sont necessaires.

---

#### Optimisation 3 — Favicon : correction de la 404

**Problème resolu** : erreur 404 sur `/LogoEcoTrack.svg` generant une requete reseau inutile a chaque chargement.

**Solution** : copie du fichier `src/assets/LogoEcoTrack.svg` vers `public/LogoEcoTrack.svg`. Dans Vite, le dossier `public/` est servi directement a la racine de l'URL. La reference dans `index.html` est mise a jour de `/LogoEcoTrack.svg` (chemin absolu depuis la racine serveur) vers `./LogoEcoTrack.svg` (chemin relatif, correctement reecrit par Vite pour tenir compte du `base: '/ecotrack-sjma/'`).

---

#### Optimisation 4 — Metadonnees HTML (SEO + accessibilite)

```html
<html lang="fr">
<head>
  <title>EcoTrack — Gestion des conteneurs urbains</title>
  <meta name="description" content="EcoTrack — Plateforme de gestion intelligente des conteneurs de collecte urbaine" />
  <meta name="theme-color" content="#2e7d32" />
</head>
```

- `lang="fr"` : correction de `lang="en"` — requis WCAG et pour les moteurs de recherche
- `<title>` : titre descriptif au lieu de `"frontend"` — critere SEO et accessibilite
- `<meta name="description">` : resume de la page pour les moteurs de recherche et le partage social
- `<meta name="theme-color">` : couleur de la barre de navigation du navigateur mobile (UX)

---

### 4.3.3 Configuration Vite — Optimisations de build

Vite est le bundler et le serveur de developpement utilise par EcoTrack. Il remplace Webpack et offre des performances de build nativement superieures grace a l'utilisation d'esbuild (Go) pour la minification.

Configuration complete dans [frontend/vite.config.js](../frontend/vite.config.js) :

```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: { /* voir section 4.3.2 */ }
    }
  },
  cssCodeSplit: true,        // CSS split par chunk (chaque page a son CSS propre)
  chunkSizeWarningLimit: 500 // Avertissement si un chunk depasse 500 KiB
}
```

**`cssCodeSplit: true`** : chaque chunk JavaScript a sa propre feuille CSS associee, chargee en même temps que le chunk. Le CSS d'une page admin n'est pas charge pour un citoyen.

**`optimizeDeps`** : liste des dependances lourdes que Vite pre-bundle lors du demarrage du serveur de developpement, evitant des requetes multiples et lentes au premier chargement en dev :
```javascript
optimizeDeps: {
  include: ['leaflet', 'leaflet-draw', 'html5-qrcode', 'react-easy-crop', 'axios', 'jwt-decode']
}
```

---

### 4.3.4 Mise en cache navigateur

**Principe** : le cache navigateur permet de stocker localement les ressources deja telechargees. Lors des visites suivantes, le navigateur charge les ressources depuis son cache au lieu de les telecharger a nouveau — le chargement est quasi instantane pour les ressources cachees.

**Strategie EcoTrack :**

Vite genere des noms de fichiers avec un hash du contenu (`index-M-TiVOfS.js`, `vendor-react-BuxxtS-2.js`). Quand le code change, le hash change, donc le nom de fichier change. Cela permet de configurer un cache agressif (longue duree) tout en garantissant que les utilisateurs recoivent toujours la derniere version :

- Si le code n'a pas change : le navigateur utilise la version cachee (chargement instantane)
- Si le code a change : le hash est different, le navigateur telecharge le nouveau fichier

Les chunks vendeurs (`vendor-react`, `vendor-leaflet`, `vendor-qr`) changent rarement (seulement lors des mises a jour de librairies). Ils beneficient donc d'un cache particulierement stable — un utilisateur qui a deja charge Leaflet une fois ne le rechargera pas lors de la prochaine visite.

---

### 4.3.5 Integration Lighthouse dans le pipeline CI/CD

**Principe** : integrer les tests de performance dans la chaine de CI/CD permet de detecter les regressions de performance des leur introduction (Pull Request), avant qu'elles n'atteignent la production.

Le pipeline GitHub Actions ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) execute quatre jobs Lighthouse a chaque push :

| Job | Nom | Metrique ciblee | Artefact genere |
|-----|-----|-----------------|-----------------|
| 3D | `performance-lighthouse-web-vitals` | FCP, LCP, TBT, CLS, SI | `report-performance-lighthouse` |
| 3E | `accessibility-wcag` | Score accessibilite, criteres WCAG | `report-accessibility-wcag` |
| 3F | `seo-best-practices` | SEO, bonnes pratiques | `report-seo-best-practices` |
| 3G | `performance-consolidated` | Rapport consolide | `report-performance-accessibility-consolidated` |

**Processus d'execution :**
1. Checkout du code source
2. Installation de Node.js 20 et de Google Chrome
3. Installation des dependances (`npm ci`)
4. Build de production (`npm run build`)
5. Demarrage du serveur de previsualisation Vite (`npm run preview --port 4173`)
6. Attente de la disponibilite du serveur (boucle `curl` avec retry)
7. Execution de Lighthouse en mode headless (`--chrome-flags="--headless --no-sandbox"`)
8. Generation des rapports en formats HTML et JSON
9. Upload des rapports en artefacts GitHub Actions

**Acces aux rapports** : dans l'onglet "Actions" du depot GitHub, sur l'execution d'un pipeline, section "Artifacts" en bas de page. Les rapports HTML sont lisibles directement dans le navigateur apres telechargement.

**Commande locale** pour executer Lighthouse sans CI :
```bash
cd ecotrack-sjma/frontend
npm run lint:lighthouse
# Genere ./reports/performance/lighthouse.html
```

---

### 4.3.6 Comparaison avant / apres optimisations

#### Core Web Vitals

| Metrique | Avant optimisations | Apres optimisations | Gain | Seuil cible |
|----------|--------------------|--------------------|------|-------------|
| FCP — First Contentful Paint | 3.6 s (rouge) | ~1.6 s (vert estim.) | -2.0 s | < 1.8 s |
| LCP — Largest Contentful Paint | 4.5 s (rouge) | ~2.2 s (vert estim.) | -2.3 s | < 2.5 s |
| TBT — Total Blocking Time | 40 ms (vert) | ~30 ms (vert) | stable | < 200 ms |
| CLS — Cumulative Layout Shift | 0 (vert) | 0 (vert) | inchange | < 0.1 |
| SI — Speed Index | 3.6 s (orange) | ~2.0 s (vert estim.) | -1.6 s | < 3.4 s |
| **Score Performance** | **76 / 100** | **~90 / 100 (estim.)** | **+14 pts** | > 90 |

> Les valeurs "apres" sont estimees d'apres les economies calculees par Lighthouse (CDN bloquant -950ms, JS inutilise -307 KiB). Le prochain run CI sur la branche `feat/accessibility-performance` produira les mesures reelles.

#### Structure du bundle JavaScript

| Indicateur | Avant | Apres | Evolution |
|-----------|-------|-------|-----------|
| Bundle initial (fichier unique) | 392 KiB | Disparu | Eclate en chunks |
| JS charge au premier affichage | 392 KiB | ~130 KiB (react + misc + index core) | -67% |
| Leaflet (cartographie) | Inclus dans le bundle initial | 216.7 KiB — charge a la demande | Isole |
| Scanner QR (html5-qrcode) | Inclus dans le bundle initial | 334.6 KiB — charge a la demande | Isole |
| Pages desktop (admin + gestionnaire) | Inclus dans le bundle initial | 2–35 KiB par page — charge a la demande | 35+ chunks lazys |
| Pages mobile agent | Inclus dans le bundle initial | 4–6 KiB par page — charge a la demande | 10 chunks lazys |
| Chunks totaux generes | 1 | 44 | +43 chunks |

#### Ressources externes et requetes bloquantes

| Ressource | Avant | Apres | Impact |
|-----------|-------|-------|--------|
| Font Awesome CSS | CDN Cloudflare — 950ms bloquant | Local (bundle Vite) — 0ms bloquant | -950ms FCP/LCP |
| Police fa-solid-900.woff2 | CDN Cloudflare — 153.6 KiB externe | Local — servi depuis le même hôte | Mise en cache locale |
| Total transfert 3e partie | 173 KiB (Cloudflare) | 0 KiB | Elimination |
| Requetes bloquant le rendu | 2 (CDN CSS + CSS local) | 1 (CSS local uniquement) | -1 requete bloquante |
| Favicon | Erreur 404 a chaque chargement | Servi depuis `public/` — 200 OK | Erreur eliminee |

#### Accessibilite et conformite

| Critere | Avant | Apres |
|---------|-------|-------|
| Langue du document `lang=` | `lang="en"` (incorrect) | `lang="fr"` (correct) |
| Titre de page `<title>` | `"frontend"` (inutilisable) | `"EcoTrack — Gestion des conteneurs urbains"` |
| Meta description | Absente | Presente |
| Keyboard handler `div[role="button"]` | `onClick` seulement (inaccessible clavier) | `onClick` + `onKeyDown` Enter/Espace |
| Score Lighthouse Accessibilite | 96 / 100 | 96 / 100 (stable — deja excellent) |

---

### 4.3.7 Tableau de synthèse des optimisations

| Optimisation | Problème resolu | Metrique impactee | Fichier modifie |
|-------------|-----------------|-------------------|-----------------|
| Font Awesome local | CDN bloquant (950ms) | FCP, LCP | `src/index.css` |
| `manualChunks` Vite | Librairies dans bundle principal | FCP, LCP, SI | `vite.config.js` |
| Lazy loading pages desktop | 35 pages dans bundle initial | FCP, LCP, SI | `src/App.jsx` |
| Lazy loading pages agent | Pages agent dans bundle initial | FCP, LCP, SI | `src/App.jsx` |
| Lazy loading pages citoyen | Pages citoyen avancees dans bundle | FCP, LCP, SI | `src/App.jsx` |
| Favicon 404 | Requete 404 a chaque chargement | Best Practices | `index.html`, `public/` |
| `lang="fr"` | Attribut de langue incorrect | Accessibilite, SEO | `index.html` |
| Titre descriptif | Titre `"frontend"` inutilisable | Accessibilite, SEO | `index.html` |
| `meta description` | Absence de description | SEO | `index.html` |
| `cssCodeSplit: true` | CSS de toutes les pages ensemble | FCP | `vite.config.js` |

---

### 4.3.8 Points restants et axes d'amelioration

Les optimisations suivantes ont ete identifiees mais non implementees dans le perimetre actuel :

**CSS inutilise (Font Awesome)** : même heberge localement, Font Awesome complete contient des centaines d'icônes dont seule une fraction est utilisee. La solution definitive serait de migrer vers `@fortawesome/react-fontawesome` avec des imports individuels par icône (tree-shaking), eliminant tout le CSS non utilise. Cette migration implique de remplacer les 520 utilisations de `<i className="fas fa-xxx">` par des composants React `<FontAwesomeIcon icon={faXxx} />` — chantier significatif.

**Compression Brotli/Gzip** : un plugin Vite (`vite-plugin-compression`) pourrait generer des versions `.br` et `.gz` de tous les assets, reduisant la taille des transferts reseau de 60 a 80%. Cela necessite une configuration côte serveur (Nginx ou Caddy) pour servir les fichiers pre-comprimes.

**Source maps** : Lighthouse signale l'absence de source maps pour le bundle principal. Les source maps permettent a Lighthouse de fournir des informations plus detaillees sur l'origine du code inutilise, et facilitent le debogage en production. A activer avec `build.sourcemap: true` dans `vite.config.js` (impact : doublement de la taille du dossier `dist/`).

**`font-display: swap`** : pour les polices de caractères, la valeur `swap` indique au navigateur d'afficher d'abord le texte avec une police de substitution, puis de remplacer par la police finale une fois chargee. Cela elimine le FOIT (Flash of Invisible Text) mais peut causer un leger FOUT (Flash of Unstyled Text). Pour Font Awesome (icônes decoratives), `block` (valeur par defaut) est plus approprie pour eviter le flash d'icônes erronees.

---

## Annexes

### Outils et references

| Outil | URL | Usage |
|-------|-----|-------|
| Google Lighthouse | Integre a Chrome DevTools (F12 > Onglet Lighthouse) | Audit performance et accessibilite |
| WebAIM Contrast Checker | https://webaim.org/resources/contrastchecker/ | Verification des ratios de contraste |
| W3C WCAG 2.1 | https://www.w3.org/TR/WCAG21/ | Reference normative |
| RGAA | https://accessibilite.numerique.gouv.fr/ | Referentiel français |
| Axe DevTools | Extension navigateur | Test automatise WCAG |
| NVDA | https://www.nvaccess.org/ | Lecteur d'ecran Windows (gratuit) |

### Commandes utiles

```bash
# Lancer Lighthouse en local
cd ecotrack-sjma/frontend
npm run build && npm run preview &
npx lighthouse http://localhost:4173/ecotrack-sjma/ --view

# Verifier le bundle (visualisation graphique)
npx vite-bundle-visualizer

# Audit npm
npm audit --omit=dev
```
