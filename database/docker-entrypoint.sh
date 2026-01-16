#!/bin/sh
# ============================================================================
# Script d'entrée pour le container de migrations
# ============================================================================

set -e

echo "=========================================="
echo "  ECOTRACK - DATABASE MIGRATIONS"
echo "=========================================="

# Attendre que PostgreSQL soit vraiment prêt (au-delà du healthcheck)
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

# Exécuter les migrations
echo ""
echo "🔄 Running migrations..."
npm run migrate

# Exécuter les seeds (seulement si RUN_SEEDS=true)
if [ "$RUN_SEEDS" = "true" ]; then
  echo ""
  echo "🌱 Running seeds..."
  npm run seed
fi

echo ""
echo "✅ Database initialization complete!"
echo "=========================================="
