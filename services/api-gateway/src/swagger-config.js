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

### 🔐 Service Users (Port 3010)
- **Authentification** : Connexion, inscription, tokens JWT
- **Gestion utilisateurs** : Profils, rôles, permissions
- **Avatars** : Upload et gestion des images de profil
- **Notifications** : Système de notifications temps réel

### 🗑️ Service Containers (Port 3011)
- **Conteneurs** : CRUD complet des conteneurs de collecte
- **Zones** : Gestion des zones géographiques
- **Types** : Types de conteneurs (recyclage, ordures, verre, etc.)
- **Statistiques** : Dashboard, analytics, alertes
- **Socket.IO** : Notifications temps réel des changements de statut

### 🚚 Services à venir
- **Routes & Planning** : Optimisation des tournées de collecte
- **IoT** : Capteurs temps réel de niveau de remplissage
- **Gamification** : Points, badges, classements
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
      description: '🌐 API Gateway (Point d\'entrée unifié)'
    },
    {
      url: 'http://localhost:3010',
      description: '🔐 Service Users (Direct)'
    },
    {
      url: 'http://localhost:3011',
      description: '🗑️ Service Containers (Direct)'
    }
  ],
  tags: [
    {
      name: '🔐 Authentication',
      description: 'Endpoints d\'authentification (Service Users)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3010/api-docs'
      }
    },
    {
      name: '👤 Users',
      description: 'Gestion des utilisateurs (Service Users)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3010/api-docs'
      }
    },
    {
      name: '🗑️ Containers',
      description: 'Gestion des conteneurs de collecte (Service Containers)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3011/api-docs'
      }
    },
    {
      name: '📍 Zones',
      description: 'Zones géographiques (Service Containers)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3011/api-docs'
      }
    },
    {
      name: '📦 Types',
      description: 'Types de conteneurs (Service Containers)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3011/api-docs'
      }
    },
    {
      name: '📊 Statistics',
      description: 'Statistiques et analytics (Service Containers)',
      externalDocs: {
        description: 'Documentation détaillée',
        url: 'http://localhost:3011/api-docs'
      }
    }
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['🔐 Authentication'],
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
        tags: ['🔐 Authentication'],
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
        tags: ['🗑️ Containers'],
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
        tags: ['🗑️ Containers'],
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
        tags: ['📍 Zones'],
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
        tags: ['📦 Types'],
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
        tags: ['📊 Statistics'],
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
