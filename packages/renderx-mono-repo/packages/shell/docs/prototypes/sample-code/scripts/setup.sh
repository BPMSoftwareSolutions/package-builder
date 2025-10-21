#!/bin/bash

# BPM AI Speech-to-Articles Setup Script
# This script helps set up the development environment

set -e

echo "🎙️  Setting up BPM AI Speech-to-Articles Pipeline..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version 20+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys and configuration"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
mkdir -p .logs
echo "✅ Logs directory created"

# Check if ffmpeg is available (optional but recommended)
if command -v ffmpeg &> /dev/null; then
    echo "✅ ffmpeg detected - audio processing will be available"
else
    echo "⚠️  ffmpeg not found - audio normalization will be limited"
    echo "   Install ffmpeg for better audio processing capabilities"
fi

# Run initial build to check everything works
echo "🔨 Running initial build check..."
npm run build

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your OpenAI API key and other settings"
echo "2. Add audio files to data/raw/ directory"
echo "3. Run 'npm run pipeline' to process your first audio file"
echo ""
echo "Available commands:"
echo "  npm run dev        - Run CLI in development mode"
echo "  npm run pipeline   - Run full pipeline"
echo "  npm run transcribe - Transcribe audio only"
echo "  npm run compose    - Generate articles only"
echo "  npm run publish    - Publish articles only"
echo "  npm test           - Run tests"
echo ""
echo "For help: npm run dev -- --help"
