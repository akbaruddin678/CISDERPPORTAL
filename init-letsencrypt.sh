#!/bin/sh
# One-time issuance of the Let's Encrypt certificate (covers both domains).
# Prereqs: DNS A records for both domains point to this server, ports 80/443 are open.
# Usage: ./init-letsencrypt.sh you@example.com
set -e

EMAIL="${1:?Usage: ./init-letsencrypt.sh <email>}"
DOMAIN_MAIN="cisd.cisdportal.online"
DOMAIN_API="apicisd.cisdportal.online"

mkdir -p certbot/conf certbot/www

# Standalone mode: nginx isn't running yet (it needs the cert to start)
docker compose run --rm -p 80:80 --entrypoint certbot certbot certonly \
  --standalone \
  --email "$EMAIL" --agree-tos --no-eff-email \
  -d "$DOMAIN_MAIN" -d "$DOMAIN_API"

docker compose up -d --build
echo "Done. https://$DOMAIN_MAIN and https://$DOMAIN_API should be live."
