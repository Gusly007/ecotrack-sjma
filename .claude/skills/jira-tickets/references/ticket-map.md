# Correspondance plan V2 ↔ Jira

Mettre à jour à chaque création. « Plan » = identifiant dans `ecotrack-sjma/PLAN_SPRINT_V2.md`. Prochain identifiant libre côté plan : **V2-083**. Sprint 0 = lot visuel ; Sprint 1 = gate sécurité et production ; anciens sprints 1 à 4 = sprints 2 à 5.

## Créés le 2026-10-13 : gate sécurité et production (déplacés le soir même vers « SCRUM Sprint 1 », id 1, étiquette `sprint1`)

SCRUM-5 à SCRUM-13 et SCRUM-15 (V2-001 à V2-009 et V2-011). SCRUM-14 et SCRUM-16 à SCRUM-19 (V2-010, V2-012 à V2-015) sont restés en « SCRUM Sprint 0 ».

| Jira | Plan | Priorité | Titre |
|---|---|---|---|
| SCRUM-5 | V2-001 | Highest | Fermer POST /auth/register : forcer le rôle CITOYEN (ou réserver à ADMIN) |
| SCRUM-6 | V2-002 | Highest | Sécuriser /auth/mfa/regenerate et /auth/mfa/complete-setup |
| SCRUM-7 | V2-003 | Highest | Ajouter requirePermission sur PUT /signalements/:id, /status et /traitement |
| SCRUM-8 | V2-004 | Highest | RBAC frontend : requiredRole sur /admin/*, /gestionnaire/* et /citoyen/* |
| SCRUM-9 | V2-005 | High | RBAC backend collecte/stats/optimisation + propriété de la tournée |
| SCRUM-10 | V2-006 | Highest | Rétablir le Cloud Run api-gateway (503) et valider le smoke test |
| SCRUM-11 | V2-007 | Highest | Ajouter service-routes, Redis et ROUTES_SERVICE_URL à docker-compose.prod.yml |
| SCRUM-12 | V2-008 | High | Supprimer frontend/public/login.html |
| SCRUM-13 | V2-009 | High | Rendre la CI bloquante (40 continue-on-error) et inclure le périmètre Agent dans ESLint |
| SCRUM-14 | V2-010 | High | Route globale « * » (404), page /unauthorized corrigée, jokers remplacés |
| SCRUM-15 | V2-011 | High | Retirer les console.log de jetons (MfaPage) et corriger l'énumération de comptes |
| SCRUM-16 | V2-012 | High | Bouton « Passer » : marquer l'étape ignorée et avancer |
| SCRUM-17 | V2-013 | High | Validation de collecte : message d'erreur et bouton désactivé sans tournée active |
| SCRUM-18 | V2-014 | High | Dashboard agent : heure de départ et progression réelles |
| SCRUM-19 | V2-015 | High | Rendre l'historique des tournées accessible |

## Ajoutés le 2026-10-13 (soir) : corrections du second passage Gestionnaire, étiquette `quickwin` (sprint « SCRUM Sprint 0 »)

| Jira | Plan | Priorité | Titre |
|---|---|---|---|
| SCRUM-20 | V2-067 | Medium | Notifications desktop : un seul compteur/polling et un format de priorité unique |
| SCRUM-21 | V2-068 | Medium | Notifications hors rôle : ne pas envoyer les « Badge débloqué » au gestionnaire |
| SCRUM-22 | V2-069 | Low | Titre d'en-tête correct sur /profile et sur la fiche signalement |
| SCRUM-23 | V2-070 | Medium | En-tête et sidebar : aria-label/title sur les boutons icône |
| SCRUM-24 | V2-071 | Medium | Identifiant de tournée unique à l'affichage (code vs T-id) et préfixe conteneur |
| SCRUM-25 | V2-072 | Medium | Création de tournée : heure de départ par défaut dans le futur |
| SCRUM-26 | V2-073 | Low | Modale de création de tournée : boutons visibles à 768 px |
| SCRUM-27 | V2-074 | Medium | Mon compte gestionnaire/admin : texte citoyen et suppression de compte |
| SCRUM-28 | V2-075 | Low | KPIs : graphique des 30 jours et seuils de couleur |

Si la capacité du Sprint 0 manque, ce sont les premiers à reporter (voir `PLAN_SPRINT_V2.md` §5).

## Ajoutés le 2026-10-13 (nuit) : corrections du second passage Citoyen (sprint « SCRUM Sprint 0 »)

| Jira | Plan | Priorité | Titre |
|---|---|---|---|
| SCRUM-29 | V2-076 | Highest | Gateway : réparer le routage vers service-gamifications et service-users (regex sans « V1 ») |
| SCRUM-30 | V2-077 | Medium | Écran de succès du signalement : points réellement crédités et numéro de ticket identique (`quickwin`) |
| SCRUM-31 | V2-078 | Medium | Formulaire de signalement : identifiant introuvable = erreur claire (`quickwin`) |
| SCRUM-32 | V2-079 | Low | Carte citoyen : boutons de zoom et onglet « Profil » (`quickwin`) |
| SCRUM-33 | V2-080 | Medium | Layout citoyen : bande blanche de 72 px (`quickwin`) |
| SCRUM-34 | V2-081 | Medium | Accueil citoyen : appels API émis deux fois (`quickwin`) |
| SCRUM-35 | V2-082 | Low | Barre de navigation citoyen : « Défis » avec accent (`quickwin`) |

V2-076 n'est pas `quickwin` : c'est une correction Critique à ne pas reporter.

## Rapatriés au Sprint 0 (lot visuel) le 2026-10-13 (nuit, suite)

| Jira | Plan | Priorité | Titre |
|---|---|---|---|
| SCRUM-36 | V2-017 | High | Bandeau cookies non bloquant |
| SCRUM-37 | V2-026 | High | Carte : vrais taux de remplissage (ou « Niveau inconnu ») |
| SCRUM-38 | V2-043 | Medium | Pages partagées Zones/Conteneurs : bouton qui masque le titre, droits du gestionnaire |
| SCRUM-39 | V2-052 | Medium | Accents et encodage sur toute l'interface |

## Parents du Sprint 0 (réorganisation de l'équipe, constatée le 2026-10-18)

Les 25 tickets du lot visuel sont des `Subtask` de 4 tickets parents de type `Tâche`, un par zone. Répartition vérifiée dans Jira le 2026-10-24.

| Parent | Zone | Assigné à | Sous-tâches |
|---|---|---|---|
| SCRUM-40 | Citoyen | Moussa | SCRUM-30 à SCRUM-35, SCRUM-37 |
| SCRUM-41 | Gestionnaire | Sidi | SCRUM-20 à SCRUM-28, SCRUM-36, SCRUM-38 |
| SCRUM-42 | Agent | Ali | SCRUM-16 à SCRUM-19 |
| SCRUM-43 | Transverse | Gusly | SCRUM-14, SCRUM-29, SCRUM-39 |

SCRUM-36 (bandeau cookies, « Tous les rôles » dans le plan) est rangé sous Gestionnaire.

## Pas encore créés dans Jira

V2-016, V2-018 à V2-025, V2-027 à V2-042, V2-044 à V2-051, V2-053 à V2-066 (sprints 2 à 5), voir `PLAN_SPRINT_V2.md` §5 et §6.

## Hors plan

SCRUM-1 à SCRUM-4 : tickets d'exemple du modèle de projet (« Tâche 1 », « Tâche 2 », « Tâche 3 », « Sous-tâche 2.1 »). SCRUM-1 et SCRUM-2 sont dans le Sprint 0 : les exclure des comptes du lot.
