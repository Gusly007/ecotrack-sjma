# Audit de l'espace gestionnaire EcoTrack

**Date de l'audit :** 12 octobre 2026  
**Périmètre :** frontend React, routes gestionnaire, services API associés, démarrage Docker et revue visuelle desktop  
**Statut :** audit réalisé, corrections prioritaires appliquées

---

## 1. Résumé exécutif

L'espace gestionnaire est déjà relativement complet. Les principaux modules métier sont présents :

- tableau de bord opérationnel ;
- gestion des tournées ;
- suivi temps réel ;
- zones ;
- conteneurs ;
- KPIs ;
- signalements ;
- maintenance ;
- rapports ;
- notifications ;
- profil gestionnaire.

La stack Docker démarre correctement et le build frontend passe. Les principaux points à traiter sont toutefois les suivants :

1. les routes gestionnaire ne vérifient pas explicitement le rôle `GESTIONNAIRE` ;
2. certaines erreurs API sont masquées et produisent des écrans à zéro ;
3. le bandeau cookies peut bloquer visuellement l'application lorsque l'API de consentement est indisponible ;
4. deux architectures de layout et plusieurs mécanismes de notification coexistent ;
5. le lint et les tests sont actuellement bloqués par des problèmes de configuration et de compatibilité Node ;
6. plusieurs incohérences visuelles et linguistiques subsistent.

### Corrections appliquées après l'audit

- contrôle explicite du rôle `GESTIONNAIRE` sur les routes gestionnaire ;
- redirection des URLs gestionnaire inconnues vers `/gestionnaire` ;
- affichage d'un avertissement lorsque le tableau de bord ne peut pas être actualisé ;
- affichage d'un avertissement lorsque le suivi temps réel reçoit des réponses partielles ;
- mémorisation locale du consentement cookies pour éviter de bloquer l'application hors connexion ;
- correction de deux libellés encodés incorrectement sur la page 403.

Les éléments restants sont listés dans le plan de correction de la section 8.

---

## 2. Périmètre audité

### Fichiers structurants

- [App.jsx](<frontend/src/App.jsx>) : routes applicatives ;
- [ProtectedRoute.jsx](<frontend/src/components/common/ProtectedRoute.jsx>) : protection et contrôle des rôles ;
- [DesktopLayout.jsx](<frontend/src/components/desktop/DesktopLayout.jsx>) : layout desktop actif ;
- [RoleBasedLayout.jsx](<frontend/src/components/desktop/RoleBasedLayout.jsx>) : sélection du layout desktop ;
- [menuData.js](<frontend/src/components/desktop/menuData.js>) : menus admin et gestionnaire ;
- [dashboardService.js](<frontend/src/services/dashboardService.js>) : données du tableau de bord ;
- [tourneeService.js](<frontend/src/services/tourneeService.js>) : données et actions liées aux tournées.

### Pages gestionnaire

- [GestionnaireDashboard.jsx](<frontend/src/pages/desktop/gestionnaire/GestionnaireDashboard.jsx>) ;
- [tournee.jsx](<frontend/src/pages/desktop/gestionnaire/tournee.jsx>) ;
- [SuiviTempsReelPage.jsx](<frontend/src/pages/desktop/gestionnaire/SuiviTempsReelPage.jsx>) ;
- [KpiPage.jsx](<frontend/src/pages/desktop/gestionnaire/KpiPage.jsx>) ;
- [MaintenancePage.jsx](<frontend/src/pages/desktop/gestionnaire/MaintenancePage.jsx>) ;
- [RapportsPage.jsx](<frontend/src/pages/desktop/gestionnaire/RapportsPage.jsx>).

### Composants et styles

- [GestionnaireLayout.jsx](<frontend/src/components/desktop/gestionnaire/GestionnaireLayout.jsx>) ;
- [Sidebar.jsx](<frontend/src/components/desktop/gestionnaire/Sidebar.jsx>) ;
- [GestionnaireDashboard.css](<frontend/src/pages/desktop/gestionnaire/GestionnaireDashboard.css>) ;
- [GestionnaireLayout.css](<frontend/src/components/desktop/gestionnaire/GestionnaireLayout.css>) ;
- [Sidebar.css](<frontend/src/components/desktop/gestionnaire/Sidebar.css>).

---

## 3. État global par domaine

