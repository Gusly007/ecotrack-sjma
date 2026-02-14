// Rôle du fichier : point d'entrée Express, routes et gestion d'erreurs.
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { ZodError } from 'zod';
import morgan from 'morgan';
import swaggerSpec from './config/swagger.js';
import env, { validateEnv } from './config/env.js';
import pool, { ensureGamificationTables } from './config/database.js';
import actionsRoutes from './routes/actions.js';
import badgesRoutes from './routes/badges.js';
import defisRoutes from './routes/defis.js';
import classementRoutes from './routes/classement.js';
import notificationsRoutes from './routes/notifications.js';
import statsRoutes from './routes/stats.js';
import logger from './utils/logger.js';

const app = express();

app.set('trust proxy', 1);

if (env.nodeEnv !== 'test') {
  // En prod/dev, on s'assure que la config et les tables sont prêtes.
  validateEnv();
  await ensureGamificationTables();
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: env.nodeEnv === 'production' ? undefined : false
  })
);

app.use(cors());
app.use(express.json());
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      logger.info({ type: 'access', message: message.trim() }, 'HTTP request');
    }
  }
}));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'gamifications' });
});

app.use('/actions', actionsRoutes);
app.use('/badges', badgesRoutes);
app.use('/defis', defisRoutes);
app.use('/classement', classementRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/', statsRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Handler d'erreurs (Zod + autres)
app.use((err, req, res, next) => {
  // On gère Zod proprement pour renvoyer un message clair aux tests.
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Données invalides',
      details: err.issues.map((issue) => ({
        champ: Array.isArray(issue.path) ? issue.path.join('.') : '',
        message: issue.message
      }))
    });
  }

  const status = err?.status || 400;
  return res.status(status).json({
    error: err?.message || 'Erreur serveur'
  });
});

// 404 (si aucune route n'a matché)
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

let server;
if (env.nodeEnv !== 'test') {
  server = app.listen(env.port, () => {
    logger.info({ port: env.port }, 'Service gamification ready');
  });

  process.on('SIGINT', async () => {
    logger.info('Shutting down service gamification');
    await pool.end();
    server.close(() => {
      logger.info('Service gamification stopped');
      process.exit(0);
    });
  });
}

export default app;
