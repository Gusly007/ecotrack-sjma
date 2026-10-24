---
name: jira-tickets
description: Rédiger et créer des tickets Jira pour EcoTrack (projet SCRUM) via le MCP Atlassian, avec le format, les labels, les priorités et le rattachement au sprint de l'équipe. À utiliser dès qu'on demande de créer, écrire, mettre à jour ou ranger un ticket / une tâche / un bug / un sprint Jira, d'importer un lot de tickets depuis PLAN_SPRINT_V2.md, ou de transformer un constat d'audit en ticket.
---

# Tickets Jira EcoTrack

Ce skill est **vivant** : à la fin de chaque session où une convention, un piège ou une décision change, mets-le à jour (voir « Mettre ce skill à jour »).

## Contexte fixe

| Élément | Valeur |
|---|---|
| Site | `jngusly.atlassian.net`, cloudId `c08dccbd-0585-4b29-9796-9feeb7fd3051` (revérifier avec `getAccessibleAtlassianResources` si un appel échoue) |
| Projet | `SCRUM` « ecotrack » (team-managed), board `1` « SCRUM board » |
| Types de ticket | `Tâche` (par défaut), `Feature`, `Epic`, `Subtask`. **Pas de type Bug** : un défaut est une `Tâche` |
| Priorités | Highest, High, Medium, Low (équivalence plan : Critique→Highest, Haute→High, Moyenne→Medium, Basse→Low) |
| Statuts | Idée → À faire → En cours → En cours de revue → Terminé. Un ticket créé est en « Idée » (défaut du projet) ; ceux d'un sprint actif sont en « À faire ». Ne changer un statut que sur demande |
| Transitions (`transitionId`) | Idée `11` · À faire `21` · En cours `31` · En cours de revue `41` · Terminé `51` (vérifiables avec `listJiraIssueTransitions`) |
| Sprints | « SCRUM Sprint 0 » (id 2, actif) = **lot visuel** ; « SCRUM Sprint 1 » (id 1, futur) = **gate sécurité et production**. Vérifier avec `listJiraBoardSprints` (boardId 1) avant d'y rattacher |
| Langue | Français, avec accents |

Source de vérité du backlog : `ecotrack-sjma/PLAN_SPRINT_V2.md` (détail dans la section 6) et `ecotrack-sjma/PLAN_SPRINT_V2_jira.csv`. Correspondance déjà créée : [references/ticket-map.md](references/ticket-map.md).

## Outils (MCP Atlassian)

Charger les schémas avec ToolSearch (`select:` sur les noms ci-dessous) si ce n'est pas déjà fait.

- Créer : `createJiraIssue` (accepte `assignToSprint` en id numérique, nom exact ou `"active"`).
- Chercher / dédoublonner : `searchJiraIssuesUsingJql`.
- Modifier : `editJiraIssue`. Changer de statut : `transitionJiraIssue` avec le `transitionId` du tableau ci-dessus (liste à jour : `executeRead` sur `listJiraIssueTransitions`).
- Tout le reste (boards, sprints, utilisateurs assignables, types) : `discover` avec une `query`, puis `executeRead` / `executeWrite` avec le `name` trouvé.
- `cloudId` doit être passé **explicitement** à chaque appel.

## Procédure

1. **Cadrer.** D'où vient le ticket : une ligne de `PLAN_SPRINT_V2.md` (reprendre son texte, ne pas le réécrire), un nouveau constat, un bug remonté ? Un constat d'audit nouveau reçoit le prochain `V2-0NN` libre (voir `references/ticket-map.md`).
2. **Dédoublonner.** `searchJiraIssuesUsingJql` sur `project = SCRUM AND (summary ~ "mot-clé" OR labels = ...)` avant de créer. Le titre commence par `[V2-0NN]`, donc chercher aussi cet identifiant.
3. **Prévisualiser et faire valider.** Montrer à l'utilisateur la liste (clé V2, titre, priorité, labels, sprint cible). **Ne créer qu'après un accord explicite** : les tickets sont visibles de toute l'équipe et la suppression est destructive. Un lot validé une fois ne couvre pas un lot suivant.
4. **Créer.** Un appel `createJiraIssue` par ticket. Faire un premier ticket, vérifier la réponse (`sprintAssignment.assigned: true`), puis lancer le reste en parallèle. Si le rattachement au sprint échoue, le ticket existe déjà : ne pas le recréer, corriger avec `executeWrite` / `manageJiraSprint addIssues`.
5. **Vérifier.** `searchJiraIssuesUsingJql` sur le label du lot : bon nombre, bonnes priorités.
6. **Tracer.** Ajouter les nouvelles lignes dans `references/ticket-map.md`. Ne modifie pas `PLAN_SPRINT_V2.md` sans que l'utilisateur le demande.
7. **Commits liés.** La clé `SCRUM-xx` du ticket va dans le titre des commits et dans le nom de branche : voir le skill `git-commits`.

