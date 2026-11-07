#!/bin/bash
# ASH - Entrypoint script for dynamic PORT binding on Render
set -e

PORT="${PORT:-80}"
echo "[ASH DBMS Platform] Starting server on port $PORT..."

# Update Apache port configuration dynamically
sed -i "s/80/$PORT/g" /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf

# Execute Apache in foreground
exec apache2-foreground
