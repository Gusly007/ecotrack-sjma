# Plan d'implémentation — Fix & Stabilisation Mobile Agent

> **Contexte** — La PR `feat/mobile-agent-interface` (#35) a été enrichie par un collègue (commits `156e8ed`, `4cced1c`, `7045efb`, `fc9614d`) avec :
> - Génération QR code dynamique côté backend (`/qrcode/:uid`)
> - Page QR generator HTML statique publique
> - PWA dev artifacts (`dev-dist/`)
> - Routes `/scan` et `/scan/result/:uid` partagées (Agent + Citoyen)
> - Documentation `USER_GUIDE.md` + diagrammes Mermaid + `README_QR_PWA.md`
> - Suppression de la phase 2 « Citoyen » dans `IMPLEMENTATION_MOBILE.md`
>
> Les retours de test révèlent **plusieurs régressions critiques** (build cassé, endpoints qui plantent, validations incorrectes) en plus de bugs de design existants.
>
> **Aucune branche citoyen n'a été poussée** par l'autre développeur (vérifié sur `fork/*` et `origin/*` au 2026-05-01).

---

## 1. Pourquoi ces problèmes ? (analyse racine)

| Cause | Conséquence |
|-------|-------------|
| **Aucun test manuel end-to-end** avant push (PR ouverte depuis 2026-04-22, pas de revue UI) | Bugs visibles dès le 1er clic ne sont pas détectés |
| **Pas de tests d'intégration** sur les routes mobile (`/api/V1/routes/my-tournee`, `/anomalie`, `/collecte`) | Mismatch payload front/back invisibles en CI |
| **Pas de seed agent** : la BDD a 200+ tournées de seed mais pas pour `MOUSSA` connecté | « Pas de tournée » alors qu'il y en a une ajoutée manuellement |
| **Refactor cache (`getOrSet`)** côté collègue casse 4 endpoints `service-containers` (`getAll`, `getByStatus`, `getByZone`, `count`) qui retournent encore `result.data` | Liste conteneurs renvoie `undefined` |
| **Imports React non vérifiés** dans `App.jsx` après ajout des routes `/scan` `/scan/result` `/qr-codes` | Build Vite échoue immédiatement (3 fichiers manquants) |
| **Reuse code copy/paste** (route QR enregistrée 2× dans `container.route.js`) | Express prend la 2ᵉ qui est derrière `authenticateToken` → QR public ne marche pas |
| **Stats mobile = stats globales** (pas filtrées par `id_agent`) | « 201 tournées » alors que l'agent en a 0 |
| **Validation Joi stricte** mais front envoie un schéma différent (`type` vs `type_anomalie`, `id_conteneur` requis mais null) | 400 Validation échouée → utilisateur voit « rien envoyé » |

---

## 2. Bugs identifiés (ordonnés par sévérité)

### P0 — Bloquants (build / endpoint cassé)

| # | Bug | Fichier | Cause |
|---|-----|---------|-------|
| **B1** | Build Vite échoue : import de `pages/QRCodePage` | `frontend/src/App.jsx:49` | Fichier `QRCodePage.jsx` jamais créé |
| **B2** | Build Vite échoue : import de `pages/mobile/shared/ScanPage` | `frontend/src/App.jsx:50` | Fichier inexistant (seul `ScanUniversal.jsx` créé, mais ailleurs) |
| **B3** | Build Vite échoue : import de `pages/mobile/shared/ScanResult` | `frontend/src/App.jsx:51` | Idem B2 |
| **B4** | `ScanUniversal.jsx` casse : import `'./ScanResult.css'` (fichier supprimé) + `'../../context/AuthContext'` (chemin incorrect : remonte hors `src/`) | `frontend/src/pages/ScanUniversal.jsx:3,5` | Fichier déplacé sans corriger imports |
| **B5** | Endpoints `service-containers` cassés : `getAllContainers`, `getContainersByStatus`, `getContainersByZone`, `countContainers` retournent `undefined` | `services/service-containers/src/services/container-services.js:116,132,148,198` | Cache `getOrSet` retourne maintenant la donnée brute, mais ces 4 méthodes utilisent encore `result.data` |
| **B6** | Anomalie ne s'envoie jamais (400) | `frontend/src/pages/mobile/agent/AnomalieForm.jsx:54-58` | Envoie `{type, description, id_conteneur:null}` mais backend exige `{type_anomalie, description, id_conteneur:int>0}` |
| **B7** | Route QR `/qrcode/:uid` enregistrée 2× dans le même router : la 2ᵉ est **derrière** `authenticateToken` | `services/service-containers/src/routes/container.route.js:13-30` (avant auth) **et** `577-606` (après auth) | Express utilise la 1ʳᵉ qui matche, donc public OK, mais doublon = code mort à supprimer. Surtout : le mount path est `/api/V1/qrcode/:uid` (pas `/api/V1/containers/qrcode/:uid`) — non couvert par le proxy gateway `/api/V1/containers` |
| **B8** | `Pool` PostgreSQL créé en doublon dans `container.route.js` (vars `POSTGRES_*` au lieu de `DATABASE_URL` projet) | Idem ligne 6-13 | Pool jamais fermé, env mismatch — utiliser le repository injecté |

### P1 — Fonctionnels visibles (feedbacks utilisateur)

| # | Bug feedback | Fichier | Cause |
|---|--------------|---------|-------|
| **F1** | « Tournée pas affichée » alors qu'elle existe en BDD | `service-routes/.../tournee-repository.js:188-190` | La query exige `t.id_agent = $1 AND t.date_tournee = CURRENT_DATE AND t.statut IN ('PLANIFIEE','EN_COURS')`. Si la tournée insérée a un `date_tournee` ≠ aujourd'hui ou un `statut` différent → invisible. Le frontend ne montre aucun message d'aide. |
| **F2** | « 201 tournées » sur `/agent/stats` | `frontend/.../StatsPage.jsx:59` + `service-routes/.../stats-repository.js:64-88` | Stats globales (toutes tournées DB), aucun filtre `id_agent`. Il faut un endpoint `GET /api/V1/routes/stats/agent/:id` ou filtrer via `x-user-id` |
| **F3** | « Conteneur non trouvé » sur scan d'un UID existant | `frontend/.../ScanResult.jsx:22` (correct) — souvent symptôme de **B5** quand on liste mais ici `getByUid` marche. Le user a confirmé que ça marche maintenant via la screenshot CNT-00002 | Probablement déjà corrigé par le commit du collègue (JOIN type/zone) |
| **F4** | Décalage du « Bonjour, MOUSSA » sous le header (mauvais placement) | `AgentDashboard.jsx:46` (`title=""`) + `MobileHeader.css` | Le header conserve sa hauteur même vide → greeting apparaît sous une barre blanche. Il faut soit injecter le greeting **dans** le header, soit cacher le header sur le dashboard |
| **F5** | « Retour à l'inscription » → page blanche | `frontend/src/App.jsx` (pas de route `/register`) + `pages/auth/TermsPage.jsx:8` + `PrivacyPage.jsx:8` | `RegisterPage.jsx` existe mais n'est pas monté |
| **F6** | Avatar profile « ne fonctionne pas » | `pages/mobile/shared/ProfilPage.jsx:36-39` | Aucune logique upload/affichage — c'est juste un `<i className="fa-user-circle">`. À implémenter via `/api/V1/avatars` (déjà mounté dans gateway) |
| **F7** | Settings « Badges » et « Système » non pertinents pour Agent | `pages/mobile/shared/NotificationSettings.jsx:49-67` | Badges/recompenses = gamification citoyen ; système = admin. À filtrer par rôle ou retirer |
| **F8** | Settings notifications uniquement en `localStorage` (pas persistées) | Idem `NotificationSettings.jsx:7-23` | Pas critique mais à brancher sur `/users/profile` ou `/notifications/preferences` |
| **F9** | « Conteneur » vs « Container » dans labels | UI déjà OK (vérifié : aucun `>Container<` dans `frontend/src`). Le fix doit venir du backend qui retourne `type_conteneur`/`zone_nom` (déjà fait dans commit `156e8ed`) | Vérifier que la chaîne `type_conteneur` est bien renvoyée par le repo |
| **F10** | Étape : `etape.adresse` toujours `undefined` | `EtapeDetail.jsx:64,110` + `tournee-repository.js:301-326` | Le repo ne sélectionne pas d'adresse (la table `conteneur` n'en a pas — seulement position GPS + `id_zone`). Soit afficher seulement `zone_nom`, soit ajouter un reverse-geocode |

