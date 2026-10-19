#!/usr/bin/env bash
# Restore a daily backup archive into the local MongoDB.
#   bash backend/scripts/restore-local-backup.sh /var/www/data/backup/daily/<file>.archive.gz [target-db]
# Restores into <target-db> (default: cisdcollege_restored) so the live database
# is never overwritten; swap names yourself once you've checked the result.
set -euo pipefail
cd "$(dirname "$0")/../.."
set -a; source .env; set +a
FILE=${1:?usage: restore-local-backup.sh <archive.gz> [target-db]}
SRC=${MONGO_DB:-cisdcollege}
TARGET=${2:-${SRC}_restored}
docker run --rm --network bridge --add-host host.docker.internal:host-gateway \
  -v "$(dirname "$FILE"):/in:ro" mongo:7 \
  mongorestore --host host.docker.internal --username "$MONGO_ROOT_USER" --password "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin --gzip --archive="/in/$(basename "$FILE")" \
  --nsFrom "$SRC.*" --nsTo "$TARGET.*"
echo "Restored into database: $TARGET"
