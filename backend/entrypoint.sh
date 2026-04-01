#!/bin/sh

echo "Esperando a que la base de datos esté lista..."
# Intentar aplicar las migraciones
python manage.py migrate --noinput

# Ejecutar el comando que viene del Dockerfile (el runserver)
exec "$@"