### P2 — Qualité / robustesse

| # | Bug | Fichier | Cause |
|---|-----|---------|-------|
| **Q1** | `QRScanner.jsx` re-déclenche son `useEffect` à chaque render à cause de `[onScan, onError]` non memoizés côté parent | `components/mobile/QRScanner.jsx:47` | Caméra redémarre en boucle |
| **Q2** | `IMPLEMENTATION_MOBILE.md` mentionne route `/register` ajoutée — mais elle ne l'est pas | `docs/IMPLEMENTATION_MOBILE.md:64` | Doc fausse |
| **Q3** | `vite-plugin-pwa` installé mais **pas configuré** dans `vite.config.js` | `frontend/vite.config.js` | Le `dev-dist/` existe (généré ailleurs ?) mais la PWA n'est pas activée → pas d'install prompt mobile |
| **Q4** | `package.json` ajouté à la racine `ecotrack-sjma/` (`pg` + `qrcode`) | `ecotrack-sjma/package.json` | Pas nécessaire — `qrcode` doit rester dans `service-containers/package.json` (déjà ajouté). Risque de confusion |
| **Q5** | `/qr-generator.html` génère un QR contenant **uniquement l'UID** mais `ScanUniversal.jsx` accepte des URLs complètes — incohérent avec la nouvelle endpoint backend `/qrcode/:uid` qui génère une URL `/agent/scan/result/:uid` | `qr-generator.html` vs `container.route.js:25` | Choisir UNE convention (UID seul recommandé) et nettoyer |
| **Q6** | `dev-dist/` commité (artefacts de build) | `frontend/dev-dist/` | À mettre dans `.gitignore` |
| **Q7** | 2 `.DS_Store` non ignorés | racine projet | `.gitignore` à compléter |

