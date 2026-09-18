#!/bin/sh
# Production migration runner — runs before API starts
set -e

echo "Running Prisma migrations..."
cd /app && npx prisma migrate deploy

echo "Migrations complete."