## Format d'un ticket

**Titre :** `[V2-0NN] Verbe à l'infinitif + objet précis` (≤ 120 caractères, sans point final). Exemple : `[V2-004] RBAC frontend : requiredRole sur /admin/*, /gestionnaire/* et /citoyen/*`.

**Description (markdown) :**

```
<Constat : ce qui se passe, où dans le code (fichier:ligne), comment c'est reproduit. Pas d'opinion sans preuve.>

**Sources :** <AG-xx, CIT x.x, GEST x.x, ...> · **Preuve :** <Live | Code | Audit ...> · **Taille :** <XS|S|M|L> · **Périmètre :** <zone du code, pas une personne>

**Critère d'acceptation :** <condition vérifiable, testable>

_Plan : `PLAN_SPRINT_V2.md` (ticket V2-0NN)_
```

- **Preuve :** `Live` = reproduit dans l'application ; `Code` = relu dans le dépôt ; `Audit` = repris d'un rapport, non revérifié. Ne pas écrire « Reproduit » sans l'avoir fait.
- **Taille :** XS < ½ j · S ≈ 1 j · M ≈ 2-3 j · L ≈ 1 semaine.
- Un critère d'acceptation par ticket, formulé de façon observable (« renvoie 403 », « affiche… »), jamais « corriger le bug ».
- Un ticket = un changement livrable. Si le ticket mélange deux périmètres (ex. backend + frontend de deux équipes), le scinder ou le lier.

## Labels

