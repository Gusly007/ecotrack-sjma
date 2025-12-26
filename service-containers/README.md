# service-containers

🔧 Instructions pour configurer et tester la connexion PostgreSQL utilisée par ce dossier.

---

## ✅ Prérequis
- Node.js installé
- Un serveur PostgreSQL accessible (pgAdmin montre vos serveurs). Le nom affiché dans pgAdmin (ex. `PostgreSQL 18`) est une étiquette UI — ce qui compte : **hôte**, **port**, **utilisateur**, **mot de passe**, **nom de la base**.

## ⚙️ Fichiers importants
- `.env.example` → copier en `.env` et renseigner vos identifiants
- `dbconnexion.js` → connexion Postgres via `pg` (utilise `dotenv`)
- `test-db.js` → petit script pour tester la connexion
- `scripts/init-db.js` → script Node qui exécute `sql/init.sql`
- `sql/init.sql` → script SQL d'initialisation (création de la table `users`)

## 🔁 Installer les dépendances
Depuis ce dossier :

```powershell
npm install
```

## 📝 Configurer l'environnement
Copiez l'exemple et éditez :

```powershell
Copy-Item .env.example .env
# puis ouvrez .env et renseignez PGPASSWORD, PGUSER, etc.
```

Variables importantes dans `.env` :
- `PGHOST` (ex: `localhost`)
- `PGPORT` (ex: `5432`)
- `PGUSER` (ex: `postgres`)
- `PGPASSWORD` (mot de passe de l'utilisateur)
- `PGDATABASE` (ex: `ecotrack-db`)

> ⚠️ **Ne commitez jamais** votre `.env` contenant des secrets dans Git.

## ▶️ Commandes utiles
- Tester la connexion :

```powershell
npm run test-db
```

- Initialiser la base (exécute `sql/init.sql`) :

```powershell
npm run init-db
```

## Alternative : exécuter le SQL via `psql` ou pgAdmin
Si vous préférez, vous pouvez importer `sql/init.sql` depuis pgAdmin ou en CLI :

```powershell
psql -h $PGHOST -U $PGUSER -d "$PGDATABASE" -f sql/init.sql
```

## Notes & bonnes pratiques
- `scripts/init-db.js` est un utilitaire simple : il découpe le fichier SQL par `;`. Pour des migrations plus complexes utilisez `node-pg-migrate`, `knex`, Flyway ou autre.
- Utilisez toujours des requêtes paramétrées (`$1, $2`) pour éviter les injections SQL.

---

Si vous voulez, j'ajoute des exemples d'utilisation (route Express qui liste les `users`) ou un exemple de migration avec `node-pg-migrate`.
