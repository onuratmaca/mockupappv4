#!/bin/sh
set -e

echo "🔨 Building client..."
node ./node_modules/vite/bin/vite.js build

echo "📦 Bundling server..."
node ./node_modules/esbuild/bin/esbuild server/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outfile=dist/index.js

echo "✅ Build finished!"