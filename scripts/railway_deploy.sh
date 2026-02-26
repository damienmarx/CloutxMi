#!/bin/bash
export RAILWAY_TOKEN=$1

# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Deploy
railway up --service cloutscape --detach
