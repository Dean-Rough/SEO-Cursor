#!/bin/bash
# SEO Wizard dev server launcher
# Kills port 3000 and starts Next.js dev server

echo "🧙 Starting SEO Wizard..."

# Kill anything on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✓ Cleared port 3000" || echo "✓ Port 3000 free"

# Start dev server
npm run dev