| Domaine | État |
|---|---|
| Structure générale | Fonctionnelle |
| Routes gestionnaire | Présentes, mais contrôle de rôle incomplet |
| Tableau de bord | Fonctionnel, gestion des erreurs à améliorer |
| Gestion des tournées | Fonctionnalité riche et structurée |
| Suivi temps réel | Fonctionnel, erreurs trop silencieuses |
| KPIs | Fonctionnel avec gestion partielle des erreurs |
| Maintenance | Fonctionnelle, mapping métier à confirmer |
| Rapports | Fonctionnel côté frontend, persistance à confirmer |
| Notifications | Fonctionnelles mais dupliquées et hétérogènes |
| Build frontend | Réussi |
| Lint | Échec, 112 problèmes remontés |
| Tests frontend | Bloqués par une incompatibilité ESM/Node |
| Stack Docker | Démarrée avec succès |
| Revue visuelle desktop | Fonctionnelle sur écran large, finitions nécessaires |

---

## 4. Constats prioritaires

## 4.1. Critique — contrôle de rôle insuffisant sur les routes gestionnaire

Les routes gestionnaire utilisent actuellement uniquement :

```jsx
<ProtectedRoute>
```

Elles ne précisent pas explicitement :

```jsx
<ProtectedRoute requiredRole="GESTIONNAIRE">
```

Le composant [ProtectedRoute.jsx](<frontend/src/components/common/ProtectedRoute.jsx>) sait pourtant gérer la propriété `requiredRole`.

### Routes concernées

- `/gestionnaire`
- `/gestionnaire/tournees`
- `/gestionnaire/suivi`
- `/gestionnaire/zones`
- `/gestionnaire/conteneurs`
- `/gestionnaire/signalements`
- `/gestionnaire/signalements/:id`
- `/gestionnaire/kpis`
- `/gestionnaire/rapports`
- `/gestionnaire/maintenance`
- `/gestionnaire/notifications`

### Impact

Tout utilisateur authentifié pourrait potentiellement atteindre directement l'interface gestionnaire depuis le frontend, même si certaines API backend sont protégées.

### Recommandation

Utiliser :

```jsx
<ProtectedRoute requiredRole="GESTIONNAIRE">
```

Pour les écrans qui doivent être partagés avec l'administrateur :

```jsx
<ProtectedRoute requiredRole={['GESTIONNAIRE', 'ADMIN']}>
```

La protection backend reste indispensable ; la protection frontend améliore également le comportement utilisateur et évite l'affichage de menus inappropriés.

---

## 4.2. Élevé — erreurs API masquées sur le tableau de bord

Dans [GestionnaireDashboard.jsx](<frontend/src/pages/desktop/gestionnaire/GestionnaireDashboard.jsx>), les erreurs de chargement sont ignorées :

```jsx
} catch (err) {
  // Silent fail to keep dashboard visible with last valid data
}
```

### Comportement observé

Lorsque l'API est indisponible :

- les statistiques peuvent afficher `0` ;
- les alertes peuvent afficher `0` ;
- les tableaux restent vides ;
- aucune information claire n'indique que les données sont indisponibles ;
- l'écran peut donner l'impression qu'il n'y a réellement aucune activité.

### Risque métier

Le gestionnaire peut interpréter une panne réseau ou backend comme :

- aucune tournée active ;
- aucun agent terrain ;
- aucune alerte ;
- aucune collecte.

### Recommandation

Conserver les dernières données valides, mais afficher un état explicite :

> Les données n'ont pas pu être actualisées. Les valeurs affichées peuvent être obsolètes.

Il faut distinguer visuellement :

1. données réellement à zéro ;
2. données indisponibles ;
3. chargement en cours ;
4. erreur de connexion.

Le même point concerne [SuiviTempsReelPage.jsx](<frontend/src/pages/desktop/gestionnaire/SuiviTempsReelPage.jsx>).

---

## 4.3. Élevé — bandeau cookies bloquant

Le composant [CookieBanner.jsx](<frontend/src/components/common/CookieBanner.jsx>) affiche le bandeau lorsque l'API de consentement ne répond pas.

Pendant l'audit, le bandeau :

- recouvrait une partie importante de l'écran ;
- empêchait une utilisation normale de l'interface ;
- restait présent lorsque l'API `/api/V1/cookies/consent` était indisponible ;
- pouvait laisser les boutons désactivés pendant la tentative réseau.

### Recommandation

Le consentement doit pouvoir être conservé localement si l'API n'est pas disponible :

```js
localStorage.setItem('cookieConsent', 'accepted');
setShowBanner(false);
```

L'enregistrement backend peut être retenté ultérieurement, mais il ne doit pas bloquer toute l'application.

---

## 4.4. Moyen — double architecture de layout

Deux architectures coexistent :

### Ancienne architecture gestionnaire

