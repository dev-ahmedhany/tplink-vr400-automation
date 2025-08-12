#!/bin/bash

# TP-Link VR400 Scraper Setup Script

echo "🚀 Setting up TP-Link VR400 Scraper..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 16 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your router details:"
    echo "   - URL: Your router's IP address (e.g., http://192.168.1.1)"
    echo "   - PASSWORD: Your router admin password"
    echo ""
    echo "Edit command: nano .env"
else
    echo "✅ .env file already exists"
fi

# Create data directory
mkdir -p data
echo "✅ Data directory created"

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your router details: nano .env"
echo "2. Run the scraper: npm start"
echo ""
echo "For more information, see README.md"
