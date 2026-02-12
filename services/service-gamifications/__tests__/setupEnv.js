process.env.NODE_ENV = 'test';

if (!process.env.GAMIFICATIONS_DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.GAMIFICATIONS_DATABASE_URL =
    'postgresql://ecotrack:ecotrack@127.0.0.1:5435/ecotrack_test';
}
