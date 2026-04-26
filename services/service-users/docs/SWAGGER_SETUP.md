# Configuration de Swagger

Pour que la documentation et les tests de l'API avec Swagger fonctionnent, vous devez installer les dépendances suivantes dans le service `service-users`.

Exécutez la commande suivante à la racine du dossier `service-users` :

```bash
npm install swagger-ui-express swagger-jsdoc
```

Une fois l'installation terminée, vous pouvez démarrer le serveur (par exemple avec `npm run dev`) et accéder à la documentation à l'adresse [http://localhost:3010/api-docs](http://localhost:3010/api-docs).
