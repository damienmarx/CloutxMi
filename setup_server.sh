#!/bin/bash
set -e

# Update and install dependencies
sudo apt-get update
sudo apt-get install -y curl git build-essential

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
sudo npm install -g pnpm

# Clone repository
git clone https://github.com/damienmarx/CloutxMi.git
cd CloutScape

# Install dependencies
pnpm install

# Build the project
pnpm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start the application
# Note: We need to set environment variables like DATABASE_URL
# For now, we'll start it in a way that it can be configured later
pm2 start pnpm --name "cloutscape" -- run start

