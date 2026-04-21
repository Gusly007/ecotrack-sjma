/**
 * Configuration Swagger unifiée pour l'API Gateway
 * Combine les documentations de tous les microservices
 */

export const unifiedSwaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'EcoTrack - API Unifiée',
    version: '1.0.0',
    description: `
# API EcoTrack - Documentation Complète

Cette documentation unifie tous les microservices de la plateforme EcoTrack.

## Services Disponibles

### Service Users (Port 3010)
- **Authentification** : Connexion, inscription, tokens JWT
- **Gestion utilisateurs** : Profils, rôles, permissions
- **Avatars** : Upload et gestion des images de profil
- **Notifications** : Système de notifications temps réel

### Service Containers (Port 3011)
- **Conteneurs** : CRUD complet des conteneurs de collecte
- **Zones** : Gestion des zones géographiques
- **Types** : Types de conteneurs (recyclage, ordures, verre, etc.)
- **Statistiques** : Dashboard, analytics, alertes
- **Socket.IO** : Notifications temps réel des changements de statut

### Service Routes (Port 3012)
- **Tournées** : gestion, optimisation, statuts, étapes, PDF et carte
- **Véhicules** : gestion et affectation des véhicules
- **Collectes** : validation, anomalies et suivi des collectes
- **Signalements** : suivi des incidents, traitements et historique
- **Statistiques** : dashboard et KPIs des tournées

### Service IoT (Port 3013)
- **Mesures** : Réception et stockage des données capteurs
- **Capteurs** : Gestion des capteurs IoT
- **Alertes** : Alertes automatiques (débordement, batterie, température)
- **MQTT Broker** : Broker Aedes embarqué (port 1883)
- **Simulation** : Outil de test sans vrai-capteur

### Service Gamification (Port 3014)
- **Actions** : Enregistrement des actions écoresponsables
- **Badges** : Système de récompenses et badges
- **Défis** : Challenges communautaires et participations
- **Classement** : Leaderboard des utilisateurs
- **Notifications** : Alertes gamification
- **Statistiques** : Profil et stats de chaque utilisateur

### Service Analytics (Port 3015)
- **Agrégations** : Dashboard complet, stats globales, journalières, par zone, par type

## Architecture

Toutes les requêtes passent par l'API Gateway (\`http://localhost:3000\`) qui route vers les microservices appropriés.

## Authentification

La plupart des endpoints nécessitent un token JWT dans le header :
\`\`\`
Authorization: Bearer <votre_token>
\`\`\`

Obtenez un token via \`POST /auth/login\`
    `,
    contact: {
      name: 'EcoTrack Team',
      email: 'support@ecotrack.dev'
    },
    license: {
      name: 'MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'API Gateway (Point d\'entree unifie)'
    },
    {
      url: 'http://localhost:3010',
      description: 'Service Users (Direct)'
    },
    {
      url: 'http://localhost:3011',
      description: 'Service Containers (Direct)'
    },
    {
      url: 'http://localhost:3012',
      description: 'Service Routes (Direct)'
    },
    {
      url: 'http://localhost:3013',
      description: 'Service IoT (Direct)'
    },
    {
      url: 'http://localhost:3014',
      description: 'Service Gamification (Direct)'
    },
    {
      url: 'http://localhost:3015',
      description: 'Service Analytics (Direct)'
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'Endpoints d\'authentification (Service Users)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3010/api-docs'
      }
    },
    {
      name: 'Users',
      description: 'Gestion des utilisateurs (Service Users)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3010/api-docs'
      }
    },
    {
      name: 'Containers',
      description: 'Gestion des conteneurs de collecte (Service Containers)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3011/api-docs'
      }
    },
    {
      name: 'Zones',
      description: 'Zones géographiques (Service Containers)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3011/api-docs'
      }
    },
    {
      name: 'Routes',
      description: 'Gestion des tournées, véhicules, collectes et signalements (Service Routes)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3012/api-docs'
      }
    },
    {
      name: 'IoT Mesures',
      description: 'Données des capteurs IoT (Service IoT)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3013/api-docs'
      }
    },
    {
      name: 'IoT Capteurs',
      description: 'Gestion des capteurs (Service IoT)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3013/api-docs'
      }
    },
    {
      name: 'IoT Alertes',
      description: 'Alertes automatiques IoT (Service IoT)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3013/api-docs'
      }
    },
    {
      name: 'Actions',
      description: 'Enregistrement des actions écoresponsables (Service Gamification)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3014/api-docs'
      }
    },
    {
      name: 'Badges',
      description: 'Système de badges et récompenses (Service Gamification)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3014/api-docs'
      }
    },
    {
      name: 'Classement',
      description: 'Leaderboard des utilisateurs (Service Gamification)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3014/api-docs'
      }
    },
    {
      name: 'Défis',
      description: 'Challenges communautaires et participations (Service Gamification)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3014/api-docs'
      }
    },
    {
      name: 'Notifications Gamification',
      description: 'Notifications liées à la gamification (Service Gamification)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3014/api-docs'
      }
    },
    {
      name: 'Stats Gamification',
      description: 'Statistiques de gamification par utilisateur (Service Gamification)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3014/api-docs'
      }
    },
    {
      name: 'Analytics',
      description: 'Agrégations et statistiques avancées (Service Analytics)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3015/api-docs'
      }
    }
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Créer un nouveau compte utilisateur',
        description: 'Inscription d\'un nouvel utilisateur avec validation des données',
        operationId: 'register',
        servers: [{ url: 'http://localhost:3000' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nom', 'prenom', 'email', 'mot_de_passe', 'id_role'],
                properties: {
                  nom: { type: 'string', example: 'Dupont' },
                  prenom: { type: 'string', example: 'Jean' },
                  email: { type: 'string', format: 'email', example: 'jean.dupont@example.com' },
                  mot_de_passe: { type: 'string', format: 'password', minLength: 8, example: 'SecurePass123!' },
                  telephone: { type: 'string', example: '+33612345678' },
                  id_role: { type: 'integer', example: 2, description: '1=Admin, 2=User, 3=Collecteur' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Compte créé avec succès' },
          400: { description: 'Données invalides' },
          409: { description: 'Email déjà utilisé' }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Se connecter et obtenir un token JWT',
        operationId: 'login',
        servers: [{ url: 'http://localhost:3000' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'mot_de_passe'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'admin@ecotrack.dev' },
                  mot_de_passe: { type: 'string', format: 'password', example: 'Admin123!' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Connexion réussie',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    user: { type: 'object' }
                  }
                }
              }
            }
          },
          401: { description: 'Identifiants invalides' }
        }
      }
    },
    '/api/containers': {
      get: {
        tags: ['Containers'],
        summary: 'Liste paginée des conteneurs',
        description: 'Récupère tous les conteneurs avec pagination',
        operationId: 'getContainers',
        servers: [{ url: 'http://localhost:3000' }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
            description: 'Numéro de page'
          },
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer', default: 50 },
            description: 'Nombre d\'éléments par page'
          }
        ],
        responses: {
          200: {
            description: 'Liste des conteneurs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id_conteneur: { type: 'integer' },
                          uid: { type: 'string', example: 'CNT-123456789' },
                          statut: { type: 'string', enum: ['ACTIF', 'INACTIF', 'EN_MAINTENANCE'] },
                          niveau_remplissage: { type: 'number', minimum: 0, maximum: 100 },
                          id_zone: { type: 'integer' },
                          id_type: { type: 'integer' }
                        }
                      }
                    },
                    pagination: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Containers'],
        summary: 'Créer un nouveau conteneur',
        operationId: 'createContainer',
        servers: [{ url: 'http://localhost:3000' }],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['numero_serie', 'id_type', 'capacite', 'id_zone'],
                properties: {
                  numero_serie: { type: 'string', example: 'CNT-001' },
                  id_type: { type: 'integer', example: 1 },
                  capacite: { type: 'number', example: 1000, minimum: 100, maximum: 5000 },
                  niveau_remplissage: { type: 'number', example: 0, default: 0 },
                  id_zone: { type: 'integer', example: 1 },
                  gps_latitude: { type: 'number', example: 48.8566 },
                  gps_longitude: { type: 'number', example: 2.3522 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Conteneur créé' },
          400: { description: 'Données invalides' },
          401: { description: 'Non authentifié' }
        }
      }
    },
    '/api/zones': {
      get: {
        tags: ['Zones'],
        summary: 'Liste des zones géographiques',
        operationId: 'getZones',
        servers: [{ url: 'http://localhost:3000' }],
        responses: {
          200: {
            description: 'Liste des zones',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id_zone: { type: 'integer' },
                          code: { type: 'string', example: 'Z01' },
                          nom: { type: 'string', example: 'Centre-Ville' },
                          population: { type: 'integer' },
                          superficie_km2: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/typecontainers': {
      get: {
        tags: ['Types'],
        summary: 'Liste des types de conteneurs',
        operationId: 'getTypeContainers',
        servers: [{ url: 'http://localhost:3000' }],
        responses: {
          200: {
            description: 'Liste des types',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id_type: { type: 'integer' },
                          nom: { type: 'string', enum: ['ORDURE', 'RECYCLAGE', 'VERRE', 'COMPOST'] },
                          description: { type: 'string' },
                          couleur_code: { type: 'string', example: '#4CAF50' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/stats/dashboard': {
      get: {
        tags: ['Statistics'],
        summary: 'Dashboard de statistiques globales',
        description: 'Vue d\'ensemble complète des statistiques système',
        operationId: 'getDashboard',
        servers: [{ url: 'http://localhost:3000' }],
        responses: {
          200: {
            description: 'Dashboard complet',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        total_conteneurs: { type: 'integer' },
                        conteneurs_actifs: { type: 'integer' },
                        niveau_moyen: { type: 'number' },
                        alertes_critiques: { type: 'integer' },
                        zones: { type: 'array' },
                        types: { type: 'array' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // ═══════════════════════════════════════════════════════════════
    //  SERVICE GAMIFICATION — Endpoints
    // ═══════════════════════════════════════════════════════════════

    '/api/gamification/actions': {
      post: {
        tags: ['Actions'],
        summary: 'Enregistrer une action écoresponsable',
        description: 'Enregistre une action effectuée par un utilisateur et attribue des points',
        operationId: 'createAction',
        servers: [{ url: 'http://localhost:3000' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id_utilisateur', 'type_action', 'points'],
                properties: {
                  id_utilisateur: { type: 'integer', description: 'ID de l\'utilisateur', example: 1 },
                  type_action: { type: 'string', description: 'Type d\'action effectuée', example: 'recyclage' },
                  points: { type: 'integer', description: 'Points attribués', example: 10 }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Action enregistrée avec succès',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    id_utilisateur: { type: 'integer' },
                    type_action: { type: 'string' },
                    points: { type: 'integer' },
                    date_action: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          400: { description: 'Données invalides' },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/gamification/badges': {
      get: {
        tags: ['Badges'],
        summary: 'Lister tous les badges disponibles',
        description: 'Récupère la liste de tous les badges définis dans le système',
        operationId: 'getAllBadges',
        servers: [{ url: 'http://localhost:3000' }],
        responses: {
          200: {
            description: 'Liste des badges',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      nom: { type: 'string' },
                      description: { type: 'string' },
                      icone: { type: 'string' },
                      condition_type: { type: 'string' },
                      condition_valeur: { type: 'integer' }
                    }
                  }
                }
              }
            }
          },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/gamification/badges/utilisateurs/{idUtilisateur}': {
      get: {
        tags: ['Badges'],
        summary: 'Badges d\'un utilisateur',
        description: 'Récupère les badges obtenus par un utilisateur donné',
        operationId: 'getUserBadges',
        servers: [{ url: 'http://localhost:3000' }],
        parameters: [
          {
            name: 'idUtilisateur',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'ID de l\'utilisateur'
          }
        ],
        responses: {
          200: {
            description: 'Badges de l\'utilisateur',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      nom: { type: 'string' },
                      description: { type: 'string' },
                      icone: { type: 'string' },
                      date_obtention: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          },
          404: { description: 'Utilisateur non trouvé' },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/gamification/classement': {
      get: {
        tags: ['Classement'],
        summary: 'Récupérer le classement des utilisateurs',
        description: 'Retourne le leaderboard trié par points',
        operationId: 'getClassement',
        servers: [{ url: 'http://localhost:3000' }],
        parameters: [
          {
            name: 'limite',
            in: 'query',
            required: false,
            schema: { type: 'integer', default: 10 },
            description: 'Nombre maximum de résultats'
          },
          {
            name: 'id_utilisateur',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description: 'ID de l\'utilisateur pour inclure son rang'
          }
        ],
        responses: {
          200: {
            description: 'Classement des utilisateurs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    classement: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          rang: { type: 'integer' },
                          id_utilisateur: { type: 'integer' },
                          points_totaux: { type: 'integer' },
                          nombre_actions: { type: 'integer' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/gamification/defis': {
      get: {
        tags: ['Défis'],
        summary: 'Lister tous les défis',
        description: 'Récupère la liste de tous les défis communautaires',
        operationId: 'getAllDefis',
        servers: [{ url: 'http://localhost:3000' }],
        responses: {
          200: {
            description: 'Liste des défis',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      titre: { type: 'string' },
                      description: { type: 'string' },
                      objectif: { type: 'integer' },
                      recompense_points: { type: 'integer' },
                      date_debut: { type: 'string', format: 'date-time' },
                      date_fin: { type: 'string', format: 'date-time' },
                      type_defi: { type: 'string' }
                    }
                  }
                }
              }
            }
          },
          500: { description: 'Erreur serveur' }
        }
      },
      post: {
        tags: ['Défis'],
        summary: 'Créer un nouveau défi',
        description: 'Crée un défi communautaire avec objectif et récompense',
        operationId: 'createDefi',
        servers: [{ url: 'http://localhost:3000' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['titre', 'description', 'objectif', 'recompense_points', 'date_debut', 'date_fin', 'type_defi'],
                properties: {
                  titre: { type: 'string', example: 'Défi recyclage semaine' },
                  description: { type: 'string', example: 'Recycler 50 objets en une semaine' },
                  objectif: { type: 'integer', example: 50 },
                  recompense_points: { type: 'integer', example: 100 },
                  date_debut: { type: 'string', format: 'date-time' },
                  date_fin: { type: 'string', format: 'date-time' },
                  type_defi: { type: 'string', example: 'recyclage' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Défi créé avec succès' },
          400: { description: 'Données invalides' },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/gamification/defis/{idDefi}/participations': {
      post: {
        tags: ['Défis'],
        summary: 'Participer à un défi',
        description: 'Inscrit un utilisateur à un défi communautaire',
        operationId: 'participerDefi',
        servers: [{ url: 'http://localhost:3000' }],
        parameters: [
          {
            name: 'idDefi',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'ID du défi'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id_utilisateur'],
                properties: {
                  id_utilisateur: { type: 'integer', example: 1 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Participation enregistrée' },
          400: { description: 'Données invalides' },
          404: { description: 'Défi non trouvé' },
          409: { description: 'Participation déjà existante' },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/gamification/defis/{idDefi}/participations/{idUtilisateur}': {
      patch: {
        tags: ['Défis'],
        summary: 'Mettre à jour une participation',
        description: 'Met à jour la progression ou le statut d\'une participation à un défi',
        operationId: 'updateParticipation',
        servers: [{ url: 'http://localhost:3000' }],
        parameters: [
          {
            name: 'idDefi',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'ID du défi'
          },
          {
            name: 'idUtilisateur',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'ID de l\'utilisateur'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  progression: { type: 'integer', description: 'Progression actuelle', example: 25 },
                  statut: { type: 'string', enum: ['en_cours', 'complete', 'abandonne'], example: 'en_cours' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Participation mise à jour' },
          404: { description: 'Participation non trouvée' },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/gamification/notifications': {
      get: {
        tags: ['Notifications Gamification'],
        summary: 'Récupérer les notifications',
        description: 'Récupère les notifications de gamification d\'un utilisateur',
        operationId: 'getNotifications',
        servers: [{ url: 'http://localhost:3000' }],
        parameters: [
          {
            name: 'id_utilisateur',
            in: 'query',
            required: true,
            schema: { type: 'integer' },
            description: 'ID de l\'utilisateur'
          }
        ],
        responses: {
          200: {
            description: 'Liste des notifications',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      id_utilisateur: { type: 'integer' },
                      type: { type: 'string' },
                      titre: { type: 'string' },
                      corps: { type: 'string' },
                      lu: { type: 'boolean' },
                      date_creation: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          },
          500: { description: 'Erreur serveur' }
        }
      },
      post: {
        tags: ['Notifications Gamification'],
        summary: 'Créer une notification',
        description: 'Crée une nouvelle notification de gamification',
        operationId: 'createNotification',
        servers: [{ url: 'http://localhost:3000' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id_utilisateur', 'type', 'titre', 'corps'],
                properties: {
                  id_utilisateur: { type: 'integer', example: 1 },
                  type: { type: 'string', example: 'badge_obtenu' },
                  titre: { type: 'string', example: 'Nouveau badge !' },
                  corps: { type: 'string', example: 'Vous avez obtenu le badge Recycleur !' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Notification créée' },
          400: { description: 'Données invalides' },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/gamification/stats/utilisateurs/{idUtilisateur}/stats': {
      get: {
        tags: ['Stats Gamification'],
        summary: 'Statistiques d\'un utilisateur',
        description: 'Récupère les statistiques de gamification d\'un utilisateur (points, badges, rang, etc.)',
        operationId: 'getUserGamificationStats',
        servers: [{ url: 'http://localhost:3000' }],
        parameters: [
          {
            name: 'idUtilisateur',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'ID de l\'utilisateur'
          }
        ],
        responses: {
          200: {
            description: 'Statistiques de l\'utilisateur',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id_utilisateur: { type: 'integer' },
                    points_totaux: { type: 'integer' },
                    nombre_actions: { type: 'integer' },
                    nombre_badges: { type: 'integer' },
                    rang: { type: 'integer' },
                    defis_completes: { type: 'integer' }
                  }
                }
              }
            }
          },
          404: { description: 'Utilisateur non trouvé' },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    // ═══════════════════════════════════════════════════════════════
    //  SERVICE ANALYTICS — Endpoints
    // ═══════════════════════════════════════════════════════════════

    '/api/analytics/aggregations/dashboard': {
      get: {
        tags: ['Analytics'],
        summary: 'Dashboard complet d\'analytics',
        description: 'Récupère toutes les agrégations pour le dashboard (stats globales, quotidiennes, zones, types, performances agents)',
        operationId: 'getAnalyticsDashboard',
        servers: [{ url: 'http://localhost:3000' }],
        parameters: [
          {
            name: 'period',
            in: 'query',
            schema: { type: 'string', enum: ['day', 'week', 'month'], default: 'month' },
            description: 'Période d\'analyse (day, week, month)'
          }
        ],
        responses: {
          200: {
            description: 'Dashboard complet',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    global: { type: 'object', description: 'Statistiques globales' },
                    daily: { type: 'array', description: 'Statistiques quotidiennes' },
                    zones: { type: 'array', description: 'Statistiques par zone' },
                    types: { type: 'array', description: 'Statistiques par type' },
                    agents: { type: 'array', description: 'Performances des agents' },
                    period: { type: 'object', description: 'Période analysée' }
                  }
                }
              }
            }
          },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/analytics/aggregations/global': {
      get: {
        tags: ['Analytics'],
        summary: 'Agrégation globale',
        description: 'Statistiques globales du système (total conteneurs, niveau moyen, alertes, etc.)',
        operationId: 'getGlobalAggregation',
        servers: [{ url: 'http://localhost:3000' }],
        responses: {
          200: {
            description: 'Statistiques globales',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total_containers: { type: 'integer' },
                    containers_with_data: { type: 'integer' },
                    avg_fill_level: { type: 'number' },
                    critical_containers: { type: 'integer' },
                    total_zones: { type: 'integer' },
                    active_routes: { type: 'integer' },
                    open_reports: { type: 'integer' }
                  }
                }
              }
            }
          },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/analytics/aggregations/daily': {
      get: {
        tags: ['Analytics'],
        summary: 'Agrégations quotidiennes',
        description: 'Statistiques quotidiennes des mesures sur une période donnée',
        operationId: 'getDailyAggregations',
        servers: [{ url: 'http://localhost:3000' }],
        parameters: [
          {
            name: 'days',
            in: 'query',
            schema: { type: 'integer', default: 30 },
            description: 'Nombre de jours à analyser'
          }
        ],
        responses: {
          200: {
            description: 'Statistiques quotidiennes',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string', format: 'date' },
                      containers_measured: { type: 'integer' },
                      avg_fill_level: { type: 'number' },
                      critical_count: { type: 'integer' },
                      total_measurements: { type: 'integer' }
                    }
                  }
                }
              }
            }
          },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/analytics/aggregations/zones': {
      get: {
        tags: ['Analytics'],
        summary: 'Agrégations par zone',
        description: 'Statistiques agrégées par zone géographique',
        operationId: 'getZoneAggregations',
        servers: [{ url: 'http://localhost:3000' }],
        responses: {
          200: {
            description: 'Statistiques par zone',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id_zone: { type: 'integer' },
                      zone_name: { type: 'string' },
                      containers_count: { type: 'integer' },
                      avg_fill_level: { type: 'number' },
                      superficie_km2: { type: 'number' },
                      population: { type: 'integer' },
                      containers_per_km2: { type: 'number' }
                    }
                  }
                }
              }
            }
          },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/analytics/aggregations/types': {
      get: {
        tags: ['Analytics'],
        summary: 'Agrégations par type',
        description: 'Statistiques agrégées par type de conteneur',
        operationId: 'getTypeAggregations',
        servers: [{ url: 'http://localhost:3000' }],
        responses: {
          200: {
            description: 'Statistiques par type',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id_type: { type: 'integer' },
                      type_name: { type: 'string' },
                      containers_count: { type: 'integer' },
                      avg_fill_level: { type: 'number' }
                    }
                  }
                }
              }
            }
          },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/analytics/aggregations/agents': {
      get: {
        tags: ['Analytics'],
        summary: 'Performances des agents',
        description: 'Statistiques de performance des agents de collecte',
        operationId: 'getAgentPerformances',
        servers: [{ url: 'http://localhost:3000' }],
        parameters: [
          {
            name: 'period',
            in: 'query',
            schema: { type: 'string', enum: ['day', 'week', 'month'], default: 'month' },
            description: 'Période d\'analyse'
          }
        ],
        responses: {
          200: {
            description: 'Performances des agents',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id_utilisateur: { type: 'integer' },
                      nom: { type: 'string' },
                      prenom: { type: 'string' },
                      total_routes: { type: 'integer' },
                      completed_routes: { type: 'integer' },
                      avg_distance_km: { type: 'number' },
                      avg_duration_min: { type: 'number' },
                      avg_completion_rate: { type: 'number' }
                    }
                  }
                }
              }
            }
          },
          500: { description: 'Erreur serveur' }
        }
      }
    },

    '/api/analytics/refresh': {
      post: {
        tags: ['Analytics'],
        summary: 'Rafraîchir les agrégations',
        description: 'Rafraîchit toutes les vues matérialisées',
        operationId: 'refreshAggregations',
        servers: [{ url: 'http://localhost:3000' }],
        responses: {
          200: {
            description: 'Vues rafraîchies',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    refreshedAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          500: { description: 'Erreur serveur' }
        }
      }
    },

  // ========================================================================
  // ROUTES SERVICE - Service de gestion des tournées
  // ========================================================================
  '/api/routes/tournees': {
    get: {
      tags: ['Routes - Tournées'],
      summary: 'Liste toutes les tournées',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'statut', in: 'query', schema: { type: 'string', enum: ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'] } },
        { name: 'id_zone', in: 'query', schema: { type: 'integer' } },
        { name: 'id_agent', in: 'query', schema: { type: 'integer' } }
      ],
      responses: {
        200: { description: 'Liste des tournées' },
        500: { description: 'Erreur serveur' }
      }
    },
    post: {
      tags: ['Routes - Tournées'],
      summary: 'Créer une tournée',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['date_tournee', 'duree_prevue_min', 'id_zone', 'id_agent'],
              properties: {
                date_tournee: { type: 'string', format: 'date' },
                statut: { type: 'string', default: 'PLANIFIEE' },
                distance_prevue_km: { type: 'number' },
                duree_prevue_min: { type: 'integer' },
                id_vehicule: { type: 'integer' },
                id_zone: { type: 'integer' },
                id_agent: { type: 'integer' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Tournée créée' },
        400: { description: 'Données invalides' }
      }
    }
  },
  '/api/routes/tournees/active': {
    get: {
      tags: ['Routes - Tournées'],
      summary: 'Liste les tournées actives (EN_COURS)',
      responses: {
        200: { description: 'Tournées en cours' }
      }
    }
  },
  '/api/routes/tournees/{id}': {
    get: {
      tags: ['Routes - Tournées'],
      summary: 'Récupère une tournée par ID',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Tournée trouvée' },
        404: { description: 'Tournée introuvable' }
      }
    },
    patch: {
      tags: ['Routes - Tournées'],
      summary: 'Met à jour une tournée',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Tournée mise à jour' },
        404: { description: 'Tournée introuvable' }
      }
    },
    delete: {
      tags: ['Routes - Tournées'],
      summary: 'Supprime une tournée',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Tournée supprimée' },
        400: { description: 'Impossible de supprimer une tournée EN_COURS' }
      }
    }
  },
  '/api/routes/tournees/{id}/statut': {
    patch: {
      tags: ['Routes - Tournées'],
      summary: 'Change le statut dune tournée',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['statut'],
              properties: { statut: { type: 'string', enum: ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'] } }
            }
          }
        }
      },
      responses: {
        200: { description: 'Statut mis à jour' },
        400: { description: 'Statut invalide' }
      }
    }
  },
  '/api/routes/tournees/{id}/etapes': {
    get: {
      tags: ['Routes - Tournées'],
      summary: 'Récupère les étapes dune tournée',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Liste des étapes avec coordonnées conteneurs' }
      }
    }
  },
  '/api/routes/tournees/{id}/progress': {
    get: {
      tags: ['Routes - Tournées'],
      summary: 'Progression dune tournée',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Détails de progression' }
      }
    }
  },
  '/api/routes/tournees/{id}/pdf': {
    get: {
      tags: ['Routes - Export'],
      summary: 'Génère une feuille de route PDF',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: {
          description: 'PDF de la feuille de route',
          content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } }
        },
        404: { description: 'Tournée introuvable' }
      }
    }
  },
  '/api/routes/tournees/{id}/map': {
    get: {
      tags: ['Routes - Export'],
      summary: 'Données cartographiques GeoJSON pour affichage sur carte',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: {
        200: { description: 'Données GeoJSON' },
        404: { description: 'Tournée introuvable' }
      }
    }
  },
  '/api/routes/optimize': {
    post: {
      tags: ['Routes - Optimisation'],
      summary: 'Génère une tournée optimisée',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id_zone', 'date_tournee', 'id_agent'],
              properties: {
                id_zone: { type: 'integer' },
                date_tournee: { type: 'string', format: 'date' },
                seuil_remplissage: { type: 'number', default: 70 },
                id_agent: { type: 'integer' },
                id_vehicule: { type: 'integer' },
                algorithme: { type: 'string', enum: ['nearest_neighbor', '2opt'], default: '2opt' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Tournée optimisée créée' },
        400: { description: 'Données invalides ou aucun conteneur éligible' }
      }
    }
  },
  '/api/routes/tournees/{id}/collecte': {
    post: {
      tags: ['Routes - Collectes'],
      summary: 'Enregistre une collecte',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id_conteneur', 'quantite_kg'],
              properties: {
                id_conteneur: { type: 'integer' },
                quantite_kg: { type: 'number' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Collecte enregistrée' },
        400: { description: 'Tournée non EN_COURS ou conteneur absent' }
      }
    }
  },
  '/api/routes/tournees/{id}/anomalie': {
    post: {
      tags: ['Routes - Collectes'],
      summary: 'Signale une anomalie sur un conteneur',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id_conteneur', 'type_anomalie', 'description'],
              properties: {
                id_conteneur: { type: 'integer' },
                type_anomalie: { type: 'string', enum: ['CONTENEUR_INACCESSIBLE', 'CONTENEUR_ENDOMMAGE', 'CAPTEUR_DEFAILLANT'] },
                description: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Anomalie signalée' }
      }
    }
  },
  '/api/routes/vehicules': {
    get: {
      tags: ['Routes - Véhicules'],
      summary: 'Liste des véhicules',
      responses: { 200: { description: 'Liste des véhicules' } }
    },
    post: {
      tags: ['Routes - Véhicules'],
      summary: 'Créer un véhicule',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['numero_immatriculation', 'modele', 'capacite_kg'],
              properties: {
                numero_immatriculation: { type: 'string' },
                modele: { type: 'string' },
                capacite_kg: { type: 'integer' }
              }
            }
          }
        }
      },
      responses: { 201: { description: 'Véhicule créé' } }
    }
  },
  '/api/routes/vehicules/{id}': {
    get: {
      tags: ['Routes - Véhicules'],
      summary: 'Détail dun véhicule',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
      responses: { 200: { description: 'Véhicule trouvé' } }
    }
  },
  '/api/routes/stats/dashboard': {
    get: {
      tags: ['Routes - Statistiques'],
      summary: 'Compteurs globaux',
      responses: { 200: { description: 'Dashboard avec compteurs' } }
    }
  },
  '/api/routes/stats/kpis': {
    get: {
      tags: ['Routes - Statistiques'],
      summary: 'KPIs de performance',
      responses: { 200: { description: 'KPIs' } }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  //  SERVICE IOT — Endpoints
  // ═══════════════════════════════════════════════════════════════

  '/api/iot/measurements': {
    get: {
      tags: ['IoT Mesures'],
      summary: 'Liste des mesures avec filtres',
      description: 'Récupère les mesures des capteurs avec pagination et filtres',
      operationId: 'getMeasurements',
      servers: [{ url: 'http://localhost:3000' }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Numéro de page' },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 }, description: 'Nombre par page' },
        { name: 'id_conteneur', in: 'query', schema: { type: 'integer' }, description: 'Filtrer par conteneur' }
      ],
      responses: {
        200: { description: 'Liste des mesures' }
      }
    }
  },

  '/api/iot/measurements/latest': {
    get: {
      tags: ['IoT Mesures'],
      summary: 'Dernière mesure de chaque conteneur',
      operationId: 'getLatestMeasurements',
      servers: [{ url: 'http://localhost:3000' }],
      responses: {
        200: { description: 'Dernières mesures par conteneur' }
      }
    }
  },

  '/api/iot/measurements/container/{id}': {
    get: {
      tags: ['IoT Mesures'],
      summary: 'Mesures d\'un conteneur spécifique',
      operationId: 'getMeasurementsByContainer',
      servers: [{ url: 'http://localhost:3000' }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID du conteneur' }
      ],
      responses: {
        200: { description: 'Mesures du conteneur' },
        404: { description: 'Aucune mesure trouvée' }
      }
    }
  },

  '/api/iot/sensors': {
    get: {
      tags: ['IoT Capteurs'],
      summary: 'Liste des capteurs',
      operationId: 'getSensors',
      servers: [{ url: 'http://localhost:3000' }],
      responses: {
        200: { description: 'Liste des capteurs' }
      }
    }
  },

  '/api/iot/sensors/{id}': {
    get: {
      tags: ['IoT Capteurs'],
      summary: 'Détails d\'un-capteur',
      operationId: 'getSensorById',
      servers: [{ url: 'http://localhost:3000' }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID du-capteur' }
      ],
      responses: {
        200: { description: 'Détails du-capteur' },
        404: { description: 'Capteur non trouvé' }
      }
    }
  },

  '/api/iot/alerts': {
    get: {
      tags: ['IoT Alertes'],
      summary: 'Liste des alertes avec filtres',
      operationId: 'getAlerts',
      servers: [{ url: 'http://localhost:3000' }],
      parameters: [
        { name: 'statut', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'RESOLUE', 'IGNOREE'] }, description: 'Filtrer par statut' },
        { name: 'type_alerte', in: 'query', schema: { type: 'string', enum: ['DEBORDEMENT', 'BATTERIE_FAIBLE', 'CAPTEUR_DEFAILLANT'] }, description: 'Filtrer par type' }
      ],
      responses: {
        200: { description: 'Liste des alertes' }
      }
    }
  },

  '/api/iot/alerts/{id}': {
    patch: {
      tags: ['IoT Alertes'],
      summary: 'Mettre à jour le statut d\'une alerte',
      operationId: 'updateAlertStatus',
      servers: [{ url: 'http://localhost:3000' }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID de l\'alerte' }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                statut: { type: 'string', enum: ['RESOLUE', 'IGNOREE'] }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Alerte mise à jour' },
        400: { description: 'Alerte déjà traitée' },
        404: { description: 'Alerte non trouvée' }
      }
    }
  },

  '/api/iot/simulate': {
    post: {
      tags: ['IoT Alertes'],
      summary: 'Simuler l\'envoi de données-capteur',
      operationId: 'simulate',
      servers: [{ url: 'http://localhost:3000' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['uid_capteur', 'fill_level', 'battery'],
              properties: {
                uid_capteur: { type: 'string', example: 'CAP-001' },
                fill_level: { type: 'number', example: 85.5 },
                battery: { type: 'number', example: 92.0 },
                temperature: { type: 'number', example: 22.3 }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Données simulées traitées' }
      }
    }
  },

  '/api/iot/stats': {
    get: {
      tags: ['IoT Alertes'],
      summary: 'Statistiques globales du service IoT',
      operationId: 'getIotStats',
      servers: [{ url: 'http://localhost:3000' }],
      responses: {
        200: { description: 'Statistiques mesures, alertes et MQTT' }
      }
    }
  },

  },

  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenu via /auth/login'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'integer', example: 400 },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    }
  }
};

export const swaggerOptions = {
  customSiteTitle: 'EcoTrack API - Documentation Unifiée',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    validatorUrl: null,
    tryItOutEnabled: false,
    displayRequestDuration: false,
    filter: true,
    docExpansion: 'none'
  }
};