- [GestionnaireLayout.jsx](<frontend/src/components/desktop/gestionnaire/GestionnaireLayout.jsx>) ;
- [Sidebar.jsx](<frontend/src/components/desktop/gestionnaire/Sidebar.jsx>) ;
- [GestionnaireLayout.css](<frontend/src/components/desktop/gestionnaire/GestionnaireLayout.css>).

### Architecture actuellement utilisée par les routes

- [RoleBasedLayout.jsx](<frontend/src/components/desktop/RoleBasedLayout.jsx>) ;
- [DesktopLayout.jsx](<frontend/src/components/desktop/DesktopLayout.jsx>) ;
- [menuData.js](<frontend/src/components/desktop/menuData.js>).

### Risques

- styles divergents ;
- corrections appliquées au mauvais composant ;
- navigation différente selon le chemin utilisé ;
- gestion des notifications dupliquée ;
- maintenance plus difficile.

### Recommandation

Choisir une architecture unique. L'architecture active doit être documentée et l'ancienne doit être supprimée ou marquée comme dépréciée.

---

## 4.5. Moyen — gestion des notifications dupliquée

Les notifications sont initialisées à plusieurs niveaux :

- [RoleBasedLayout.jsx](<frontend/src/components/desktop/RoleBasedLayout.jsx>) ;
- [DesktopLayout.jsx](<frontend/src/components/desktop/DesktopLayout.jsx>) ;
- [GestionnaireLayout.jsx](<frontend/src/components/desktop/gestionnaire/GestionnaireLayout.jsx>).

### Risques

- connexions WebSocket ou mécanismes de polling en double ;
- compteurs incohérents ;
- appels réseau inutiles ;
- effets sonores dupliqués ;
- comportement différent entre les écrans.

### Recommandation

Centraliser la gestion dans un seul provider ou dans [DesktopLayout.jsx](<frontend/src/components/desktop/DesktopLayout.jsx>).

---

## 4.6. Moyen — route joker masquant les URLs inconnues

La route suivante existe :

```jsx
<Route path="/gestionnaire/*">
  <GestionnaireDashboard />
</Route>
```

Une URL invalide comme `/gestionnaire/test-inexistant` peut donc afficher le tableau de bord au lieu d'une page 404.

### Recommandation

Remplacer ce comportement par :

- une page 404 ;
- ou une redirection explicite vers `/gestionnaire`.

---

## 4.7. Moyen — endpoints de notifications hétérogènes

Le dashboard utilise notamment :

```text
/notifications?limit=5
```

Le layout utilise :

```text
/api/V1/notifications/list
/api/V1/notifications/unread/count
```

Cette différence est visible entre [dashboardService.js](<frontend/src/services/dashboardService.js>) et [DesktopLayout.jsx](<frontend/src/components/desktop/DesktopLayout.jsx>).

### Risques

- formats de réponse différents ;
- compteur différent de la liste ;
- dashboard vide alors que le menu affiche des notifications ;
- dépendance à plusieurs conventions backend.

### Recommandation

Définir un service de notifications unique avec :

- une convention d'URL ;
- un format de réponse ;
- une gestion commune des erreurs ;
- une fonction commune de comptage des non-lues.

---

## 5. Audit fonctionnel par écran

## 5.1. Tableau de bord

### Fonctionnalités présentes

- tournées actives ;
- agents terrain ;
- conteneurs collectés ;
- alertes en attente ;
- collecte par zone ;
- tableau des tournées en cours ;
- auto-refresh ;
- rafraîchissement manuel ;
- affichage de l'heure de dernière mise à jour.

### Points positifs

- bonne organisation par panneaux ;
- informations métier pertinentes ;
- composants réutilisables ;
- auto-refresh visible ;
- affichage synthétique adapté à une supervision opérationnelle.

### Points à améliorer

- erreurs silencieuses ;
- distinction insuffisante entre vide et indisponible ;
- absence d'indicateur réseau ;
- état de chargement du tableau parfois ambigu ;
- absence de message de données obsolètes.

## 5.2. Tournées

### Fonctionnalités présentes

- liste des tournées ;
- recherche ;
- filtres par statut ;
- statistiques globales ;
- création de tournée ;
- chargement des zones, agents, véhicules et types ;
- prévisualisation d'itinéraire ;
- optimisation 2-opt ;
- auto-refresh ;
- gestion des erreurs de création.

### Points positifs

- processus de création riche ;
- validation des champs obligatoires ;
- prévisualisation avant création ;
- timeout dédié aux opérations d'optimisation ;
- messages d'erreur métier présents.

### Points à surveiller

