# ============================================================================
# DOCKERFILE POUR API-GATEWAY (multi-stage, Alpine, non-root)
# ============================================================================

# --- STAGE 1: BUILD ---
FROM node:20-alpine AS builder
WORKDIR /app

# Cache deps
COPY package*.json ./
RUN npm ci --omit=dev --prefer-offline

# Code source
COPY . .

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

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node healthcheck.cjs

CMD ["node", "src/index.js"]
