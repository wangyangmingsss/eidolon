#!/usr/bin/env bash
set -euo pipefail

# Deploy all contracts to the selected network
# Usage: ./scripts/deploy-all.sh [testnet|mainnet]

NETWORK="${1:-testnet}"

echo "=== Deploying Eidolon contracts to $NETWORK ==="

cd packages/contracts

export DEPLOY_NETWORK="$NETWORK"

if [ "$NETWORK" = "mainnet" ]; then
  forge script script/Deploy.s.sol --rpc-url mainnet --broadcast --legacy
  echo "=== Mainnet deploy complete ==="
  echo "Update .env.local and Vercel envs with new addresses from addresses.mainnet.json"
else
  forge script script/Deploy.s.sol --rpc-url testnet --broadcast --legacy
  echo "=== Testnet deploy complete ==="
  echo "Update .env.local and Vercel envs with new addresses from addresses.testnet.json"
fi

cd ../..
echo "=== Done ==="