- la création dépend de plusieurs référentiels ;
- certains champs sont obligatoires à la soumission mais pas à la prévisualisation ;
- plusieurs libellés sont sans accents ;
- la cohérence des statuts frontend/backend doit rester garantie.

## 5.3. Suivi temps réel

### Fonctionnalités présentes

- statistiques des tournées ;
- progression moyenne ;
- tournées dépassant 80 % ;
- carte des tournées actives ;
- liste des agents actifs ;
- focus d'une tournée sur la carte ;
- auto-refresh ;
- limitation du rafraîchissement manuel à cinq secondes.

### Points positifs

- liaison entre la liste et la carte ;
- possibilité de recentrer une tournée ;
- seuil métier explicite ;
- composants dédiés au suivi opérationnel.

### Points à améliorer

- erreurs silencieuses ;
- absence d'état visible en cas d'échec de la carte ;
- confusion possible entre aucune tournée active et API indisponible.

## 5.4. KPIs

### Fonctionnalités présentes

- taux de débordement ;
- distance moyenne par jour ;
- carburant économisé ;
- CO2 réduit ;
- évolution du remplissage ;
- répartition par zone ;
- rafraîchissement manuel ;
- gestion des réponses partielles.

### Point positif

La page KPIs utilise `Promise.allSettled` et avertit l'utilisateur lorsque certaines catégories de données sont indisponibles.

### Point à améliorer

Les données de zone et les états de chargement doivent être vérifiés avec un jeu de données réel et représentatif.

## 5.5. Maintenance

### Fonctionnalités présentes

- liste des interventions ;
- priorités ;
- statuts ;
- recherche ;
- sélection d'une intervention ;
- assignation à un agent ;
- planification ;
- métriques opérationnelles.

### Point positif

Le tri par urgence est clairement défini et adapté à un contexte opérationnel.

### Point à confirmer

La page utilise les signalements comme source des interventions. Il faut confirmer que ce mapping correspond bien au modèle métier attendu et qu'il ne mélange pas :

- signalement citoyen ;
- incident technique ;
- anomalie agent ;
- intervention de maintenance.

## 5.6. Rapports

### Fonctionnalités présentes

- rapport mensuel complet ;
- performance des tournées ;
- impact environnemental ;
- export PDF ;
- export CSV ;
- sélection de période ;
- dates personnalisées ;
- historique des exports ;
- téléchargement d'un rapport récent.

### Point à confirmer

L'historique semble géré côté frontend via `reportService`. Il peut donc être propre au navigateur et non partagé entre plusieurs gestionnaires.

---

## 6. Audit visuel

## 6.1. Points positifs

- interface claire sur un écran desktop large ;
- sidebar fixe facilement identifiable ;
- topbar distincte ;
- cartes KPI homogènes ;
- hiérarchie visuelle lisible ;
- couleurs cohérentes entre indicateurs positifs, alertes et informations ;
- présence d'actions de rafraîchissement visibles.

## 6.2. Incohérences visuelles relevées

### Sidebar dense

La sidebar contient beaucoup d'entrées :

- six modules opérationnels ;
- trois modules de gestion ;
- notifications ;
- profil.

Sur une fenêtre plus petite, cela peut générer :

- un scroll vertical fréquent ;
- une perte de repères ;
- une surcharge cognitive ;
- une difficulté à distinguer supervision et configuration.

### Libellés sans accents

Plusieurs textes apparaissent sans accents :

- `Tournees` ;
- `Tournees actives` ;
- `Rafraichir` ;
- `Generer` ;
- `Resolus` ;
- `Periode` ;
- `A traiter`.

Cette variation donne une impression d'interface incomplètement finalisée.

### États vides trop neutres

Les panneaux vides sont principalement blancs et peu explicites. Il faut différencier :

- état nominal sans élément ;
- absence de données ;
- chargement ;
- erreur réseau ;
- données obsolètes.

### Bandeau cookies trop intrusif

Le bandeau inférieur recouvre une grande partie de l'écran et devient prioritaire sur les informations métier.

### Boutons icon-only

Les boutons comportant uniquement une icône doivent systématiquement disposer :

- d'un `aria-label` ;
- d'un `title` ou tooltip cohérent ;
- d'un état de focus visible ;
- d'une taille compatible avec l'accessibilité.

### Responsive à vérifier

Une passe dédiée doit être effectuée sur :

- écran 1366 px ;
- écran inférieur à 1024 px ;
- tablette ;
- sidebar repliée ;
- tableaux larges ;
- modale de création de tournée ;
- carte du suivi temps réel.

---

## 7. Vérifications techniques

## 7.1. Build frontend

Le build de production passe :

```text
vite build
452 modules transformed
```

### Avertissement

