# ============================================================================
# DOCKERFILE - SERVICE CONTAINERS
# ============================================================================
# Microservice de gestion des conteneurs intelligents EcoTrack.
# Utilisé par docker-compose.yml pour le déploiement.
# ============================================================================

FROM node:20-alpine

WORKDIR /app

# Installer les dépendances système (healthcheck)
RUN apk add --no-cache curl

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances de production uniquement
RUN npm install --omit=dev

# Copier le code source
COPY . .

# Port exposé (doit correspondre à APP_PORT dans docker-compose.yml)
EXPOSE 3011

# Healthcheck intégré
HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=10s \
  CMD node healthcheck.cjs

# Démarrage du service
CMD ["node", "index.js"]
