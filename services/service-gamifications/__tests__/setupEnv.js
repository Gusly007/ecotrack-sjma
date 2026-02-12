process.env.NODE_ENV = 'test';

// Use environment variable if set (CI), otherwise use default (local Docker)
if (!process.env.GAMIFICATIONS_DATABASE_URL && !process.env.DATABASE_URL) {
  // Default for local Docker (port 5435)
  process.env.GAMIFICATIONS_DATABASE_URL =
    'postgresql://ecotrack:ecotrack@127.0.0.1:5435/ecotrack_test';
}

// Enable auto schema creation for tests
process.env.GAMIFICATIONS_AUTO_SCHEMA = 'true';
