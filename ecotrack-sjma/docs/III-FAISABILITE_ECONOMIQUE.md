# III. Faisabilité Économique — EcoTrack

Critères RNCP Ce1.1.3 / A1.3 : Analyse faisabilité économique et ROI

---

## A. Coûts de Développement — Année 1

### Hypothèses

- Durée projet : 16 semaines (4 mois) — 8 sprints Scrum de 2 semaines
- Localisation : France métropolitaine
- Salaires bruts annuels charges patronales comprises (coût employeur)
- Infrastructure : Cloud AWS (région eu-west-3 Paris)
- Licences calculées prorata temporis (4 mois)

---

### 1. Ressources Humaines (16 semaines)

| Poste | Taux d'engagement | Coût annuel employeur | Coût projet (4 mois) |
|-------|:-----------------:|----------------------|---------------------|
| Product Owner | 25 % | 58 000 € | 4 833 € |
| Scrum Master | 25 % | 52 000 € | 4 333 € |
| Développeur Full-Stack (x3) | 100 % | 52 000 € | 17 333 € × 3 |
| Architecte Logiciel | 50 % | 75 000 € | 12 500 € |
| DevOps / SRE | 50 % | 68 000 € | 11 333 € |

| | |
|---|---|
| **SOUS-TOTAL RH** | **84 998 €** |

