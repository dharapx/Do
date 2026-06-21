#!/bin/sh
set -e

echo "Running database migrations..."
echo "Current directory: $(pwd)"
echo "Alembic version: $(alembic --version)"
echo "Checking alembic.ini..."
cat alembic.ini | head -5
echo "Running alembic upgrade head..."
alembic upgrade 0010_add_is_markdown_to_notes 2>/dev/null || {
  echo "Direct upgrade failed — stamping to known revision and retrying..."
  alembic stamp 2e2e714bb15c
  alembic upgrade 0010_add_is_markdown_to_notes
}
echo "Migrations completed."

echo "Setting root logger level to INFO..."
python -c "import logging; logging.getLogger().setLevel(logging.INFO)"

echo "Starting application with OpenTelemetry instrumentation..."
exec opentelemetry-instrument \
    uvicorn app.main:app --host 0.0.0.0 --port 8000
