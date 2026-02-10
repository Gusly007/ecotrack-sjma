# ==========================================================================
# DOCKERFILE POUR SERVICE-GAMIFICATIONS (multi-stage, Alpine, non-root)
# ==========================================================================

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --prefer-offline

COPY . .

FROM node:20-alpine AS runtime
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/healthcheck.cjs ./

USER appuser
EXPOSE 3014

HEALTHCHECK --interval=10s --timeout=5s --retries=5 --start-period=10s \
  CMD node healthcheck.cjs

CMD ["node", "src/index.js"]
