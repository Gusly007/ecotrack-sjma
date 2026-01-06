## Architecture

Utilisateur
    ↓
Upload fichier (multipart/form-data)
    ↓
API /users/avatar/upload
    ↓
Middleware Validation (taille, MIME, dimensions)
    ↓
Sharp (Redimensionnement)
    ├─ Original (1000x1000)
    ├─ Thumbnail (200x200)
    └─ Mini (64x64)
    ↓
Filesystem (Stockage)
    ↓
PostgreSQL (Sauvegarder URLs)
    ↓
Réponse avec URLs avatars

# Implémentation livrée
-  POST `/users/avatar/upload` protégé par JWT + Multer, avec validations (taille, MIME, dimensions) avant Sharp.
-  Génération de trois formats (1000, 200, 64 px) stockés dans `storage/avatars/*` exposé via `/avatars`.
-  URLs persistées en base (PostgreSQL) puis renvoyées aux clients pour affichage (profil, listes).
-  GET `/users/avatar/:userId` et DELETE `/users/avatar` pour récupérer ou supprimer l'avatar courant.
-  Création automatique des dossiers et nettoyage des anciens fichiers pour éviter l'accumulation.

# FileSystem 
npm install sharp multer

Filesystem Local:
-  Simple, pas de dépendance
-  Gratuit
- Rapide
- Dev/test facile

## Tests avec Postman
# Upload Avatar

POST /users/avatar/upload
Authorization: Bearer YOUR_TOKEN
Content-Type: multipart/form-data

Body:
file: (select file from computer)

# Récupérer Avatar
{
  "data": {
    "avatar_url": "/avatars/original/1-1705305000.jpg",
    "avatar_thumbnail": "/avatars/thumbnails/1-1705305000.jpg",
    "avatar_mini": "/avatars/mini/1-1705305000.jpg"
  }
}

# Afficher dans React

// Utiliser la thumbnail (64x64) pour liste
<img src={`http://localhost:3002${user.avatar_mini}`} alt={user.prenom} />

// Utiliser l'original pour profil détaillé
<img src={`http://localhost:3002${user.avatar_url}`} alt={user.prenom} />

## Rappels command line
-  `mkdir -p storage/avatars/{original,thumbnails,mini}`
-  `mkdir -p storage/temp`

# En production, utiliser un NFS ou volume partagé
docker run -v /nfs/avatars:/app/storage/avatars ecotrack-service-users

## Tests unitaires
Les scénarios critiques sont couverts par Jest afin de garantir la stabilité des flux d'upload et de persistance :
- [__tests__/controllers/avatarController.test.js](__tests__/controllers/avatarController.test.js) : vérifie les contrôles d'uploads (absence de fichier, dimensions insuffisantes, succès complet) ainsi que la suppression des avatars en base.
- [__tests__/services/avatarService.test.js](__tests__/services/avatarService.test.js) : contrôle le pipeline Sharp (génération des trois formats, nettoyage des fichiers temporaires), la persistance des URLs et les mutations du filesystem.

Les tests se lancent via `npm test` dans `service-users/` et reposent exclusivement sur des mocks (Sharp, filesystem, base PostgreSQL) pour rester hermétiques aux dépendances externes.