Sans espaces. Toujours : `v2` + le sprint (`sprint0` … `sprint5`) + **un** thème parmi la liste ci-dessous. `quickwin` s'ajoute aux corrections rapides à reporter en premier si la capacité d'un sprint manque (les 15 tickets V2-067 à V2-075 et V2-077 à V2-082 du Sprint 0 ; le Critique V2-076 n'en fait pas partie). Thèmes :
`securite`, `production`, `qualite-ci`, `navigation`, `agent`, `citoyen`, `gestionnaire`, `fiabilite`, `environnement`, `coherence`, `notifications`, `rgpd`, `accessibilite`, `ux`, `performance`, `evolution-v2`, `tracabilite`.
Ajouter un nouveau thème seulement si aucun ne convient, puis le noter ici.

## Sprints

- Découpage décidé le 13 oct. 2026 : **Sprint 0 = lot visuel** (25 tickets), **Sprint 1 = gate sécurité et production** (10 tickets). Le CDC M2 plaçait la gate en Sprint 0 (26–30 oct.) : écart assumé par l'équipe. Dans Jira, « SCRUM Sprint 0 » est daté du 12 au 26 oct. ; « SCRUM Sprint 1 » n'a pas encore de dates.
- **Structure du Sprint 0 (réorganisée par l'équipe vers le 18 oct.) :** 4 tickets parents de type `Tâche`, un par zone (SCRUM-40 Citoyen, SCRUM-41 Gestionnaire, SCRUM-42 Agent, SCRUM-43 Transverse) ; les 25 tickets du lot sont devenus leurs `Subtask`. Détail dans [references/ticket-map.md](references/ticket-map.md). Un nouveau ticket du Sprint 0 se rattache au parent de sa zone (le confirmer avec l'utilisateur).
- Les anciens sprints 1 à 4 du plan sont devenus les **sprints 2 à 5** (Fiabilité, Sécurité & référentiels, RGPD & UX, Charge & évolutions). Durée non fixée (hypothèse ≈ 2 semaines). Ils n'existent pas encore dans Jira ; ne les créer (`manageJiraSprint create`) que sur demande.
- Déplacer des tickets entre sprints : `manageJiraSprint` (action `addIssues`, via `executeDestructive`) puis mettre à jour l'étiquette `sprintN` avec `editJiraIssue`.
- Pour le backlog sans sprint, omettre `assignToSprint`.

## Assignation

Ne pas assigner sans demande. Pour assigner : `listJiraIssueAssignableUsers` (via `discover` + `executeRead`) pour obtenir l'`accountId`, puis le passer dans `assignee`.

L'équipe compte 4 développeurs. Répartition du Sprint 0 constatée dans Jira le 24 oct. (les sous-tâches suivent leur parent) :

| Zone (parent) | Développeur | Nom affiché dans Jira |
|---|---|---|
| Citoyen (SCRUM-40) | Moussa | Moussa ghazaly |
| Gestionnaire (SCRUM-41) | Sidi | Sidi Yahya Sidi Brahim |
| Agent (SCRUM-42) | Ali | alirasouli561 |
| Transverse (SCRUM-43) | Gusly (l'utilisateur) | jngusly |

Au Sprint 1, SCRUM-5 à SCRUM-8 sont assignés à Gusly ; vérifier les autres dans Jira avant d'affirmer quoi que ce soit. Le champ « Périmètre » d'une description indique seulement la zone du code (Gestionnaire, Citoyen, Agent, Admin, Backend, DevOps, Transverse), jamais une personne.

## Pièges connus

- Pas de type Bug ; le statut initial est « Idée ».
- Les sous-tâches du Sprint 0 ont perdu leur priorité à la conversion : leur description commence par « Priorité d'origine (perdue à la conversion en sous-tâche) : … ». En cas d'écart avec le champ Priorité, signaler l'écart plutôt que de choisir.
- `searchJiraIssuesUsingJql` n'affiche pas toujours `parent`, même demandé avec d'autres champs : le redemander seul (`fields: ["parent", "assignee"]`) pour savoir à quel lot appartient un ticket.
- `labels` : liste de chaînes sans espace ; un espace crée deux labels.
- Dans la console Windows, les accents d'un CSV lu en Python s'affichent « � » : c'est l'affichage, pas le fichier. Rédiger le texte à nouveau en UTF-8 plutôt que de copier la sortie console.
- Le CSV `PLAN_SPRINT_V2_jira.csv` a une colonne `Sprint` supplémentaire par rapport à l'import Jira standard.
- Avant d'écrire une mesure chiffrée (somme, comptage) tirée de la base, la recouper : une jointure peut multiplier les lignes (une « somme de points » de 3 450 était en réalité 23 × 150 ; la vraie valeur est 460).
- Un long script Python passé en heredoc au shell peut être mal interprété (guillemets, `\n`) : l'écrire dans un fichier avec l'outil Write puis l'exécuter.
- Les tickets d'exemple `SCRUM-1` à `SCRUM-4` (« Tâche 1 »…) sont ceux du modèle du projet, sans rapport avec le plan. SCRUM-1 et SCRUM-2 sont pourtant dans le Sprint 0 : les exclure des comptes (`key not in (SCRUM-1, SCRUM-2)`).

## Décisions encore ouvertes qui bloquent des tickets

D1 MFA citoyen · D2 droits gestionnaire sur Zones/Conteneurs · D3 points pour les agents · D4 signalement sans conteneur · D5 zone du citoyen · D6 noms du classement · D7 référentiel de niveaux · D8 modèle de la maintenance · D9 historique des rapports · D10 libellé de l'impact · D11 durée des sprints. Détail et recommandations : `PLAN_SPRINT_V2.md` §2. Quand un ticket « Dépend de Dx », le dire dans sa description.

## Mettre ce skill à jour

Mets à jour ce fichier (et `references/ticket-map.md`) quand :
- une décision D1–D11 est tranchée (la retirer de la liste, ajuster les tickets concernés) ;
- un sprint est créé ou démarré dans Jira (mettre à jour la table « Sprints ») ;
- une convention change (labels, format, priorités, types disponibles) ;
- un appel MCP se comporte autrement que décrit (ajouter à « Pièges connus ») ;
- les assignations ou la structure des lots changent (mettre à jour « Assignation », « Sprints » et `ticket-map.md`).

Ne pas y copier le contenu des tickets : il vit dans Jira et dans `PLAN_SPRINT_V2.md`.
