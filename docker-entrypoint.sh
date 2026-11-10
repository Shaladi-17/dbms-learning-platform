#!/bin/bash
# ASH - Entrypoint script for dynamic PORT binding & Environment injection on Render
set -e

PORT="${PORT:-80}"
echo "[ASH DBMS Platform] Starting server on port $PORT..."

# 1. Update Apache port configuration dynamically
sed -i "s/80/$PORT/g" /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf

# 2. Expose container/Render environment variables to Apache mod_php
cat <<EOF > /etc/apache2/conf-available/docker-env.conf
# Pass Render environment variables to PHP processes
PassEnv GEMINI_API_KEY
PassEnv GEMINI_MODEL
PassEnv APP_ENV
PassEnv RENDER
PassEnv PORT
EOF
a2enconf docker-env > /dev/null 2>&1 || true

# 3. Create a local secure .env file inside container from container env vars if missing
if [ ! -f /var/www/html/.env ] && [ -n "$GEMINI_API_KEY" ]; then
    echo "[ASH DBMS Platform] Generating container .env from Render environment variables..."
    echo "GEMINI_API_KEY=${GEMINI_API_KEY}" > /var/www/html/.env
    echo "GEMINI_MODEL=${GEMINI_MODEL:-gemini-3-flash-preview}" >> /var/www/html/.env
    echo "APP_ENV=${APP_ENV:-production}" >> /var/www/html/.env
    echo "RENDER=${RENDER:-true}" >> /var/www/html/.env
    chmod 600 /var/www/html/.env
    chown www-data:www-data /var/www/html/.env
fi

# 4. Execute Apache in foreground
exec apache2-foreground
