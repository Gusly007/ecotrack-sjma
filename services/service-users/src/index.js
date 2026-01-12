import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import cors from 'cors';
import roleRoutes from './routes/roles.js';
import notificationRoutes from './routes/notifications.js';
import avatarRoutes from './routes/avatars.js';
import { errorHandler } from './middleware/errorHandler.js';
import { publicLimiter } from './config/rateLimit.js';
import pool, { ensureAuthTables } from './config/database.js';
import path from 'path';
import env from './config/env.js';
import { validateEnv } from './config/env.js';
import helmet from 'helmet';


const app = express();

// Needed when running behind a reverse proxy / API Gateway
app.set('trust proxy', 1);

if (env.nodeEnv !== 'test') {
  validateEnv();
}

if (env.nodeEnv !== 'test') {
  // Ensure minimal auth tables + sequences exist before serving requests.
  await ensureAuthTables();
}

app.use(helmet({
  // Swagger UI can break with strict CSP in dev; keep it simple for now.
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: env.nodeEnv === 'production' ? undefined : false
}));

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'users' });
});

// Routes
app.use('/auth', publicLimiter, authRoutes);
app.use('/users', userRoutes);
app.use('/users/avatar', avatarRoutes);
app.use('/admin/roles', roleRoutes);
app.use('/notifications', notificationRoutes);

// Servir les avatars en tant que fichiers statiques
app.use('/avatars', express.static(path.join(process.cwd(), 'storage/avatars')));

// Route for Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling (must be last)
app.use(errorHandler);

const server = app.listen(env.port, () => {
  console.log(`Server is running on port ${env.port}`);
  console.log(`Swagger docs available at http://localhost:${env.port}/api-docs`);
});

process.on('SIGINT', async () => {
  console.log('\n⛔ Shutting down...');
  await pool.end();
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

export default app;