#!/usr/bin/env bash
# Loads the downloaded Atlas dump (/var/www/data/atlas_cluster_dump) into the
# local MongoDB container and points the backend at it.
#   cd /var/www/CISDERPPORTAL && bash backend/scripts/restore-from-dump.sh
# Nothing is dropped or deleted: the dump is only read, and the local database
# is only added to.
set -euo pipefail
cd "$(dirname "$0")/../.."

DUMP=${DUMP:-/var/www/data/atlas_cluster_dump}
DB=${MONGO_DB:-cisdcollege}
mkdir -p /var/www/data/mongo /var/www/data/backup

# 1. Mongo password (created once, never overwritten)
if ! grep -q '^MONGO_ROOT_PASSWORD=' .env 2>/dev/null; then
  echo "MONGO_ROOT_USER=cisd" >> .env
  echo "MONGO_ROOT_PASSWORD=$(openssl rand -hex 24)" >> .env
  chmod 600 .env
fi
set -a; source .env; set +a

# 2. Local database up
docker compose up -d mongo
until [ "$(docker inspect -f '{{.State.Health.Status}}' cisd_mongo)" = healthy ]; do sleep 3; done

# 3. Find the database folder inside the dump
if [ -d "$DUMP/$DB" ]; then SRC="$DUMP/$DB"
elif [ -d "$DUMP/dump/$DB" ]; then SRC="$DUMP/dump/$DB"
else
  echo "Could not find a '$DB' folder inside $DUMP. What is there:"
  ls -la "$DUMP"; ls -la "$DUMP"/dump 2>/dev/null || true
  exit 1
fi
echo "Restoring from: $SRC  ->  local database '$DB'"
GZ=""; ls "$SRC" | grep -q '\.gz$' && GZ="--gzip"

# 4. Restore (mongorestore adds documents; existing ones are skipped, never overwritten)
docker run --rm --network host -v "$SRC":/dump:ro mongo:7 \
  mongorestore --host 172.17.0.1 --port 27017 \
  --username "$MONGO_ROOT_USER" --password "$MONGO_ROOT_PASSWORD" --authenticationDatabase admin \
  --nsInclude "$DB.*" --db "$DB" $GZ /dump

# 5. Show what is in the local database now
docker exec cisd_mongo mongosh --quiet -u "$MONGO_ROOT_USER" -p "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin "$DB" \
  --eval 'let t=0; db.getCollectionNames().forEach(c=>{const n=db[c].estimatedDocumentCount(); t+=n; print(c.padEnd(40), n)}); print("\nTOTAL documents:", t)'

# 6. Point the backend at the local database, keep the old config for rollback
cp backend/.env backend/.env.atlas.bak && chmod 600 backend/.env.atlas.bak
LOCAL_URI="mongodb://$MONGO_ROOT_USER:$MONGO_ROOT_PASSWORD@host.docker.internal:27017/$DB?authSource=admin"
if grep -q '^MONGO_URI=' backend/.env; then
  sed -i "s#^MONGO_URI=.*#MONGO_URI=$LOCAL_URI#" backend/.env
else
  echo "MONGO_URI=$LOCAL_URI" >> backend/.env
fi

# 7. Restart the backend on the local DB + start the daily backup job
docker compose up -d --build backend mongo_backup
echo
echo "DONE. Backend now uses the local database. Daily backups: /var/www/data/backup/daily"
