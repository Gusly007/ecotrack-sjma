process.env.NODE_ENV = 'test';

if (!process.env.GAMIFICATIONS_DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.GAMIFICATIONS_DATABASE_URL =
    'postgresql://ecotrack_user:ecotrack_password@localhost:5432/ecotrack';
}
