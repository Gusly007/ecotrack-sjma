# ============================================================================
# DOCKERFILE - SERVICE ANALYTICS
# ============================================================================

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY kafkaConsumer.js ./
COPY src ./src

RUN npm install --omit=dev

EXPOSE 3015

CMD ["node", "src/index.js"]
