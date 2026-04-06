# ============================================================================
# MAKEFILE ECOTRACK - COMMANDES RAPIDES
# ============================================================================
#
# Usage: make <commande>
#
# ============================================================================

.PHONY: help install up down logs status gateway-fix auth-fix db-migrate db-seed db-fresh db-reset db-status dev build test clean prod prod-up prod-down prod-logs

# Couleurs
CYAN=\033[0;36m
GREEN=\033[0;32m
YELLOW=\033[0;33m
MAGENTA=\033[0;35m
NC=\033[0m # No Color

# Aide par défaut
help:
	@echo ""
	@echo "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
	@echo "${CYAN}║              ECOTRACK - COMMANDES DISPONIBLES                ║${NC}"
	@echo "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
	@echo ""
	@echo "${GREEN}📦 INSTALLATION${NC}"
	@echo "  make install          Installer les dépendances"
	@echo ""
	@echo "${GREEN}🐳 DOCKER (Développement - PostgreSQL local)${NC}"
	@echo "  make up               Démarrer tous les services"
	@echo "  make up-db            Démarrer uniquement PostgreSQL + PgAdmin"
	@echo "  make down             Arrêter tous les services"
	@echo "  make logs             Afficher les logs (Ctrl+C pour quitter)"
	@echo "  make status           Afficher le statut des conteneurs"
	@echo "  make gateway-fix      Réparer le 504 login (recréation api-gateway)"
	@echo "  make auth-fix         Réparer login 504 (postgres + users + gateway)"
	@echo "  make clean            Supprimer conteneurs, volumes et images"
	@echo ""
	@echo "${MAGENTA}🚀 PRODUCTION (Neon cloud)${NC}"
	@echo "  make prod-up          Démarrer en production (Neon)"
	@echo "  make prod-down        Arrêter la production"
	@echo "  make prod-logs        Logs de production"
	@echo "  make prod-build       Construire les images de production"
	@echo ""
	@echo "${GREEN}🗄️  BASE DE DONNÉES${NC}"
	@echo "  make db-migrate       Exécuter les migrations"
	@echo "  make db-migrate-down  Annuler la dernière migration"
	@echo "  make db-seed          Insérer les données de test"
	@echo "  make db-fresh         Supprimer toutes les tables"
	@echo "  make db-reset         Reset complet (fresh + migrate + seed)"
	@echo "  make db-status        Afficher le statut de la BDD"
	@echo ""
	@echo "${GREEN}🔧 DÉVELOPPEMENT${NC}"
	@echo "  make dev              Démarrer en mode développement"
	@echo "  make build            Construire les images Docker"
	@echo "  make test             Exécuter les tests"
	@echo ""
	@echo "${GREEN}🌐 ACCÈS${NC}"
	@echo "  API Gateway:    http://localhost:3000"
	@echo "  Service Users:  http://localhost:3010"
	@echo "  Swagger:        http://localhost:3010/api-docs"
	@echo "  PgAdmin:        http://localhost:5050"
	@echo ""

# ============================================================================
# INSTALLATION
# ============================================================================

install:
	@echo "${CYAN}📦 Installation des dépendances...${NC}"
	cd database && npm install
	cd services/service-users && npm install
	cd services/api-gateway && npm install
	@echo "${GREEN}✅ Installation terminée${NC}"

# ============================================================================
# DOCKER
# ============================================================================

up:
	@echo "${CYAN}🐳 Démarrage de tous les services...${NC}"
	docker compose up -d
	@echo "${GREEN}✅ Services démarrés${NC}"
	@make status

up-db:
	@echo "${CYAN}🐳 Démarrage PostgreSQL + PgAdmin...${NC}"
	docker compose up -d postgres pgadmin
	@echo "${GREEN}✅ Base de données démarrée${NC}"
	@echo ""
	@echo "PgAdmin: http://localhost:5050"
	@echo "Login: admin@ecotrack.local / admin"

down:
	@echo "${YELLOW}🛑 Arrêt des services...${NC}"
	docker compose down
	@echo "${GREEN}✅ Services arrêtés${NC}"

logs:
	docker compose logs -f

status:
	@echo ""
	@docker compose ps
	@echo ""

gateway-fix:
	@echo "${YELLOW}🔧 Réparation api-gateway (erreur 504 login)...${NC}"
	-@docker rm -f ecotrack-api-gateway >/dev/null 2>&1 || true
	@docker compose up -d --no-deps api-gateway
	@echo "${GREEN}✅ api-gateway recréé${NC}"
	@echo ""
	@echo "Vérification rapide:"
	@docker exec ecotrack-api-gateway printenv
	@echo ""

auth-fix:
	@echo "${YELLOW}🔧 Réparation complète login (postgres + users + gateway)...${NC}"
	@docker compose up -d postgres
	@docker compose up -d --no-deps service-users
	@docker restart ecotrack-service-users
	@docker compose up -d --no-deps api-gateway
	@echo "${GREEN}✅ Services auth redémarrés${NC}"
	@echo ""
	@echo "Contrôle:"
	@docker compose ps postgres service-users api-gateway
	@echo ""

build:
	@echo "${CYAN}🔨 Construction des images...${NC}"
	docker compose build
	@echo "${GREEN}✅ Images construites${NC}"

clean:
	@echo "${YELLOW}🧹 Nettoyage complet...${NC}"
	docker compose down -v --rmi local
	@echo "${GREEN}✅ Nettoyage terminé${NC}"

# ============================================================================
# BASE DE DONNÉES
# ============================================================================

db-migrate:
	@echo "${CYAN}🔄 Exécution des migrations...${NC}"
	cd database && npm run migrate
	@echo "${GREEN}✅ Migrations appliquées${NC}"

db-migrate-down:
	@echo "${YELLOW}⏪ Annulation de la dernière migration...${NC}"
	cd database && npm run migrate:down
	@echo "${GREEN}✅ Migration annulée${NC}"

db-seed:
	@echo "${CYAN}🌱 Insertion des données de test...${NC}"
	cd database && npm run seed
	@echo "${GREEN}✅ Données insérées${NC}"

db-fresh:
	@echo "${YELLOW}🗑️  Suppression de toutes les tables...${NC}"
	cd database && npm run db:fresh
	@echo "${GREEN}✅ Tables supprimées${NC}"

db-reset:
	@echo "${YELLOW}🔄 Reset complet de la base de données...${NC}"
	cd database && npm run reset
	@echo "${GREEN}✅ Reset terminé${NC}"

db-status:
	@echo "${CYAN}📊 Statut de la base de données...${NC}"
	cd database && npm run db:status

# ============================================================================
# DÉVELOPPEMENT
# ============================================================================

dev:
	@echo "${CYAN}🚀 Démarrage en mode développement...${NC}"
	@echo "Démarrage de PostgreSQL..."
	docker compose up -d postgres pgadmin
	@echo "Attente de PostgreSQL..."
	@sleep 3
	@echo ""
	@echo "${GREEN}Base de données prête!${NC}"
	@echo ""
	@echo "Lancez maintenant dans 2 terminaux séparés:"
	@echo "  Terminal 1: cd services/service-users && npm run dev"
	@echo "  Terminal 2: cd services/api-gateway && npm run dev"
	@echo ""

test:
	@echo "${CYAN}🧪 Exécution des tests...${NC}"
	cd services/service-users && npm test
	@echo "${GREEN}✅ Tests terminés${NC}"

# ============================================================================
# PRODUCTION (Neon)
# ============================================================================

prod-up:
	@echo "${MAGENTA}🚀 Démarrage en PRODUCTION (Neon)...${NC}"
	docker compose -f docker-compose.prod.yml up -d
	@echo "${GREEN}✅ Production démarrée${NC}"

prod-down:
	@echo "${YELLOW}🛑 Arrêt de la production...${NC}"
	docker compose -f docker-compose.prod.yml down
	@echo "${GREEN}✅ Production arrêtée${NC}"

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f

prod-build:
	@echo "${MAGENTA}🔨 Construction des images de production...${NC}"
	docker compose -f docker-compose.prod.yml build
	@echo "${GREEN}✅ Images construites${NC}"

prod-status:
	@docker compose -f docker-compose.prod.yml ps