> Les coûts employeur intègrent les charges patronales (~42% du salaire brut). Les développeurs Full-Stack sont positionnés niveau Junior-Confirmé (2-4 ans d'expérience, profil M1 Expert Dev Web).

---

### 2. Infrastructure Cloud — Phase Développement (4 mois)

Environnements : développement + staging (2 environnements distincts).

| Ressource | Configuration | Coût mensuel | Coût 4 mois |
|-----------|---------------|:------------:|:-----------:|
| Serveurs applicatifs (3 EC2 t3.medium) | 2 vCPU, 4 GB RAM | 105 € | 420 € |
| Base de données (RDS PostgreSQL db.t3.medium) | 2 vCPU, 4 GB, 100 GB SSD | 90 € | 360 € |
| Cache (ElastiCache Redis t3.micro) | 1 vCPU, 1 GB | 15 € | 60 € |
| Kafka managé (MSK t3.small × 2 brokers) | Dev uniquement | 120 € | 480 € |
| Stockage objets (S3 — avatars, exports PDF) | 100 GB | 3 € | 12 € |
| Bande passante sortante | ~50 GB/mois | 5 € | 20 € |
| Load Balancer ALB | 1 instance | 18 € | 72 € |

| | |
|---|---|
| **SOUS-TOTAL Infrastructure Dev** | **1 424 €** |

---

### 3. Licences et Outils

| Outil | Tarif | Durée | Coût |
|-------|-------|:-----:|:----:|
| Jira Software (7 users × 8,15 $/user/mois) | SaaS | 4 mois | 216 € |
| Confluence (inclus Jira) | — | 4 mois | 0 € |
| GitHub Teams (7 users × 4 $/user/mois) | SaaS | 4 mois | 112 € |
| DataDog (monitoring — 3 hosts) | 15 $/host/mois | 4 mois | 180 € |
| SonarCloud (analyse qualité code) | Gratuit open source | — | 0 € |
| Figma (design UI — 2 editeurs) | 15 $/editeur/mois | 4 mois | 120 € |
| VS Code + extensions | Gratuit | — | 0 € |
| Postman (tests API) | Gratuit (plan free) | — | 0 € |
| Licences formation (certifications) | Forfait | — | 500 € |

| | |
|---|---|
| **SOUS-TOTAL Licences** | **1 128 €** |

---

### TOTAL ANNEE 1 (Développement)

| Poste | Montant |
|-------|--------:|
| Ressources Humaines | 84 998 € |
| Infrastructure Cloud (dev + staging) | 1 424 € |
| Licences et Outils | 1 128 € |
| Réserve imprévus (10 %) | 8 755 € |
| **TOTAL ANNEE 1** | **96 305 €** |

---

## B. Coûts Récurrents — Années 2 et 3

### 1. Infrastructure Production (par an)

Environnements : production (haute disponibilité) + staging permanent.

| Ressource | Configuration | Coût mensuel | Coût annuel |
|-----------|---------------|:------------:|:-----------:|
| Serveurs applicatifs (4 EC2 t3.large) | 2 vCPU, 8 GB RAM × 4 | 560 € | 6 720 € |
| Base de données primaire (RDS db.t3.large) | 2 vCPU, 8 GB, 200 GB SSD | 180 € | 2 160 € |
| Replica de lecture PostgreSQL | db.t3.medium | 90 € | 1 080 € |
| Redis production (ElastiCache r7g.large) | 2 vCPU, 13 GB | 110 € | 1 320 € |
| Kafka managé (MSK — 3 brokers) | Prod, 3 AZ | 420 € | 5 040 € |
| CDN (CloudFront) | 1 TB/mois sortant | 85 € | 1 020 € |
| Backups automatisés (RDS + S3) | Rétention 30j | 25 € | 300 € |
| Certificats SSL (ACM) | Gratuit AWS | — | 0 € |
| Load Balancer ALB | 2 instances (prod + staging) | 36 € | 432 € |

| | |
|---|---|
| **SOUS-TOTAL Infrastructure Production** | **18 072 €/an** |

---

### 2. Maintenance et Support (par an)

| Poste | Détail | Coût annuel |
|-------|--------|:-----------:|
| Équipe support applicatif (2 devs × 25 %) | Bugs, correctifs, MCO | 26 000 € |
| Evolutions fonctionnelles (1 dev × 25 %) | Nouvelles features prioritaires | 13 000 € |
| Mise à jour sécurité et dépendances | Audit npm, patches CVE | 3 000 € |
| Tests de régression et validation | Revue trimestrielle | 2 000 € |

| | |
|---|---|
| **SOUS-TOTAL Maintenance** | **44 000 €/an** |

---

### 3. Licences Récurrentes (par an)

| Outil | Coût annuel |
|-------|:-----------:|
| Jira + Confluence (5 users) | 648 € |
| GitHub Teams (5 users) | 240 € |
| DataDog — production monitoring | 1 800 € |
| Nom de domaine + DNS | 60 € |

| | |
|---|---|
| **SOUS-TOTAL Licences** | **2 748 €/an** |

---

### TOTAL PAR AN (Années 2-3)

| Poste | Montant |
|-------|--------:|
| Infrastructure Production | 18 072 € |
| Maintenance et Support | 44 000 € |
| Licences Récurrentes | 2 748 € |
| Réserve imprévus (5 %) | 3 241 € |
| **TOTAL PAR AN** | **68 061 €/an** |

---

## C. TCO — Total Cost of Ownership sur 3 ans

| Année | Contenu | Montant |
|-------|---------|--------:|
| Année 1 | Développement complet + déploiement initial | 96 305 € |
| Année 2 | Exploitation production + maintenance | 68 061 € |
| Année 3 | Exploitation production + maintenance | 68 061 € |
| **TOTAL TCO 3 ANS** | | **232 427 €** |

Coût moyen annualisé : **77 476 €/an**

---

## D. Analyse ROI — Retour sur Investissement

### Contexte de référence

Périmètre : collectivité urbaine de 80 000 habitants, 2 000 conteneurs, 50 agents de collecte, budget gestion déchets annuel : 3 200 000 €.

### Gains quantifiables

| Source d'économie | Hypothèse | Gain annuel estimé |
|-------------------|-----------|:-----------------:|
| Optimisation des tournées (2-opt vs tournées manuelles) | Réduction 15 % des km parcourus — 250 000 km/an × 0,45 €/km | 16 875 € |
| Réduction collectes inutiles (IoT — seuil remplissage) | 20 % de passages évités sur 18 000 collectes/an × 12 €/collecte | 43 200 € |
| Réduction débordements (alertes préventives) | 35 % de réduction des interventions d'urgence — 200 interventions/an × 180 € | 12 600 € |
| Productivité agents (app mobile, scan QR) | 10 min gagnées/agent/jour × 50 agents × 220 jours × 0,30 €/min | 33 000 € |
| Réduction litiges et plaintes citoyens | Traçabilité signalements, -30 % de traitements administratifs | 8 000 € |
| **TOTAL GAINS ANNUELS** | | **113 675 €** |

### Calcul ROI

```
Investissement initial (Année 1)          :  96 305 €
Coût exploitation annuel (Années 2-3)     :  68 061 €/an

Gains annuels (à partir de l'Année 2)     : 113 675 €/an
Gain net annuel                           :  45 614 €/an

Retour sur investissement (ROI 3 ans)     :
  Gains cumulés (an2 + an3)               = 227 350 €
  Coûts totaux 3 ans (TCO)                = 232 427 €
  ROI 3 ans                               = (227 350 - 232 427) / 232 427 × 100 = -2,2 %

Seuil de rentabilité (Break-even)         : Année 4
  Gains an4 cumulés                       = 340 000 €  (3 × 113 675)
  TCO cumul an4                           = 300 488 €  (232 427 + 68 061)
  ROI an4                                 = +13,1 %
```

Le projet atteint son seuil de rentabilité courant l'**année 4** d'exploitation. Ce délai est représentatif des projets de digitalisation dans le secteur public où les bénéfices sont progressifs (adoption utilisateur, données historiques accumulées pour le ML).

### Gains non quantifiés (valeur additionnelle)

- Amélioration de l'image de la collectivité (service citoyen numérique).
- Conformité RGPD et traçabilité réglementaire.
- Données analytiques pour la planification pluriannuelle (rapports PDF/Excel).
- Extensibilité : module tri sélectif, vélos cargos électriques, composteurs.
- Réduction empreinte carbone mesurable (dashboard CO2 économisé).

---

## E. Synthèse Financière

| Indicateur | Valeur |
|-----------|--------|
| TCO 3 ans | 232 427 € |
| Coût par habitant sur 3 ans | 2,91 €/habitant |
| Gain annuel (régime croisière) | 113 675 € |
| Break-even | Année 4 |
| ROI à 5 ans | +38 % |

Le rapport coût/bénéfice est favorable dès la 4e année. A titre de comparaison, une solution SaaS équivalente du marché (ex : Cyclope, ReachMe) coûte entre 4 et 8 €/habitant/an, soit 320 000 à 640 000 € sur 3 ans pour le périmètre considéré — soit 38 % à 175 % plus cher que le développement interne.
