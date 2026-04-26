# Phase 3 : Defis et Classement

## Vue d'ensemble

Gestion des defis communautaires, participations et classement des utilisateurs.

## Tables de donnees

- gamification_defi : stockage des defis
- gamification_participation_defi : suivi des participations

## Fonctionnalites

### Defis
- Creation de defis avec titre, description et objectif
- Definition des recompenses en points
- Periode de validite avec dates de debut et fin
- Types de defis personnalisables

### Participations
- Inscription des utilisateurs aux defis
- Suivi de la progression
- Mise a jour du statut de participation
- Historique des mises a jour

### Classement
- Calcul des rangs par ordre decroissant de points
- Attribution des niveaux selon les points
- Affichage des badges de chaque utilisateur
- Mode focus utilisateur pour voir son propre rang

## Niveaux utilisateur

| Points | Niveau |
|--------|--------|
| 0 - 99 | Debutant |
| 100 - 499 | Eco-Warrior |
| 500 - 999 | Super-Heros |
| 1000+ | Legende Verte |

## Endpoints

### Defis

- GET /defis : Liste tous les defis
- POST /defis : Cree un nouveau defi
- POST /defis/:idDefi/participations : Inscrit un utilisateur
- PATCH /defis/:idDefi/participations/:idUtilisateur : Met a jour la progression

### Classement

- GET /classement?limite=10 : Classement general
- GET /classement?limite=10&idUtilisateur=1 : Classement avec focus utilisateur

## Tests Unitaires

### defis.service.js

- **creerDefi**
  - Teste la creation avec tous les parametres
  - Teste le retour du defi cree

- **listerDefis**
  - Teste le tri par date de debut decroissante
  - Teste le format des donnees

- **creerParticipation**
  - Teste l'inscription d'un utilisateur
  - Teste la gestion des doublons

- **mettreAJourProgression**
  - Teste la mise a jour de progression
  - Teste la mise a jour optionnelle du statut

### leaderboard.service.js

- **recupererClassement**
  - Teste le calcul correct des rangs
  - Teste l'association des badges
  - Teste la determination des niveaux
  - Teste le mode focus utilisateur

### Controllers

- **defisController**
  - Teste la validation des donnees
  - Teste la gestion des erreurs
  - Teste les codes HTTP retournes

- **classementController**
  - Teste la pagination avec limite
  - Teste le parametre idUtilisateur optionnel
