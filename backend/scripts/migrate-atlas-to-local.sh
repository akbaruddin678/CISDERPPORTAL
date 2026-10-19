#!/usr/bin/env bash
# One-time migration of the live Atlas database to the local MongoDB container.
# Run ON THE SERVER from the project folder:   bash backend/scripts/migrate-atlas-to-local.sh
#
# Non-destructive: Atlas is only READ; the local DB is only ever added to; the
# old backend/.env is kept as backend/.env.atlas.bak so you can roll back.
set -euo pipefail

cd "$(dirname "$0")/../.."          # project root (where docker-compose.yml is)
DATA=/var/www/data
STAMP=$(date +%F_%H%M)
DB=${MONGO_DB:-cisdcollege}

mkdir -p "$DATA/mongo" "$DATA/backup"

# 1. Root .env with the Mongo password (created once, never overwritten)
if ! grep -q '^MONGO_ROOT_PASSWORD=' .env 2>/dev/null; then
  echo "MONGO_ROOT_USER=cisd"                       >> .env
  echo "MONGO_ROOT_PASSWORD=$(openssl rand -hex 24)" >> .env
  chmod 600 .env
fi
set -a; source .env; set +a

# 2. Start the local database
docker compose up -d mongo
echo "Waiting for local MongoDB..."
until [ "$(docker inspect -f '{{.State.Health.Status}}' cisd_mongo)" = healthy ]; do sleep 3; done

# 3a. The running backend image predates these scripts — rebuild it first
#     (build only; nothing is restarted, the live site is untouched).
docker compose build backend

# 3. Export EVERYTHING from Atlas (still the active MONGO_URI) into a dated backup
docker compose run --rm -v "$DATA/backup:/backup" backend \
  node scripts/db-backup.mjs --out "/backup/atlas-$STAMP"

# 4. Restore that export into the local database
LOCAL_URI="mongodb://$MONGO_ROOT_USER:$MONGO_ROOT_PASSWORD@host.docker.internal:27017/$DB?authSource=admin"
docker compose run --rm -v "$DATA/backup:/backup" backend \
  node scripts/db-restore.mjs --from "/backup/atlas-$STAMP" --uri "$LOCAL_URI"

# 5. Point the backend at the local database (old config kept for rollback)
cp backend/.env backend/.env.atlas.bak && chmod 600 backend/.env.atlas.bak
sed -i "s#^MONGO_URI=.*#MONGO_URI=$LOCAL_URI#" backend/.env

# 6. Rebuild backend + start the daily backup job. Data lives in $DATA/mongo,
#    so this cannot delete the database. NEVER run `rm -rf $DATA`.
docker compose up -d --build backend mongo_backup

echo
echo "Done. Atlas export:  $DATA/backup/atlas-$STAMP"
echo "Daily backups:       $DATA/backup/daily  (02:00, last 30 kept)"
echo "Rollback:            cp backend/.env.atlas.bak backend/.env && docker compose up -d --build backend"
