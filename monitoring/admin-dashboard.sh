#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║              ECOTRACK - MONITORING DASHBOARD                     ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

check_service() {
    local name=$1
    local url=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo "  ✓ $name .................... UP"
        return 0
    else
        echo "  ✗ $name .................... DOWN"
        return 1
    fi
}

echo "┌──────────────────────────────────────────────────────────────────┐"
echo "│ SERVICES STATUS                                                 │"
echo "└──────────────────────────────────────────────────────────────────┘"

check_service "PostgreSQL" "localhost:5432" || true
check_service "API Gateway" "http://localhost:3000/health" || true
check_service "Service Users" "http://localhost:3010/health" || true
check_service "Service Containers" "http://localhost:3011/health" || true
check_service "Service Gamifications" "http://localhost:3014/health" || true
check_service "Prometheus" "http://localhost:9090/-/healthy" || true
check_service "Grafana" "http://localhost:3001/api/health" || true

echo ""
echo "┌──────────────────────────────────────────────────────────────────┐"
echo "│ DOCKER CONTAINERS                                               │"
echo "└──────────────────────────────────────────────────────────────────┘"
docker ps --filter "name=ecotrack" --format "  {{.Names}}: {{.Status}}"

echo ""
echo "┌──────────────────────────────────────────────────────────────────┐"
echo "│ LINKS                                                           │"
echo "└──────────────────────────────────────────────────────────────────┘"
echo "  🌐 Frontend:       http://localhost:5173"
echo "  🔌 API Gateway:    http://localhost:3000"
echo "  👥 Service Users:  http://localhost:3010"
echo "  📦 Service Containers: http://localhost:3011"
echo "  🏆 Gamifications:  http://localhost:3014"
echo "  🗄️  PostgreSQL:    localhost:5432"
echo "  🔧 PgAdmin:        http://localhost:5050"
echo "  📊 Prometheus:     http://localhost:9090"
echo "  📈 Grafana:        http://localhost:3001 (admin/admin)"
echo ""

echo "┌──────────────────────────────────────────────────────────────────┐"
echo "│ QUICK ACTIONS                                                    │"
echo "└──────────────────────────────────────────────────────────────────┘"
echo "  [1] Restart all services"
echo "  [2] View logs (API Gateway)"
echo "  [3] View logs (Service Users)"
echo "  [4] View logs (Prometheus)"
echo "  [5] Refresh status"
echo "  [q] Quit"
echo ""
read -p "  Choice: " choice

case $choice in
    1) docker compose -f ecotrack-sjma/docker-compose.yml restart ;;
    2) docker logs ecotrack-api-gateway -f --tail=50 ;;
    3) docker logs ecotrack-service-users -f --tail=50 ;;
    4) docker logs ecotrack-prometheus -f --tail=50 ;;
    5) exec "$0" ;;
    q|Q) exit 0 ;;
esac
