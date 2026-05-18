'use strict';

const cors = require('cors');

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (ex. : Postman, appels serveur-à-serveur)
    if (!origin) return callback(null, true);

    // En développement ou si aucune origine n'est configurée, tout autoriser
    if (process.env.NODE_ENV !== 'production' || ALLOWED_ORIGINS.length === 0) {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`Origine non autorisée : ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

module.exports = cors(corsOptions);
