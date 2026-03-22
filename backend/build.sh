#!/usr/bin/env bash
set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running migrations..."
python manage.py migrate

# Opcional: SOLO primer deploy o cuando quieras recrear datos demo.
# Deja RUN_SEED sin definir o distinto de "true" en producción normal (evita builds más lentos y timeouts).
if [ "${RUN_SEED:-}" = "true" ]; then
  echo "RUN_SEED=true: ejecutando seed_data..."
  python manage.py seed_data
else
  echo "RUN_SEED no es 'true': omitiendo seed_data (recomendado en producción)."
fi

echo "Build completed!"
