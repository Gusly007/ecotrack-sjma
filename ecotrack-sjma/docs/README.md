# ecotrack-db-sjma
MCD ECOTRACK - Modèle Conceptuel des Données
Entités Principales
1. ZONE_URBAINE
Représente les zones géographiques de la métropole divisées pour la gestion des collectes.
Attributs :

idZone (PK, INT, AUTO_INCREMENT) : Identifiant unique
nomZone (VARCHAR 100, NOT NULL) : Nom de la zone
codePostal (VARCHAR 5, UNIQUE) : Code postal
nombreHabitants (INT) : Population de la zone
coordLat (DECIMAL 10,8) : Latitude GPS
coordLon (DECIMAL 10,8) : Longitude GPS
dateCreation (DATETIME) : Date de création de la zone

2. CONTENEUR
Conteneurs intelligents de collecte des déchets.
Attributs :

idConteneur (PK, VARCHAR 20) : Identifiant unique (ex: CNT-001)
typeConteneur (VARCHAR 30, NOT NULL) : Type (papier, plastique, général, verre)
capaciteL (INT, NOT NULL) : Capacité en litres
dateInstallation (DATE) : Date d'installation
etatFonctionnement (ENUM: actif, maintenance, retire) : État actuel
idZone (FK) : Zone d'appartenance
dernierVidage (DATETIME) : Dernière collecte

3. CAPTEUR
Capteurs embarqués dans les conteneurs.
Attributs :

idCapteur (PK, INT, AUTO_INCREMENT)
modele (VARCHAR 50, NOT NULL) : Modèle du capteur
typeMesure (VARCHAR 30, NOT NULL) : Type (remplissage%, température, humidité, poids)
dateInstallation (DATE)
dateEtalonnage (DATE) : Date du dernier étalonnage
statut (ENUM: actif, defaillant) : État du capteur

4. MESURE_CAPTEUR
Données collectées par les capteurs en temps réel.
Attributs :

idMesure (PK, INT, AUTO_INCREMENT)
valeur (DECIMAL 8,2, NOT NULL) : Valeur mesurée
unite (VARCHAR 20) : Unité (%, °C, kg)
dateHeureMesure (DATETIME, NOT NULL, INDEX) : Timestamp de la mesure
idCapteur (FK) : Capteur source
idConteneur (FK) : Conteneur associé
qualite (ENUM: valide, suspecte) : Qualité de la donnée

5. AGENT_COLLECTE
Agents responsables des tournées de collecte.
Attributs :

idAgent (PK, INT, AUTO_INCREMENT)
nomAgent (VARCHAR 50, NOT NULL)
prenomAgent (VARCHAR 50, NOT NULL)
numeroMatricule (VARCHAR 10, UNIQUE, NOT NULL)
numeroTelephone (VARCHAR 15)
dateEmbauche (DATE, NOT NULL)
statut (ENUM: actif, repos, formation, arret) : Statut professionnel
nombreTourneesEffectuees (INT, DEFAULT 0) : Statistique

6. VEHICULE
Véhicules utilisés pour les collectes.
Attributs :

idVehicule (PK, VARCHAR 10) : Numéro d'immatriculation
typeVehicule (VARCHAR 30, NOT NULL) : Type (camion, benne, petite)
carburant (ENUM: diesel, electrique, GNV) : Type carburant
capaciteConteneurs (INT, NOT NULL) : Nombre de conteneurs transportables
dateAcquisition (DATE)
kilometrage (INT, DEFAULT 0)
dateMaintenancePrevue (DATE) : Maintenance programmée
etat (ENUM: operationnel, maintenance, retire) : État du véhicule

7. TOURNEE
Tournées de collecte planifiées.
Attributs :

idTournee (PK, INT, AUTO_INCREMENT)
dateTournee (DATE, NOT NULL, INDEX) : Date de la tournée
heureDebut (TIME) : Heure de début
heureFin (TIME) : Heure de fin
statut (ENUM: planifiee, en_cours, terminee, annulee) : État
nombreConteneursPrevus (INT) : Nombre prévisionnel
nombreConteneurCollectes (INT) : Nombre réel
distanceKm (DECIMAL 6,2) : Distance parcourue
idAgent (FK) : Agent responsable
idVehicule (FK) : Véhicule utilisé
idZone (FK) : Zone couverte

