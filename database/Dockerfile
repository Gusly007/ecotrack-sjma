# ============================================================================
# DOCKERFILE - SERVICE DE MIGRATIONS
# ============================================================================
# Ce container exécute les migrations et les seeds, puis s'arrête.
# Il est utilisé par docker-compose pour initialiser la base de données.
# ============================================================================

FROM node:20-alpine

WORKDIR /app

# Installer les dépendances système (nc pour tester la connexion)
RUN apk add --no-cache netcat-openbsd dos2unix

# Installer les dépendances npm
COPY package*.json ./
RUN npm install --omit=dev

# Copier les fichiers de migration
COPY migrate.config.cjs ./
COPY migrations ./migrations
COPY seeds ./seeds
COPY scripts ./scripts

# Script d'entrée
COPY docker-entrypoint.sh ./
RUN dos2unix docker-entrypoint.sh \
    && chmod +x docker-entrypoint.sh

# Exécuter les migrations et seeds
ENTRYPOINT ["./docker-entrypoint.sh"]
