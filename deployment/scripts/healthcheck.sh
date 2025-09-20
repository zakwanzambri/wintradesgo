#!/bin/bash
# Health check script for WinTrades Global Trading Platform

# Check if Apache is running
if ! pgrep -x "apache2" > /dev/null; then
    echo "Apache is not running"
    exit 1
fi

# Check if the application responds
if ! curl -f -s http://localhost/health > /dev/null; then
    echo "Application health check failed"
    exit 1
fi

# Check database connectivity
if ! curl -f -s http://localhost/api/health/database > /dev/null; then
    echo "Database health check failed"
    exit 1
fi

# Check Redis connectivity
if ! curl -f -s http://localhost/api/health/redis > /dev/null; then
    echo "Redis health check failed"
    exit 1
fi

# Check trading engine
if ! curl -f -s http://localhost/api/health/trading > /dev/null; then
    echo "Trading engine health check failed"
    exit 1
fi

echo "All health checks passed"
exit 0