#!/bin/bash
# Start script for WinTrades Global Trading Platform

set -e

# Set environment variables
export APACHE_DOCUMENT_ROOT=${APACHE_DOCUMENT_ROOT:-/var/www/html}
export APACHE_LOG_DIR=${APACHE_LOG_DIR:-/var/log/apache2}

# Create log directories
mkdir -p /var/log/apache2
mkdir -p /var/www/html/logs
mkdir -p /var/www/html/cache

# Set permissions
chown -R www-data:www-data /var/www/html/logs
chown -R www-data:www-data /var/www/html/cache
chmod -R 755 /var/www/html

# Start cron daemon
cron

# Start supervisor to manage all services
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf