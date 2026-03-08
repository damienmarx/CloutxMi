#!/usr/bin/env bash
###############################################################################
# Degens¤Den Quick Deploy Script
# One-command setup for fresh clones
# Usage: ./quick-deploy.sh
###############################################################################
set -euo pipefail

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🎰 DEGENS¤DEN QUICK DEPLOY 🎰"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if running as root
if [[ "$EUID" -ne 0 ]]; then
  echo "⚠️  This script requires root privileges. Re-running with sudo..."
  exec sudo bash "$0" "$@"
fi

# Detect script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "📁 Working directory: $SCRIPT_DIR"
echo ""

# Check if .env exists
if [[ ! -f ".env" ]]; then
  echo "⚠️  No .env file found!"
  echo ""
  echo "Creating .env from .env.example..."
  
  if [[ -f ".env.example" ]]; then
    cp .env.example .env
    echo "✅ .env created!"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your credentials:"
    echo "   - DISCORD_BOT_TOKEN"
    echo "   - DISCORD_GUILD_ID"
    echo ""
    read -p "Press ENTER after editing .env, or CTRL+C to exit..."
  else
    echo "❌ .env.example not found. Cannot proceed."
    exit 1
  fi
fi

# Check if aio.sh exists
if [[ ! -f "aio.sh" ]]; then
  echo "❌ aio.sh not found in current directory!"
  echo "   Make sure you're in the CloutxMi repository root."
  exit 1
fi

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x aio.sh start-production.sh check-status.sh 2>/dev/null || true

# Run the all-in-one installer
echo ""
echo "🚀 Starting automated deployment..."
echo "   This will:"
echo "   - Install all dependencies"
echo "   - Set up MySQL database"
echo "   - Build application"
echo "   - Start services"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Execute aio.sh
bash aio.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ DEPLOYMENT COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Check system status:"
echo "   bash check-status.sh"
echo ""
echo "📝 View logs:"
echo "   tail -f logs/degensden.log"
echo ""
echo "📖 Read deployment guide:"
echo "   cat DEPLOYMENT_STATUS.md"
echo ""
echo "🎰 Your casino is ready!"
echo ""
