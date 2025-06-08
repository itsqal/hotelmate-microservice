#!/bin/bash
set -e

# Wait for the loyalty_db to be created
until psql -U "$POSTGRES_USER" -d loyalty_db -c '\q'; do
  echo "Waiting for loyalty_db to be ready..."
  sleep 2
done

# Apply the schema
psql -U "$POSTGRES_USER" -d loyalty_db -f /docker-entrypoint-initdb.d/01-loyalty-schema.sql 