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
   
   # Service Users
   USERS_PORT=3010
   USERS_SERVICE_URL=http://localhost:3010
   
   # Service Containers
   CONTAINERS_PORT=3011
   CONTAINERS_SERVICE_URL=http://localhost:3011
   
   # Rate limiting
   GATEWAY_RATE_WINDOW_MS=60000
   GATEWAY_RATE_MAX=100
   ```
   
   **Note** : En mode Docker, utilisez les noms de services :
   ```env
   USERS_SERVICE_URL=http://service-users:3010
   CONTAINERS_SERVICE_URL=http://service-containers:3011
   ```

3. **Lancer le service**
   ```bash
   npm run dev
   ```
   Le gateway inverse les requêtes vers `service-users` et expose un récapitulatif via `http://localhost:3000/health` et `http://localhost:3000/api-docs`.

4. **Tester rapidement**
   - Health check : `curl http://localhost:3000/health`
   - Auth via le gateway : `curl http://localhost:3000/auth/login`
   - Swagger users : `http://localhost:3000/docs/users`
   - Swagger containers : `http://localhost:3000/docs/containers`
   
   **Services disponibles** :
   - Users (`/auth`, `/users`, `/avatars`, `/notifications`) → Port 3010
   - Containers (`/api/containers`, `/api/zones`, `/api/typecontainers`, `/api/stats`) → Port 3011

5. **Ajouter un nouveau service**
   - Mettre à jour `src/index.js` pour lui donner un statut `ready`, son URL et son chemin Swagger.
   - Relancer le gateway pour qu'il proxifie automatiquement les nouvelles routes et les expose dans `/api-docs`.
