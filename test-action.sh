#!/bin/bash

# Test action locally
export GITHUB_WORKSPACE=$(pwd)
export INPUT_MODELS_PATH="fixtures/broken-project"
export INPUT_FORMAT="json"
export INPUT_GITHUB_TOKEN="test-token"

echo "🧪 Testing Orvyen GitHub Action..."
echo ""

node dist/action/index.js