---

## 3. Plan de correction (par PR)

### PR-1 — « unbreak the build » (P0, 30 min)

1. **Supprimer ou créer** les pages manquantes dans `App.jsx`. Recommandé : **supprimer** les 3 imports + routes `/qr-codes`, `/scan`, `/scan/result/:uid` car non aboutis. Si on veut garder le scan partagé : déplacer `ScanUniversal.jsx` → `pages/mobile/shared/ScanResult.jsx` et créer un `ScanPage.jsx` jumeau avec navigate `/scan/result/:uid`.
2. **Corriger `container-services.js`** : remplacer `result.data` → `result` aux lignes 116, 132, 148, 198. Supprimer la 2ᵉ déclaration `countContainers` (ligne 200) qui shadow celle avec cache.
3. **Dédupliquer `container.route.js`** : retirer le 2ᵉ bloc QR (lignes 577-606), garder uniquement le bloc public en haut. **Ajouter une ligne dans `api-gateway/src/index.js`** pour mounter `/api/V1/qrcode` ou changer le path en `/api/V1/containers/qrcode/:uid`.
4. **Remplacer le `Pool` ad-hoc** dans `container.route.js` par `req.app.locals.db` ou injection via DI déjà présente.
5. `npm run build` doit passer.

### PR-2 — Fix anomalies & affichage tournée agent (P0/P1, 2h)

1. **`AnomalieForm.jsx`** : changer payload pour matcher le schéma backend :
   ```js
   await reportAnomalie(tourneeId, {
     id_conteneur: form.id_conteneur,      // requis, doit être int positif
     type_anomalie: form.type,              // pas "type"
     description: form.description.trim(),
   });
   ```
   Forcer la sélection d'un conteneur (passer par `/scan` puis `/anomalie/form?container=ID`) avant de pouvoir soumettre. Retirer la valeur `AUTRE` (non supportée) ou l'ajouter au validator backend.
2. **`tournee-repository.findAgentTodayTournee`** : élargir la fenêtre temporelle ou ajouter un fallback :
   - Option A : si pas de `PLANIFIEE/EN_COURS` aujourd'hui, prendre la plus récente `PLANIFIEE` future.
   - Option B : ajouter un endpoint `/api/V1/routes/my-tournees` (liste) + dropdown sur le dashboard.
3. **`AgentDashboard.jsx`** : si pas de tournée → afficher un message d'aide explicite (« Vérifiez que votre `id_agent` correspond à une tournée du jour ») + bouton « Toutes mes tournées » → `/agent/historique`.
4. **Seed dédié** : créer `seeds/100_agent_moussa_tournee.sql` qui insère 1 tournée `PLANIFIEE` sur `CURRENT_DATE` pour l'agent connecté de test (id à parametrer via `--var agent_id=X`).

