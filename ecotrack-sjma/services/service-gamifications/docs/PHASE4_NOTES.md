# Phase 4 : Notifications et Statistiques

## Vue d'ensemble

Systeme de notifications de gamification et calcul des statistiques detaillees.

## Fonctionnalites

### Notifications
- Creation de notifications personnalisees
- Types de notifications : BADGE, POINTS, DEFI, SYSTEME
- Liste des notifications par utilisateur
- Tri par date de creation decroissante

### Statistiques utilisateur
- Total de points accumules
- Agregation par jour sur les 7 derniers jours
- Agregation par semaine sur les 8 dernieres semaines
- Agregation par mois sur les 12 derniers mois
- Estimation de l'impact CO2 base sur les points

## Endpoints

### Notifications

- GET /notifications?id_utilisateur=1 : Liste les notifications
- POST /notifications : Cree une notification

Payload exemple POST :
```json
{
  "id_utilisateur": 1,
  "type": "BADGE",
  "titre": "Nouveau badge",
  "corps": "Bravo, vous avez obtenu un badge."
}
```

### Statistiques

- GET /utilisateurs/:idUtilisateur/stats : Stats detaillees

Reponse exemple :
```json
{
  "totalPoints": 150,
  "parJour": [...],
  "parSemaine": [...],
  "parMois": [...],
  "impactCO2": 3
}
```

## Calcul de l'impact CO2

Formule : totalPoints * 0.02 (arrondi)

Exemple : 150 points = 3 kg CO2 economises

## Tests Unitaires

### notifications.service.js

- **creerNotification**
  - Teste la creation avec tous les parametres
  - Teste les differents types de notifications
  - Teste le retour de la notification creee

- **listerNotifications**
  - Teste le filtrage par utilisateur
  - Teste le tri par date decroissante
  - Teste le format des donnees

### stats.service.js

- **recupererStatsUtilisateur**
  - Teste la recuperation du total de points
  - Teste l'agregation par jour
  - Teste l'agregation par semaine
  - Teste l'agregation par mois
  - Teste le calcul de l'impact CO2
  - Teste la gestion d'erreur si utilisateur inexistant

### Controllers

- **notificationsController**
  - Teste la validation des types de notification
  - Teste la gestion des erreurs
  - Teste les codes HTTP retournes

- **statsController**
  - Teste la validation de l'id utilisateur
  - Teste le format de la reponse
  - Teste la gestion des utilisateurs introuvables

## Integration

Les notifications sont automatiquement generees lors de :
- L'attribution d'un nouveau badge
- L'atteinte d'un seuil de points
- La completion d'un defi

Les statistiques sont mises a jour en temps reel base sur l'historique des points.
