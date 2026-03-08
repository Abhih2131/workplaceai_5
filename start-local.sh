#!/bin/bash
echo "============================================"
echo " HR Analytics Dashboard - Local Startup"
echo "============================================"
echo ""

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "[Option 1] Docker detected. Starting with Docker..."
    echo ""
    docker-compose up --build -d
    echo ""
    echo "Dashboard is starting at: http://localhost:8080"
    echo ""
    echo "To stop: docker-compose down"
    exit 0
fi

# Fallback: use npm
echo "[Option 2] Docker not found. Starting with npm..."
echo ""

# Copy local env if not present
if [ ! -f .env ]; then
    cp .env.local .env
    echo "Copied .env.local to .env"
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "Starting development server..."
echo "Dashboard will open at: http://localhost:8080"
echo ""
npm run dev
