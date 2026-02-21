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

### Service Gamification (Port 3014)
- **Actions** : Enregistrement des actions écoresponsables
- **Badges** : Système de récompenses et badges
- **Défis** : Challenges communautaires et participations
- **Classement** : Leaderboard des utilisateurs
- **Notifications** : Alertes gamification
- **Statistiques** : Profil et stats de chaque utilisateur

### Services à venir
- **Routes & Planning** : Optimisation des tournées de collecte
- **IoT** : Capteurs temps réel de niveau de remplissage
- **Analytics** : Tableaux de bord et rapports avancés

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
      url: 'http://localhost:3014',
      description: 'Service Gamification (Direct)'
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
      name: 'Types',
      description: 'Types de conteneurs (Service Containers)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3011/api-docs'
      }
    },
    {
      name: 'Statistics',
      description: 'Statistiques et analytics (Service Containers)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3011/api-docs'
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
    }
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
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 50px 0 }
    .swagger-ui .info .title { font-size: 36px; color: #4CAF50; }
    .swagger-ui .info .description { font-size: 16px; line-height: 1.6; }
    .swagger-ui .opblock-tag { font-size: 24px; }
  `,
  customSiteTitle: 'EcoTrack API - Documentation Unifiée',
  customfavIcon: '/favicon.ico'
};