### PR-3 — Stats agent réelles + greeting + register (P1, 2h)

1. **Backend** : nouvel endpoint `GET /api/V1/routes/stats/agent` (lit `x-user-id`) qui renvoie :
   ```json
   { "total_tournees": 0, "total_collectes": 0, "taux_reussite_pct": 0,
     "distance_totale_km": 0, "total_anomalies": 0, "total_kg": 0,
     "co2_economise_kg": 0, "classement": null }
   ```
   Filtrage SQL `WHERE t.id_agent = $1` partout dans `stats-repository.getAgentKpis`.
2. **Frontend `StatsPage.jsx`** : remplacer `fetchKpis()` par `fetchAgentStats()`. Plus de « 201 tournées » fantômes.
3. **`AgentDashboard.jsx`** : retirer `title=""` et le bloc greeting séparé. Créer un `MobileHeader` variant (`<MobileHeader variant="greeting" prenom={...} date={...} />`) ou simplement passer le greeting comme `title` :
   ```jsx
   <MobileLayout title={`Bonjour, ${prenom}`} rightAction={...}>
   ```
   Et désactiver le `text-align: center` du header pour le rendre `flex-start` quand pas de back button.
4. **`App.jsx`** : monter `<Route path="/register" element={<RegisterPage />} />`. Vérifier que le RegisterPage actuel n'autorise pas de créer un GESTIONNAIRE/ADMIN (sinon RBAC backend doit refuser).

### PR-4 — Profil avatar + settings filtrées par rôle (P1, 3h)

1. **Avatar upload** dans `EditProfilPage.jsx` : ajouter input `<input type="file" accept="image/*">` → POST vers `/api/V1/avatars` (mounté dans gateway). Stocker URL dans `users.avatar_url`. Afficher dans `ProfilPage.jsx` via `<img src={user.avatar_url}>`. Fallback icône si null.
2. **`NotificationSettings.jsx`** : filtrer items selon `user.role` :
   - `AGENT` : Alertes, Tournées seulement.
   - `CITOYEN` : Alertes, Badges (futur).
   - `ADMIN` : tout + Système.
3. **Persistance** : créer `PUT /users/notification-prefs` côté `service-users` ; tomber en `localStorage` si offline.

### PR-5 — Robustesse + tests (P2, 4h)

1. **`QRScanner.jsx`** : memoize callbacks côté parent OU passer à `useEffect(..., [])` + `useRef` pour les callbacks.
2. **`vite.config.js`** : configurer `vite-plugin-pwa` (manifest, registerType: 'autoUpdate', workbox).
3. **`.gitignore`** : ajouter `**/.DS_Store`, `frontend/dev-dist/`, `*.zip`.
4. **Tests d'intégration backend** :
   - `service-routes/__tests__/integration/agent-tournee.test.js` : flow complet (création seed → my-tournee → collecte → terminer).
   - `service-routes/__tests__/integration/anomalie.test.js` : payload mobile (`type_anomalie`, `id_conteneur`).
   - `service-containers/__tests__/integration/scan-by-uid.test.js` : QR public + auth.
5. **Tests E2E frontend** (Vitest + jsdom) :
   - `__tests__/e2e/agent-dashboard.test.jsx` : mock `/api/V1/routes/my-tournee` → vérifier greeting + tournée affichée.
   - `__tests__/e2e/anomalie-form.test.jsx` : payload envoyé conforme.
   - `__tests__/e2e/scan-flow.test.jsx` : scan UID → résultat → collecte.

---

## 4. Plan de tests (manuel + automatisé)

### Sanity build (avant tout)
- [ ] `cd frontend && npm install && npm run build` → 0 erreur
- [ ] `cd frontend && npm run dev` → http://localhost:5173 charge `/login` sans erreur console

