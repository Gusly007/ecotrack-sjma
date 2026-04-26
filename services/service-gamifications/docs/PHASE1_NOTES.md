# Phase 1 : Système de Points

## Vue d'ensemble

Gestion du système de points utilisateur : enregistrement des actions, calcul automatique des points et historique.

## Dependances

### Base de donnees PostgreSQL
- Pool de connexions via pg
- Tables : utilisateur, historique_points

## Types d'actions et points

| Action | Points |
|--------|--------|
| signalement | 10 |
| defi_reussi | 50 |
| collecte | 5 |
| participation | 2 |

## Fonctionnalites

### Calcul des points
- Attribution automatique selon le type d'action
- Possibilite de definir des points personnalises
- Valeur par defaut : 1 point

### Incrementation des points
- Mise a jour du total dans la table utilisateur
- Verification de l'existence de l'utilisateur
- Gestion des erreurs si utilisateur introuvable

### Historique des points
- Enregistrement de chaque action dans historique_points
- Stockage du delta de points et de la raison
- Utilisation pour les statistiques futures

## Endpoints

### POST /actions
Enregistre une action utilisateur et attribue des points.

Payload exemple :
```json
{
  "id_utilisateur": 1,
  "type_action": "signalement",
  "points": 10
}
```

## Tests Unitaires

### points.service.js

- **calculerPoints**
  - Teste l'attribution de points selon le type d'action
  - Teste l'utilisation de points personnalises
  - Teste la valeur par defaut pour les types inconnus

- **incrementerPoints**
  - Teste l'incrementation du total de points
  - Teste la gestion d'erreur si utilisateur inexistant
  - Teste le retour du nouveau total

- **enregistrerHistoriquePoints**
  - Teste l'enregistrement dans l'historique
  - Verification des parametres sauvegardes

### actionsController.js

- **enregistrerAction**
  - Teste la validation des donnees d'entree
  - Teste l'appel aux services de points
  - Teste les reponses HTTP appropriees
