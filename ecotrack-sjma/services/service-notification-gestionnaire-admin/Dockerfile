# ============================================================================
# DOCKERFILE - SERVICE NOTIFICATION GESTIONNAIRE
# ============================================================================
# Microservice de gestion des notifications pour gestionnaires et admins.
# ============================================================================

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 3016

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=15s \
  CMD node healthcheck.cjs

CMD ["node", "index.js"]
