import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swaggerConfig.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import cors from 'cors';
import dotenv from 'dotenv';
import roleRoutes from './routes/roles.js';
import notificationRoutes from './routes/notifications.js';
import { errorHandler } from './middleware/errorHandler.js';
import { publicLimiter } from './middleware/rateLimit.js';
import pool from './utils/db.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'users' });
});

// Routes
app.use('/auth', publicLimiter, authRoutes);
app.use('/users', userRoutes);
app.use('/admin/roles', roleRoutes);
app.use('/notifications', notificationRoutes);

// Route for Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3010;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
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