# ============================================================================
# DOCKERFILE POUR SERVICE-USERS (multi-stage, Alpine, non-root)
# ============================================================================

# --- STAGE 1: BUILD ---
FROM node:20-alpine AS builder
WORKDIR /app

# Cache deps
COPY package*.json ./
RUN npm ci --omit=dev --prefer-offline

# Code source
COPY . .
# Si vous utilisez TypeScript, décommentez la ligne suivante
# RUN npm run build

# --- STAGE 2: RUNTIME ---
FROM node:20-alpine AS runtime
WORKDIR /app

# Utilisateur non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copier uniquement ce qui est nécessaire
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/healthcheck.cjs ./

# Préparer les répertoires de stockage (avatars, tmp) avec les bons droits
RUN mkdir -p storage/avatars/original storage/avatars/thumbnails storage/avatars/temp storage/temp \
  && chown -R appuser:appgroup storage

USER appuser
EXPOSE 3010

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=10s \
  CMD node healthcheck.cjs

CMD ["node", "src/index.js"]
