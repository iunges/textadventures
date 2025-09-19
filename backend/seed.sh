#!/bin/bash
set -e

npx tsx ./src/db/clear.ts
NODE_OPTIONS='--import tsx' npx drizzle-kit push
npx tsx ./src/db/seedProcedures.ts
npx tsx ./src/db/seed.ts

echo "FIM"