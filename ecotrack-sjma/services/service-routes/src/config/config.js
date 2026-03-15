require('dotenv').config();

module.exports = {
  PORT: parseInt(process.env.APP_PORT, 10) || 3012,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://ecotrack_user:ecotrack_password@localhost:5432/ecotrack',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};
