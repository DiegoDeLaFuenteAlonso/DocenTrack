#!/usr/bin/env bash
set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Running migrations..."
python manage.py migrate

# Opcional: primera vez o entorno demo — establecer RUN_SEED=true en el servicio API en Render
if [ "${RUN_SEED:-}" = "true" ]; then
  echo "RUN_SEED=true: ejecutando seed_data..."
  python manage.py seed_data
fi

echo "Build completed!"
