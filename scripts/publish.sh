#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Publishing valai to npm...${NC}"
echo ""

# Check if logged in to npm
echo -e "${YELLOW}Checking npm login status...${NC}"
if ! npm whoami > /dev/null 2>&1; then
    echo -e "${RED}❌ You are not logged in to npm${NC}"
    echo -e "Please run: ${GREEN}npm login${NC}"
    exit 1
fi

NPM_USER=$(npm whoami)
echo -e "${GREEN}✓ Logged in as: ${NPM_USER}${NC}"
echo ""

# Navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Copy README and LICENSE to packages/core
echo -e "${YELLOW}Copying README.md and LICENSE to package...${NC}"
cp README.md packages/core/README.md
cp LICENSE packages/core/LICENSE
echo -e "${GREEN}✓ Files copied${NC}"
echo ""

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
npm test
echo -e "${GREEN}✓ All tests passed${NC}"
echo ""

# Build the package
echo -e "${YELLOW}Building package...${NC}"
npm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Navigate to core package
cd packages/core

# Show what will be published
echo -e "${YELLOW}Package contents:${NC}"
npm pack --dry-run
echo ""

# Confirm before publishing
read -p "Do you want to publish this package? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Publishing to npm...${NC}"
    npm publish --access public
    echo ""
    echo -e "${GREEN}✅ Successfully published valai to npm!${NC}"
    echo -e "View at: ${GREEN}https://www.npmjs.com/package/valai${NC}"
else
    echo -e "${YELLOW}Publish cancelled${NC}"
fi
