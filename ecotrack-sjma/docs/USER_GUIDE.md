# EcoTrack - Guide Utilisateur

## Table des matières
1. [Introduction](#introduction)
2. [Guide du Citoyen](#guide-du-citoyen)
3. [Guide de l'Agent de Collecte](#guide-de-lagent-de-collecte)
4. [Guide du Gestionnaire](#guide-du-gestionnaire)
5. [Guide de l'Administrateur](#guide-de-ladministrateur)
6. [Diagrammes transversaux](#diagrammes-transversaux)

---

## Introduction

EcoTrack est une plateforme intelligente de gestion des dechets urbains. Elle connecte les citoyens, les agents de collecte, les gestionnaires et les administrateurs pour optimiser la collecte et le tri des dechets.

### Vue d'ensemble des roles

Les diagrammes de l'architecture sont disponibles dans le dossier `docs/diagrams/flows/` :
- [Architecture globale](diagrams/flows/architecture-globale.mmd)
- [Flux Gestionnaire](diagrams/flows/gestionnaire-flux.mmd)
- [Architecture Admin](diagrams/flows/admin-architecture.mmd)

---

## Guide du Citoyen

Le citoyen est au coeur de la plateforme EcoTrack. Il peut signaler des problemes, suivre ses collectes et participer a des defis ecologiques.

### Scenario 1 : Premiere connexion et signalement

**Contexte** : Jean, nouveau resident, decouvre un conteneur debordant pres de chez lui.

1. **Inscription**
   - Acceder a l'application web ou mobile
   - Cliquer sur "Creer un compte"
   - Renseigner : nom d'utilisateur, email, mot de passe
   - Accepter les CGU et la politique de confidentialite
   - Valider → Un email de confirmation est envoye.

2. **Connexion**
   - Saisir son email et mot de passe
   - Acceder au tableau de bord (Dashboard).

3. **Signalement d'un probleme**
   - Cliquer sur "Signaler" (bouton + flottant)
   - **Etape 1** : Scanner le QR Code du conteneur ou le selectionner sur la carte
   - **Etape 2** : Choisir le type de probleme (Debordement, Degradation, etc.)
   - **Etape 3** : Ajouter une photo, choisir l'urgence, decrire le probleme
   - Envoyer → Signalement enregistre.

4. **Suivi**
   - Recevoir une notification quand le statut change
   - Consulter "Mes Signalements" pour voir la timeline
   - Lire la reponse de l'agent en charge.

### Scenario 2 : Consulter sa performance ecologique

**Contexte** : Marie veut connaitre son impact environnemental.

1. **Dashboard**
   - Consulter son niveau (Eco-Acteur Argent)
   - Progression vers le niveau superieur.

2. **Impact environnemental**
   - CO2 evite
   - Dechets tries
   - Nombre de signalements.

### Scenario 3 : Participer a un defi ecologique

**Contexte** : Participation au defi "Tri Parfait".

1. **Consulter les defis**
   - Aller dans l'onglet "Defis"
   - Voir les defis actifs : Quotidiens, Hebdomadaires, Mensuels.

2. **Suivre la progression**
   - Defi "Tri Parfait" : 3/7 jours completes
   - Visualiser la barre de progression.

### Scenario 4 : Utiliser la carte interactive

**Contexte** : Planifier ses depots de dechets.

1. **Carte des conteneurs**
   - Onglet "Carte" sur le dashboard
   - Voir les marqueurs colores : Vert (disponible), Orange (bientot plein), Rouge (plein).

2. **Detail d'un conteneur**
   - Cliquer sur un marqueur
   - Voir : type, capacite, adresse, dernier collecte, niveau de remplissage.

### Fonctionnalites du Citoyen

| Fonctionnalite | Description |
|------|------|
| Inscription/Connexion | Creation de compte, JWT, reinitialisation mot de passe |
| Dashboard | Statistiques, prochaines collectes, impact CO2 |
| Signalement | 3 etapes (identifier, type, description) |
| Carte interactive | Conteneurs temps reel, filtres par zone |
| Guide de tri | Categories : recyclables, verre, papier, compost |
| Defis | Quotidiens, hebdomadaires, mensuels (sans points) |
| Historique | Signalements, classement |
| Notifications | Push/Email : collectes, signalements, defis |
| Horaires collecte | Par adresse, types de dechets |

### Diagramme du parcours Citoyen

Voir le diagramme : [parcours-citoyen.mmd](diagrams/flows/citoyen-parcours.mmd)

---

## Guide de l'Agent de Collecte

L'agent utilise une interface mobile optimisee pour gerer ses tournees de collecte, scanner les conteneurs et signaler des anomalies.

### Scenario 1 : Debute et realiser une tournee

**Contexte** : Marc commence sa tournee du matin dans le Centre-Ville.

1. **Connexion Agent**
   - Identifiant agent + mot de passe
   - Acceder au dashboard agent.

2. **Dashboard Agent**
   - Voir sa tournee du jour : #T-2026-00042
   - Statistiques : 45 conteneurs, 23.4 km, depart 06:00.

3. **Demarrer la tournee**
   - Cliquer "Continuer la tournee"
   - Voir la progression : 12/45 (27%).

4. **Traiter un conteneur**
   - Scanner le QR Code du conteneur
   - Verifier : UID, adresse, remplissage
   - Saisir le poids estime
   - **Valider la collecte**.

5. **Signalement d'anomalie**
   - Type : Vehicule gare, conteneur endommage
   - Photo + Description + Geolocalisation
   - Envoyer au gestionnaire.

### Scenario 2 : Terminer une tournee

**Contexte** : Marc a fini sa tournee.

1. **Fin de tournee**
   - Cliquer "Terminer la tournee"
   - Resume affiche : 43/45 collectes, 2 non collectes.

2. **Problemes signalees**
   - Voir la liste : Acces bloque, Capteur defectueux.

3. **Confirmation**
   - Valider et soumettre
   - Impact environnemental affiche.

### Scenario 3 : Consulter ses statistiques

**Contexte** : Marc veut voir sa performance.

1. **Statistiques**
   - Nombre de collectes ce mois
   - Taux de reussite : 96.8%
   - Classement : 3eme sur 15 agents.

2. **Historique des tournees**
   - Filtrer : Cette semaine / Ce mois / Tout.

### Fonctionnalites de l'Agent

| Fonctionnalite | Description |
|------|------|
| Dashboard | Tournee du jour, stats, alertes operationnelles |
| Tournee | Progression temps reel, liste des conteneurs |
| Scan QR | Identification conteneur, validation collecte |
| Anomalies | Formulaire complet, photo, geolocalisation |
| Historique | Tournees passees, statistiques, classement |
| Profil | Modification infos, photo, notifications |

### Diagramme du flux Agent

Voir le diagramme : [flux-agent.mmd](diagrams/flows/agent-flux.mmd)

---

## Guide du Gestionnaire

Le gestionnaire supervise les operations de collecte, gere les tournees, les zones, les conteneurs et analyse les performances.

### Scenario 1 : Creer et assigner une tournee

**Contexte** : Sophie, gestionnaire, doit planifier une tournee.

1. **Dashboard Gestionnaire**
   - Voir les KPIs : 12/15 tournees actives, 28/30 agents actifs.

2. **Assistant de creation (Wizard 4 etapes)**
   - **Etape 1** : Nom, Date, Type (Normale/Express), Zone.
   - **Etape 2** : Selection des conteneurs sur la carte.
   - **Etape 3** : Optimisation de l'itineraire (algorithme 2-opt).
   - **Etape 4** : Assignation d'un agent disponible.

3. **Validation**
   - Verifier le resume de la tournee
   - Confirmer la creation → Tournee assignee.

### Scenario 2 : Suivi temps reel et intervention

**Contexte** : Sophie surveille les tournees en cours.

1. **Carte temps reel**
   - Voir les positions des agents en direct
   - Etat des conteneurs (couleurs : Vert/Orange/Rouge).

2. **Traitement d'un signalement citoyen**
   - Nouveau signalement : #SIG-2026-001234 (Debordement)
   - Analyser la priorite et la localisation
   - Assigner a l'agent le plus proche.

3. **Gestion des anomalies**
   - Voir les problemes signales par les agents
   - Planifier une maintenance avec les services techniques
   - Mettre a jour le statut du conteneur.

### Scenario 3 : Analyse et rapports

**Contexte** : Fin de mois, generation du rapport strategique.

1. **Analyse des KPIs**
   - Taux de debordement : 3.2%
   - Temps moyen de collecte : 4.2 min/conteneur
   - CO2 economise : 1.2 tonnes.

2. **Gestion des zones**
   - Carte des zones avec limites geographiques
   - Performance par zone (Centre-Ville : 98%, Banlieue : 87%).

3. **Gestion des conteneurs**
   - Parc total : 710 conteneurs
   - Etat : 680 fonctionnels, 30 en maintenance.

4. **Rapport strategique**
   - Selectionner : Type (Collecte/Dechets/Agents), Periode
   - Format : PDF ou CSV
   - Envoyer aux parties prenantes.

### Fonctionnalites du Gestionnaire

| Fonctionnalite | Description |
|------|------|
| Dashboard | KPIs, alertes, tournees en cours |
| Tournees | Creation, gestion, assignation, optimisation |
| Suivi temps reel | Carte, positions agents, etat conteneurs |
| Gestion zones | Creation, modification, statistiques par zone |
| Gestion conteneurs | Inventaire, maintenance, historique |
| Signalements | Traitement, assignation, resolution |
| Rapports | KPIs, export PDF/CSV, analyses comparatives |

### Diagramme du flux Gestionnaire

Voir le diagramme : [flux-gestionnaire.mmd](diagrams/flows/gestionnaire-flux.mmd)

---

## Guide de l'Administrateur

L'administrateur gere l'infrastructure technique, les utilisateurs, les parametres systeme et la securite de la plateforme.

### Scenario 1 : Gestion des utilisateurs et roles

**Contexte** : Nouvel agent recrute, l'administrateur doit creer son compte.

1. **Tableau de bord Admin**
   - Voir les statistiques systeme : 1500 citoyens, 30 agents, 5 gestionnaires.

2. **Creation d'un utilisateur**
   - Cliquer "Nouvel utilisateur"
   - Renseigner : Nom, Email, Role (Agent/Gestionnaire/Admin)
   - Generer un mot de passe temporaire
   - Envoyer l'invitation par email.

3. **Gestion des roles**
   - Modifier les permissions d'un utilisateur
   - Desactiver un compte (ex: agent demissionnaire).

### Scenario 2 : Configuration systeme et monitoring

**Contexte** : Verifier la sante du systeme.

1. **Monitoring (Grafana)**
   - Acceder au dashboard Grafana
   - Voir : CPU, RAM, Disque, Requetes API/sec
   - Alertes : service-iot ne repond pas.

2. **Gestion des services**
   - Voir l'etat des microservices (API Gateway, Users, Routes, Containers, etc.)
   - Redemarrer un service defeuctueux
   - Consulter les logs d'erreurs.

3. **Configuration Redis et Cache**
   - Taux de hit Cache : 85%
   - Purger le cache si necessaire.

### Scenario 3 : Securite et audit

**Contexte** : Audit mensuel de securite.

1. **Logs d'acces**
   - Voir les connexions recentes
   - Detecter les tentatives d'intrusion
   - Bloquer une IP suspecte.

2. **Gestion des tokens JWT**
   - Duree de validite : 24h
   - Forcer la deconnexion globale si necessaire.

3. **Sauvegarde et restauration**
   - Verifier les sauvegardes automatiques (quotidienne)
   - Tester une restauration sur environnement de test.

### Fonctionnalites de l'Administrateur

| Fonctionnalite | Description |
|------|------|
| Gestion utilisateurs | CRUD utilisateurs, roles, permissions |
| Monitoring | Grafana, Prometheus, sante des services |
| Configuration | Variables d'environnement, parametres globaux |
| Securite | JWT, audit logs, gestion des acces |
| Base de donnees | PostgreSQL, sauvegardes, migrations |
| Cache | Redis, performances, purge |
| Messagerie | Notifications systeme, templates email |

### Diagramme de l'architecture Admin

Voir le diagramme : [architecture-admin.mmd](diagrams/flows/admin-architecture.mmd)

---

## Diagrammes transversaux

### Cycle de vie d'un signalement

Voir le diagramme : [cycle-signalement.mmd](diagrams/flows/signalement-cycle.mmd)

### Flux des notifications

Voir le diagramme : [flux-notifications.mmd](diagrams/flows/notifications-flux.mmd)

### Architecture technique globale

Voir le diagramme : [architecture-globale.mmd](diagrams/flows/architecture-globale.mmd)

---