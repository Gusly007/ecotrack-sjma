# API Gateway — Mise en route rapide

1. **Installer les dépendances**
   ```bash
   cd api-gateway
   npm install
   ```

2. **Configurer l'environnement**
   Créer un fichier `.env` (copie depuis `example` si dispo) avec au minimum :
   ```env
   GATEWAY_PORT=3000
   USERS_PORT=3010
   USERS_SERVICE_URL=http://localhost:3010
   GATEWAY_RATE_WINDOW_MS=60000
   GATEWAY_RATE_MAX=100
   ```
   Adapter les URLs/ports dès qu'un nouveau microservice est prêt (containers, routes, etc.).

3. **Lancer le service**
   ```bash
   npm run dev
   ```
   Le gateway inverse les requêtes vers `service-users` et expose un récapitulatif via `http://localhost:3000/health` et `http://localhost:3000/api-docs`.

4. **Tester rapidement**
   - Health check : `curl http://localhost:3000/health`
   - Auth via le gateway : `curl http://localhost:3000/auth/login`
   - Swagger users proxifié : `http://localhost:3000/docs/users`

5. **Ajouter un nouveau service**
   - Mettre à jour `src/index.js` pour lui donner un statut `ready`, son URL et son chemin Swagger.
   - Relancer le gateway pour qu'il proxifie automatiquement les nouvelles routes et les expose dans `/api-docs`.