### Smoke test agent (après PR-1, PR-2)
| # | Action | Attendu |
|---|--------|---------|
| 1 | Se connecter en `AGENT` (compte MOUSSA) | Redirige `/agent` |
| 2 | Voir dashboard | Greeting présent, tournée du jour affichée OU message clair « pas de tournée » |
| 3 | Cliquer « Voir la tournée » | Liste des étapes apparaît |
| 4 | Cliquer une étape | Détails (zone, type, % remplissage) |
| 5 | « Naviguer » | Ouvre Google Maps |
| 6 | « Scanner » → saisir CNT-00002 | Affiche fiche conteneur (type + zone) |
| 7 | « Valider la collecte (45 kg) » | « +10 points » + retour à la tournée |
| 8 | « Signaler un problème » → remplir form → Envoyer | Toast succès + retour anomalies |
| 9 | Onglet « Anomalie » | Liste contient la nouvelle anomalie |
| 10 | Onglet « Stats » | Chiffres = celles de l'agent (pas 201) |
| 11 | Profil → Modifier avatar (PR-4) | Upload OK, image visible |
| 12 | Profil → Notifications settings | Pas de Badges/Système en AGENT |
| 13 | Profil → Conditions → « Retour à l'inscription » | Charge `/register` (pas blanc) |

### Tests backend (intégration)
```bash
# service-routes
cd services/service-routes && npm run test:integration

# service-containers
cd services/service-containers && npm run test:integration
```

### Tests frontend
```bash
cd frontend && npm run test:run
```

### Tests cross-services (curl)
```bash
# Stats agent (PR-3)
curl -H "x-user-id: 5" -H "x-user-role: AGENT" \
  http://localhost:3000/api/V1/routes/stats/agent

# QR public (PR-1)
curl -o qr.png http://localhost:3000/api/V1/containers/qrcode/CNT-00001

# Anomalie (PR-2)
curl -X POST http://localhost:3000/api/V1/routes/tournees/12/anomalie \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id_conteneur":3,"type_anomalie":"CONTENEUR_INACCESSIBLE","description":"test"}'
```

---

## 5. Améliorations recommandées (post-fix)

- **Notification réelle** sur nouvelle tournée assignée (Kafka topic `tournee.assigned` + WS push).
- **Mode offline** : queue des collectes/anomalies dans `IndexedDB`, sync à la reconnexion.
- **PWA install prompt** activée + icônes 192/512 dans `public/`.
- **Géolocalisation continue** pendant tournée : poll `/api/V1/routes/tournees/:id/position` toutes les 30 s pour le suivi temps réel sur le dashboard gestionnaire.
- **Photos** sur anomalie (upload via `/api/V1/avatars` ou bucket dédié).
- **Tests E2E Playwright** sur le flow complet (login → tournée → collecte → fin).

---

## 6. Pourquoi tant de bugs ? Leçons & process

| Cause | Mesure préventive |
|-------|-------------------|
| Pas de smoke test avant push | Ajouter une checklist PR (build + 3 clics manuels minimum) |
| Pas de CI sur la branche mobile | Activer GitHub Actions : `lint + build + test:run` sur push |
| Refactor cache fait sans grep des callers | Conventions de release : changements d'API → grep + test:run avant commit |
| Front et back développés en parallèle sans contrat partagé | Documenter les payloads dans Swagger (déjà installé) **et** dans `tourneeService.js` (JSDoc) |
| Pas de seed agent par défaut | Ajouter une étape `make seed-agent` qui crée user agent + tournée du jour |
| Code commité avec doublons (route QR, méthode `countContainers`) | Activer ESLint `no-duplicate-case`, lint pre-commit |

---

## 7. Action immédiate recommandée

1. **PR-1 (urgent, < 1h)** — débloque le build pour permettre tests.
2. **Manuel test après PR-1** par Sidi + Moussa ensemble (15 min).
3. **PR-2** — l'anomalie et la tournée doivent fonctionner sinon la démo ne tient pas.
4. **PR-3 → PR-5** — au fil de l'eau cette semaine.

Ordre de priorité respecté : on ne touche **pas** au citoyen tant que l'autre dev n'a pas pushé. Quand sa branche apparaîtra, on pourra retirer les composants `shared/` non utilisés (NotificationSettings filtrée, ProfilPage avec `basePath`).

---

## Annexe — Liens utiles

- PR mobile : https://github.com/Gusly007/ecotrack-sjma/pull/35
- Commits à reviewer en détail :
  - `156e8ed` (QR + cache + PWA dev artifacts)
  - `4cced1c` (USER_GUIDE.md + diagrammes)
  - `7045efb` (suppression phase 2 citoyen)
  - `fc9614d` (déplacement IMPLEMENTATION_MOBILE.md)
- Doc backend : `services/service-routes/src/routes/*.js` (Swagger sur `:3012/api-docs`)
- Doc QR/PWA : `docs/README_QR_PWA.md`
- Guide utilisateur : `docs/USER_GUIDE.md`