La version locale était :

```text
Node.js 20.17.0
```

Vite demande :

```text
Node.js 20.19+ ou 22.12+
```

### Recommandation

Mettre à jour Node.js avant de considérer le build et les tests comme totalement certifiés.

## 7.2. Lint

Le lint échoue avec :

```text
112 problèmes
98 erreurs
14 avertissements
```

Les problèmes proviennent notamment de :

- fichiers générés dans `dev-dist` ;
- scripts Node analysés comme du code navigateur ;
- règles TypeScript référencées mais non installées ;
- fichiers de test ;
- variables inutilisées ;
- globals non déclarés.

### Recommandation

Nettoyer la configuration ESLint :

1. exclure `dev-dist` et les artefacts générés ;
2. séparer le lint frontend du lint des scripts Node ;
3. supprimer ou installer les règles TypeScript réellement utilisées ;
4. traiter les erreurs du code source applicatif ;
5. ajouter une vérification CI dédiée.

## 7.3. Tests frontend

Vitest ne démarre pas correctement avec l'environnement actuel.

Erreur principale :

```text
ERR_REQUIRE_ESM
require() of ES Module @exodus/bytes ...
```

Le problème concerne la combinaison :

- Node 20.17.0 ;
- Vitest récent ;
- jsdom récent ;
- dépendances ESM/CJS incompatibles.

### Recommandation

1. mettre à jour Node.js ;
2. supprimer puis restaurer les dépendances avec le lockfile ;
3. relancer les tests ciblés ;
4. vérifier ensuite la suite complète.

## 7.4. Stack Docker

La stack Docker a démarré avec succès.

Services actifs observés :

- frontend ;
- API Gateway ;
- service users ;
- service routes ;
- service containers ;
- service analytics ;
- service notifications ;
- service gamifications ;
- service IoT ;
- PostgreSQL ;
- Redis ;
- Kafka ;
- Grafana ;
- Prometheus ;
- PgAdmin.

Les migrations se sont terminées correctement :

```text
Exited (0)
```

Accès utilisés :

- frontend : [http://localhost:5173/ecotrack-sjma/](http://localhost:5173/ecotrack-sjma/) ;
- API Gateway : `http://localhost:3000` ;
- Grafana : `http://localhost:3001` ;
- Prometheus : `http://localhost:9090` ;
- PgAdmin : `http://localhost:5050`.

## 7.5. Authentification de démonstration

Le compte de démonstration gestionnaire existe :

```text
Email : gestionnaire@ecotrack.local
Mot de passe : password123
Rôle : GESTIONNAIRE
```

La première connexion impose toutefois une configuration MFA.

---

## 8. Plan de correction recommandé

### Priorité 1 — sécurité et fiabilité

1. Ajouter `requiredRole="GESTIONNAIRE"` aux routes gestionnaire.
2. Vérifier les routes partagées avec `ADMIN`.
3. Afficher les erreurs API sur le dashboard.
4. Afficher un état d'indisponibilité sur le suivi temps réel.
5. Rendre le bandeau cookies non bloquant en cas d'échec API.
6. Mettre à jour Node.js.

### Priorité 2 — cohérence technique

7. Unifier les layouts desktop.
8. Centraliser les notifications.
9. Unifier les endpoints et formats de notifications.
10. Nettoyer la configuration ESLint.
11. Corriger la configuration Vitest/jsdom.
12. Ajouter des tests de protection de routes par rôle.

### Priorité 3 — qualité fonctionnelle et visuelle

13. Remplacer la route joker par une page 404 ou une redirection explicite.
14. Corriger les libellés français et les accents.
15. Améliorer les états vides et les états hors connexion.
16. Vérifier les attributs d'accessibilité des boutons icon-only.
17. Vérifier le responsive des tableaux et modales.
18. Confirmer le modèle métier de la maintenance.
19. Confirmer la persistance attendue des rapports.

---

## 9. Conclusion

La base fonctionnelle de l'espace gestionnaire est solide et couvre les besoins opérationnels principaux. Le projet est exécutable, le build frontend passe et la stack Docker démarre.

Les corrections les plus urgentes concernent :

1. le contrôle explicite des rôles ;
2. la visibilité des erreurs réseau ;
3. le comportement bloquant du bandeau cookies ;
4. la mise à niveau de l'environnement Node ;
5. la simplification des layouts et notifications.

Une deuxième passe d'audit devra être réalisée après correction afin de vérifier :

- les accès par rôle ;
- les états hors connexion ;
- les données réelles du gestionnaire ;
- le responsive ;
- l'accessibilité ;
- la non-régression des tests.
