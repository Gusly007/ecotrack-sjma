#!/usr/bin/env bash
# ==============================================================================
# EcoTrack — Script de sauvegarde automatique PostgreSQL
#
# Usage:
#   ./scripts/backup.sh                     # Sauvegarde complète (dump + rotation)
#   ./scripts/backup.sh --dry-run           # Simulation sans écriture
#   ./scripts/backup.sh --retention 14      # Conserver 14 jours (défaut: 7)
#   ./scripts/backup.sh --output /chemin    # Répertoire de sortie personnalisé
#
# Appel via cron (quotidien à 02h00) :
#   0 2 * * * /app/database/scripts/backup.sh >> /var/log/ecotrack-backup.log 2>&1
#
# Variables d'environnement :
#   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE (chargées depuis .env)
# ==============================================================================

set -euo pipefail

# ── Paramètres par défaut ───────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
ENV_FILE="$PROJECT_ROOT/.env"

BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups/db}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
DRY_RUN=false
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="ecotrack_backup_${TIMESTAMP}"

# ── Couleurs log ────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log_info()    { echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO${NC}  $*"; }
log_success() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] OK${NC}    $*"; }
log_warn()    { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARN${NC}  $*"; }
log_error()   { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR${NC} $*" >&2; }

# ── Parsing arguments ────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)      DRY_RUN=true ;;
    --retention)    RETENTION_DAYS="$2"; shift ;;
    --output)       BACKUP_DIR="$2"; shift ;;
    *) log_error "Argument inconnu: $1"; exit 1 ;;
  esac
  shift
done

# ── Chargement des variables d'environnement ─────────────────────────────────

if [[ -f "$ENV_FILE" ]]; then
  set -o allexport
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +o allexport
  log_info "Variables chargées depuis $ENV_FILE"
else
  log_warn ".env non trouvé — utilisation des variables d'environnement existantes"
fi

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-ecotrack_user}"
PGDATABASE="${PGDATABASE:-ecotrack}"

# ── Vérifications préalables ─────────────────────────────────────────────────

if ! command -v pg_dump &>/dev/null; then
  log_error "pg_dump introuvable. Installez postgresql-client."
  exit 1
fi

if ! PGPASSWORD="${PGPASSWORD:-}" pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -q; then
  log_error "Impossible de joindre PostgreSQL ($PGHOST:$PGPORT/$PGDATABASE)"
  exit 1
fi

log_info "PostgreSQL accessible — $PGHOST:$PGPORT/$PGDATABASE"

# ── Création du répertoire de sauvegarde ────────────────────────────────────

if [[ "$DRY_RUN" == false ]]; then
  mkdir -p "$BACKUP_DIR"
fi

BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.sql.gz"
CHECKSUM_FILE="$BACKUP_DIR/${BACKUP_NAME}.sha256"
LATEST_LINK="$BACKUP_DIR/latest.sql.gz"

# ── Sauvegarde pg_dump ───────────────────────────────────────────────────────

log_info "Démarrage pg_dump → $BACKUP_FILE"

if [[ "$DRY_RUN" == true ]]; then
  log_info "[DRY-RUN] pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE | gzip > $BACKUP_FILE"
else
  PGPASSWORD="${PGPASSWORD:-}" pg_dump \
    -h "$PGHOST" \
    -p "$PGPORT" \
    -U "$PGUSER" \
    -d "$PGDATABASE" \
    --no-owner \
    --no-acl \
    --format=plain \
    --encoding=UTF8 \
    | gzip -9 > "$BACKUP_FILE"

  BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
  log_success "Dump compressé: $BACKUP_FILE ($BACKUP_SIZE)"

  # Checksum SHA-256 pour intégrité
  sha256sum "$BACKUP_FILE" > "$CHECKSUM_FILE"
  log_success "Checksum: $CHECKSUM_FILE"

  # Lien symbolique vers la dernière sauvegarde
  ln -sf "$BACKUP_FILE" "$LATEST_LINK"
fi

# ── Rotation : suppression des sauvegardes anciennes ─────────────────────────

log_info "Rotation — conservation des $RETENTION_DAYS derniers jours"

if [[ "$DRY_RUN" == true ]]; then
  EXPIRED=$(find "$BACKUP_DIR" -name "ecotrack_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" 2>/dev/null || true)
  if [[ -n "$EXPIRED" ]]; then
    log_info "[DRY-RUN] Fichiers qui seraient supprimés:"
    echo "$EXPIRED"
  else
    log_info "[DRY-RUN] Aucun fichier expiré"
  fi
else
  DELETED=0
  while IFS= read -r -d '' OLD_FILE; do
    OLD_CHECKSUM="${OLD_FILE%.sql.gz}.sha256"
    rm -f "$OLD_FILE" "$OLD_CHECKSUM"
    log_info "Supprimé: $OLD_FILE"
    ((DELETED++))
  done < <(find "$BACKUP_DIR" -name "ecotrack_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -print0 2>/dev/null)

  if [[ $DELETED -eq 0 ]]; then
    log_info "Aucun fichier expiré à supprimer"
  else
    log_success "$DELETED sauvegarde(s) expirée(s) supprimée(s)"
  fi
fi

# ── Inventaire des sauvegardes disponibles ───────────────────────────────────

log_info "Sauvegardes disponibles dans $BACKUP_DIR:"
if ls "$BACKUP_DIR"/ecotrack_backup_*.sql.gz 1>/dev/null 2>&1; then
  ls -lh "$BACKUP_DIR"/ecotrack_backup_*.sql.gz
else
  log_warn "Aucune sauvegarde trouvée"
fi

# ── Résumé ───────────────────────────────────────────────────────────────────

log_success "Sauvegarde terminée: $BACKUP_NAME"
log_info "Pour restaurer:"
log_info "  gunzip -c $BACKUP_FILE | psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE"
