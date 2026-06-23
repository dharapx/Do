#!/bin/sh
set -e

echo "Running database migrations..."
echo "Current directory: $(pwd)"
echo "Alembic version: $(alembic --version)"
echo "Checking alembic.ini..."
cat alembic.ini | head -5

# Resolve migration branches first — stamp to main chain if on hash branch
CURRENT=$(alembic current 2>/dev/null | head -1)
echo "Current revision: ${CURRENT:-<none>}"

if echo "$CURRENT" | grep -q "2e2e714bb15c"; then
  echo "On task-hierarchy branch — stamping to main chain at 0010..."
  alembic stamp 0010_add_is_markdown_to_notes
elif [ -z "$CURRENT" ] || echo "$CURRENT" | grep -qi "none"; then
  echo "Fresh database — stamping to common ancestor 0004..."
  alembic stamp 0004
elif echo "$CURRENT" | grep -q "0004"; then
  echo "At common ancestor — no action needed"
fi

# Run our new migration
echo "Running migration 0011..."
alembic upgrade 0011

echo "Migrations completed."

echo "Setting root logger level to INFO..."
python -c "import logging; logging.getLogger().setLevel(logging.INFO)"

# Ensure uploads directory is writable by appuser
# Docker named volumes are root-owned; this fixes it at runtime
mkdir -p /app/uploads
chown -R appuser:appgroup /app/uploads

echo "Starting application with OpenTelemetry instrumentation..."
exec su -s /bin/sh appuser -c "opentelemetry-instrument uvicorn app.main:app --host 0.0.0.0 --port 8000"
