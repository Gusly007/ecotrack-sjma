# Configuration Dynamique - EcoTrack

## Vue d'ensemble

Les paramètres système sont maintenant stockés dans la table `configurations` en base de données, permettant aux administrateurs de les modifier sans redéploiement.

## Structure de la table

```sql
configurations (
  id              SERIAL PRIMARY KEY,
  cle             VARCHAR(100) UNIQUE NOT NULL,
  valeur          TEXT NOT NULL,
  type            VARCHAR(20) DEFAULT 'string',  -- string, number, boolean, json
  description     TEXT,
  categorie       VARCHAR(50) DEFAULT 'general',
  est_modifiable  BOOLEAN DEFAULT true,
  est_actif       BOOLEAN DEFAULT true,
  min_valeur      DECIMAL,
  max_valeur      DECIMAL,
  options         JSONB,
  created_at      TIMESTAMP,
  updated_at      TIMESTAMP
)
```

## Catégories disponibles

| Catégorie | Description |
|-----------|-------------|
| `jwt` | Configuration des tokens JWT |
| `security` | Paramètres de sécurité (bcrypt, lockout) |
| `session` | Gestion des sessions |
| `rate_limit` | Limitation de requêtes |
| `upload` | Upload de fichiers |
| `password` | Politique de mot de passe |
| `notifications` | Notifications email/push |

## Paramètres par défaut

### JWT
- `jwt.access_token_expiration`: `24h` (24 heures)
- `jwt.refresh_token_expiration`: `168h` (7 jours)

### Security
- `security.bcrypt_rounds`: `10`
- `security.max_login_attempts`: `5`
- `security.lockout_duration_minutes`: `15`

### Sessions
- `session.max_concurrent_sessions`: `3`
- `session.token_expiration_hours`: `168`

### Rate Limiting
- `rate_limit.window_ms`: `60000` (1 minute)
- `rate_limit.max_requests`: `100`
- `rate_limit.auth_window_ms`: `900000` (15 minutes)
- `rate_limit.auth_max_attempts`: `5`

### Upload
- `upload.max_file_size_mb`: `5` (5 MB)
- `upload.allowed_extensions`: `["jpg","jpeg","png","webp"]`
- `upload.max_files_per_request`: `5`

## API Admin

### Lister toutes les configurations
```http
GET /admin/config
Authorization: Bearer <token_admin>
```

### Lister par catégorie
```http
GET /admin/config/category/jwt
Authorization: Bearer <token_admin>
```

### Obtenir une configuration
```http
GET /admin/config/jwt.access_token_expiration
Authorization: Bearer <token_admin>
```

### Modifier une configuration
```http
PUT /admin/config/security.bcrypt_rounds
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "value": 12
}
```

### Modifier une configuration JSON
```http
PUT /admin/config/upload.allowed_extensions
Authorization: Bearer <token_admin>
Content-Type: application/json

{
  "value": ["jpg", "jpeg", "png", "webp", "gif"]
}
```

## Hiérarchie des valeurs

1. **Base de données** (table `configurations`) - Priorité haute
2. **Variables d'environnement** `.env` - Fallback

Si une clé existe en DB, elle est utilisée. Sinon, la valeur provient de `.env`.

## Cache

Les configurations sont mises en cache 30 secondes. Après modification via l'API, le cache est invalidé automatiquement.

## Ajouter une nouvelle configuration

1. Ajouter dans le seed `017_configurations_default.sql`:
```sql
INSERT INTO configurations (cle, valeur, type, description, categorie)
VALUES ('ma_cle', 'ma_valeur', 'string', 'Description', 'categorie');
```

2. Réexécuter le seed:
```bash
docker compose exec postgres psql -U ecotrack_user -d ecotrack -c "DELETE FROM configurations WHERE cle='ma_cle';"
docker compose exec migrations node scripts/seed.mjs
```

3. Utiliser dans le code:
```javascript
import env from './config/env.js';
const valeur = env.maCle; // ou via ConfigService
```
