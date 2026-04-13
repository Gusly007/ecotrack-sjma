#!/bin/sh
# ============================================================================
# Script d'entrée pour le container de migrations
# ============================================================================

set -e

echo "=========================================="
echo "  ECOTRACK - DATABASE MIGRATIONS"
echo "=========================================="

# Afficher les variables d'environnement pour debug
echo ""
echo "📋 Environment configuration:"
echo "  DATABASE_URL: ${DATABASE_URL:-NOT SET}"
echo "  RUN_SEEDS: ${RUN_SEEDS:-false}"
echo ""

# Attendre que PostgreSQL soit vraiment prêt (au-delà du healthcheck)
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

# Vérifier la connexion PostgreSQL
echo "🔍 Testing PostgreSQL connection..."
if ! nc -zv postgres 5432 2>/dev/null; then
  echo "⚠️  Warning: Could not connect to postgres:5432, but continuing anyway..."
fi

# Exécuter les migrations
echo ""
echo "🔄 Running migrations..."
if npm run migrate; then
  echo "✅ Migrations completed successfully"
else
  echo "❌ Migrations failed!"
  echo "Checking migration files..."
  ls -la migrations/ || echo "No migrations directory found"
  exit 1
fi

# Exécuter les seeds (seulement si RUN_SEEDS=true)
if [ "$RUN_SEEDS" = "true" ]; then
  echo ""
  echo "🌱 Running seeds..."
  if npm run seed; then
    echo "✅ Seeds completed successfully"
  else
    echo "⚠️  Seeds failed, but continuing..."
  fi
fi

echo ""
echo "✅ Database initialization complete!"
echo "=========================================="
