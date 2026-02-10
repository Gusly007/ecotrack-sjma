// Rôle du fichier : charger les variables d'environnement du service.
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '..', '.env'),
  path.resolve(process.cwd(), '..', '..', '.env')
];

for (const candidate of candidates) {
  try {
    dotenv.config({ path: candidate });
  } catch (_) {
    // ignore
  }
}

// Petit helper pour éviter les NaN sur le port.
const toInteger = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const env = {
  get nodeEnv() {
    return process.env.NODE_ENV || 'development';
  },
  get port() {
    return toInteger(process.env.GAMIFICATIONS_PORT || process.env.PORT, 3014);
  },
  get databaseUrl() {
    return process.env.GAMIFICATIONS_DATABASE_URL || process.env.DATABASE_URL;
  }
};

export const validateEnv = () => {
  // Vérifie les variables critiques avant de démarrer le service.
  const missing = [];
  if (!env.databaseUrl) missing.push('GAMIFICATIONS_DATABASE_URL/DATABASE_URL');
  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes: ${missing.join(', ')}`);
  }
};

export default env;
