#!/bin/bash
# Seed production database
# Usage: ./scripts/seed-production.sh

echo "🌱 Seeding production database..."
echo ""
echo "⚠️  WARNING: This will add/update records in PRODUCTION"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Generating Prisma Client..."
npx prisma generate

echo ""
echo "🌱 Running seed script..."
npm run prisma:seed

echo ""
echo "✅ Seed complete!"

