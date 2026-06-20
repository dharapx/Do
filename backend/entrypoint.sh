#!/bin/sh
set -e

echo "Running database migrations..."
echo "Current directory: $(pwd)"
echo "Alembic version: $(alembic --version)"
echo "Checking alembic.ini..."
cat alembic.ini | head -5
echo "Running alembic upgrade head..."
alembic upgrade head
echo "Migrations completed."

echo "Starting application with OpenTelemetry instrumentation..."
exec opentelemetry-instrument \
    uvicorn app.main:app --host 0.0.0.0 --port 8000
