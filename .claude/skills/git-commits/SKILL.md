---
name: git-commits
description: Écrire les commits, branches et descriptions de PR d'EcoTrack selon les conventions de l'équipe (Conventional Commits en français, clé Jira SCRUM-xx pour le lien automatique avec Jira). À utiliser dès qu'on demande de commiter, de rédiger un message de commit, de créer une branche, de découper des changements en commits ou d'ouvrir une PR dans ce dépôt.
---

# Commits EcoTrack

Ce skill est **vivant** : mets-le à jour quand une convention change (voir la fin).
Il complète le skill `jira-tickets` : les clés `SCRUM-xx` viennent de là (`.claude/skills/jira-tickets/references/ticket-map.md`).

## Règle d'or

Ne commite, ne pousse et n'ouvre une PR **que si l'utilisateur le demande**. Une demande de commit ne vaut pas demande de push.

## Particularités du dépôt

- **Deux niveaux de dossier :** la racine git est `ecotrack-sjma/` et le code est dans `ecotrack-sjma/ecotrack-sjma/`. Les chemins dans `git add` / `git status` sont relatifs à la racine git (`ecotrack-sjma/frontend/...`, `.github/workflows/...`, `.claude/...`). Vérifier le dossier courant avant `git add`.
- **Branche de base : `main`** (c'est là que sont fusionnées les PR récentes). `origin/develop` existe mais est périmée : ne pas s'en servir sans demande.
- Remote : `origin` (GitHub, `Gusly007/ecotrack-sjma`). Il existe aussi un remote `heroku` : ne jamais y pousser.
- Aucun hook git ni commitlint : la convention n'est appliquée par aucun outil, donc par nous.
- `core.autocrlf=true` : les avertissements « LF will be replaced by CRLF » sont normaux et ne changent pas le contenu commité. Vérifier quand même avec `git diff --stat` qu'un fichier n'apparaît pas entièrement modifié.
- **`gh` n'est pas installé.** C'est l'utilisateur qui ouvre les PR sur GitHub, et un autre membre de l'équipe qui les fusionne : ne jamais fusionner soi-même. Le dépôt est public : l'état de la CI se lit avec l'API REST (`/repos/Gusly007/ecotrack-sjma/actions/runs?head_sha=<sha complet>` ; un sha court ne renvoie rien). La CI tourne sur `push` et sur `pull_request` (une soixantaine de jobs).

## Format du message

```
type(scope): description à l'impératif, en français (SCRUM-12)

Corps optionnel : pourquoi ce changement, ce qui a été vérifié,
ce qui reste à faire. Une ligne vide après le titre.
```

- **Titre ≤ 72 caractères**, sans point final, en français avec accents, verbe à l'infinitif ou au présent (« ajout de… », « corriger… » : rester cohérent dans un même lot).
- **Clé Jira entre parenthèses à la fin du titre** : `(SCRUM-12)`. Jira relie alors le commit au ticket sans smart commit. Plusieurs tickets : `(SCRUM-12, SCRUM-13)`. Pas de ticket (docs, chore) : ne rien mettre, ne pas inventer de clé.
- Le numéro de PR `(#49)` est ajouté par GitHub au merge : ne pas l'écrire à la main.
- Le corps explique le **pourquoi** ; le diff dit déjà le quoi.
- Si la session ou l'utilisateur impose une ligne `Co-Authored-By`, la placer en dernière ligne du corps, après une ligne vide.

### Types (observés dans l'historique)

`feat` · `fix` · `docs` · `refactor` · `perf` · `test` · `ci` · `build` · `chore` · `style` · `revert`
Combinaison déjà utilisée : `feat(perf+a11y)`. Préférer un scope simple.

### Scopes

Un scope par service ou zone touchée :
`api-gateway` · `service-users` · `service-routes` · `service-containers` · `service-gamifications` · `service-iot` · `service-analytics` · `service-notification` · `frontend` · `citoyen` · `agent` · `gestionnaire` · `admin` · `database` · `seed` · `ci` · `docker` · `security` · `docs` · `claude` (fichiers `.claude/`)

Plusieurs services pour un même correctif : scope du plus impacté, et lister les autres dans le corps. Plus de 3 zones sans lien : c'est probablement plusieurs commits.

## Découper les changements

- **Un commit = un changement logique** qui compile et dont les tests passent. Un correctif de sécurité backend et le correctif frontend d'un autre ticket sont deux commits.
- Un commit par ticket Jira dès que possible : c'est ce qui rend le journal de traçabilité (observation → ticket → PR → test) lisible.
- Les documents d'audit / de plan, les skills `.claude/skills/` et le code applicatif ne se mélangent pas.
- Un correctif livré avec son test : même commit.

## Procédure

1. `git status` et `git branch --show-current`. Sur `main` : créer une branche avant de commiter.
2. `git diff` (et `git diff --staged`) pour relire ce qui part. Chercher des secrets (`.env`, jetons, mots de passe, clés) et des fichiers générés (`dist/`, `dev-dist/`, `node_modules/`). Les comptes de démo `password123` des seeds sont publics et acceptables ; rien d'autre.
3. **Ajouter les fichiers nommément** (`git add chemin/fichier`). Jamais `git add -A` ni `git add .` : le dossier contient des fichiers non suivis qui n'ont rien à voir (audits, CSV, brouillons).
4. Rédiger le message selon le format ci-dessus, avec la clé du ticket concerné. Si la clé n'est pas évidente, la demander ou la chercher dans `ticket-map.md`.
5. `git commit` (heredoc pour un message multi-lignes). **Ne jamais** contourner les hooks (`--no-verify`) ni la signature.
6. Si un hook ou la CI échoue : corriger la cause et faire un **nouveau** commit. Ne pas `--amend` un commit déjà poussé.
7. `git log --oneline -3` pour vérifier, puis annoncer à l'utilisateur ce qui a été commité.

Opérations à ne faire que sur demande explicite : `push`, `push --force` (jamais sur `main`), `reset --hard`, `rebase`, suppression de branche, `--amend`.

## Branches

`<type>/SCRUM-<n>-<slug-court>` : `fix/SCRUM-8-rbac-frontend`, `feat/SCRUM-24-prochaines-collectes`, `docs/audit-gestionnaire` (sans ticket). Minuscules, tirets, pas d'accents. La clé dans le nom de branche suffit aussi à lier la branche au ticket Jira.

## Pull requests

Titre : même format que le commit principal. Description :

```
## Contexte
<ticket(s) SCRUM-xx, ce que ça corrige>

## Changements
- ...

## Vérification
- <tests lancés, parcours testé à la main>

## Points d'attention
<migrations, variables d'environnement, décisions D1–D11 concernées>
```

Cible `main`. Lier les tickets Jira par leur clé dans le titre ou la description. Ne pas activer l'auto-merge sans demande.

**Avant de pousser une branche pour une PR :**
1. `git fetch origin` puis `git pull origin main` dans la branche : un conflit se règle en local, pas au moment de la fusion. Relancer les tests après.
2. Si une autre PR ouverte touche les mêmes fichiers, attendre sa fusion. `git merge-tree --write-tree origin/<branche-a> origin/<branche-b>` simule la fusion de deux branches sans rien modifier.
3. Après le push, donner à l'utilisateur le lien `https://github.com/Gusly007/ecotrack-sjma/pull/new/<branche>`, puis le titre et la description dans des blocs de code prêts à coller.

## Mettre ce skill à jour

Modifier ce fichier quand :
- l'équipe adopte un outil (commitlint, husky, hook) ou change la branche de base ;
- un nouveau scope ou type devient courant (l'ajouter à la liste) ;
- un incident montre une règle manquante (ex. fichier sensible commité par erreur) ;
- le format de lien avec Jira change.

Ne pas y recopier de messages de commit : ils vivent dans l'historique git.