8. DETAIL_TOURNEE
Détails des conteneurs traités par tournée (jointure explicite).
Attributs :

idDetailTournee (PK, INT, AUTO_INCREMENT)
idTournee (FK) : Tournée
idConteneur (FK) : Conteneur collecté
heureCollecte (TIME) : Heure de vidage
volumeCollecte (INT) : Volume réel collecté (litres)
ordreCollecte (INT) : Ordre dans la tournée (1, 2, 3...)
observations (TEXT) : Remarques du collecteur

9. CITOYEN
Citoyens enregistrés sur l'application mobile.
Attributs :

idCitoyen (PK, INT, AUTO_INCREMENT)
nomCitoyen (VARCHAR 50, NOT NULL)
prenomCitoyen (VARCHAR 50, NOT NULL)
emailCitoyen (VARCHAR 100, UNIQUE) : Email pour notifications
telephoneCitoyen (VARCHAR 15)
adresse (VARCHAR 200) : Adresse résidence
dateInscription (DATETIME, NOT NULL)
nombreSignalements (INT, DEFAULT 0) : Statistique
idZone (FK) : Zone de résidence
statut (ENUM: actif, suspendu) : Statut du compte

10. SIGNALEMENT
Signalements de problèmes remontés par les citoyens.
Attributs :

idSignalement (PK, INT, AUTO_INCREMENT)
dateSignalement (DATETIME, NOT NULL, INDEX)
description (TEXT, NOT NULL) : Description du problème
typeProblem (VARCHAR 30, NOT NULL) : Type (débordement, odeur, dégradation, autre)
coordLat (DECIMAL 10,8) : Localisation GPS du problème
coordLon (DECIMAL 10,8)
urlPhoto (VARCHAR 255) : Photo du problème
statut (ENUM: nouveau, en_traitement, resolu, cloture) : Traitement
priorite (ENUM: basse, moyenne, haute, critique) : Niveau urgence
idCitoyen (FK) : Auteur du signalement
idConteneur (FK, NULLABLE) : Conteneur concerné (optionnel)
dateResolution (DATETIME, NULLABLE) : Date de fermeture
noteResolution (TEXT) : Résumé de la résolution

11. INTERVENTION
Interventions de maintenance ou rectification suite à signalements.
Attributs :

idIntervention (PK, INT, AUTO_INCREMENT)
dateIntervention (DATETIME, NOT NULL, INDEX)
typeIntervention (VARCHAR 30) : Type (maintenance, nettoyage, reparation, deplacement)
dureeMinutes (INT) : Durée de l'intervention
description (TEXT) : Description des actions
coutEstime (DECIMAL 8,2) : Coût estimé en euros
statut (ENUM: planifiee, en_cours, completee) : État
idSignalement (FK, NULLABLE) : Signalement associé
idConteneur (FK) : Conteneur intervené
idAgent (FK) : Agent responsable
idZone (FK) : Zone d'intervention

12. ALERTE_CAPTEUR
Alertes générées par anomalies détectées.
Attributs :

idAlerte (PK, INT, AUTO_INCREMENT)
dateAlerte (DATETIME, NOT NULL, INDEX)
typeAlerte (VARCHAR 30, NOT NULL) : Type (remplissage_critique, temperature_anormale, capteur_defaillant, absence_mesure)
severite (ENUM: info, avertissement, critique) : Niveau de sévérité
description (TEXT) : Description détaillée
valeurDetectee (DECIMAL 8,2) : Valeur ayant déclenché l'alerte
seuilAlertante (DECIMAL 8,2) : Seuil de déclenchement
statut (ENUM: active, traitee, faux_positif) : État
idCapteur (FK) : Capteur source
idConteneur (FK) : Conteneur concerné
dateTraitement (DATETIME, NULLABLE) : Date de prise en charge
noteTraitement (TEXT) : Remarques