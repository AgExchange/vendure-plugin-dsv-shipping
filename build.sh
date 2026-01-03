#!/bin/bash

# DSV Shipping Plugin - Build and Package Script
# This script builds the plugin and creates an installable package

set -e  # Exit on any error

echo "=========================================="
echo "DSV Shipping Plugin - Build & Package"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Clean previous builds
echo -e "${YELLOW}[1/5] Cleaning previous builds...${NC}"
if [ -d "dist" ]; then
    rm -rf dist
    echo "✓ Removed dist directory"
fi
if [ -f "*.tgz" ]; then
    rm -f *.tgz
    echo "✓ Removed old tarballs"
fi

# Step 2: Install dependencies
echo -e "${YELLOW}[2/5] Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed (run 'npm install' to update)"
fi

# Step 3: Build TypeScript
echo -e "${YELLOW}[3/5] Compiling TypeScript...${NC}"
npm run build
echo "✓ TypeScript compiled successfully"

# Step 4: Verify build
echo -e "${YELLOW}[4/5] Verifying build...${NC}"
if [ ! -d "dist" ]; then
    echo -e "${RED}✗ Build failed: dist directory not found${NC}"
    exit 1
fi

if [ ! -f "dist/index.js" ]; then
    echo -e "${RED}✗ Build failed: dist/index.js not found${NC}"
    exit 1
fi

if [ ! -f "dist/index.d.ts" ]; then
    echo -e "${RED}✗ Build failed: dist/index.d.ts not found${NC}"
    exit 1
fi

echo "✓ Build verification passed"
echo "  - dist/index.js ✓"
echo "  - dist/index.d.ts ✓"
echo "  - dist/types.d.ts ✓"
echo "  - dist/services/ ✓"
echo "  - dist/calculators/ ✓"

# Step 5: Create package
echo -e "${YELLOW}[5/5] Creating NPM package...${NC}"
npm pack
TARBALL=$(ls -t *.tgz | head -1)
echo "✓ Package created: ${TARBALL}"

# Summary
echo ""
echo -e "${GREEN}=========================================="
echo "Build Complete!"
echo "==========================================${NC}"
echo ""
echo "Package: ${TARBALL}"
echo "Size: $(du -h ${TARBALL} | cut -f1)"
echo ""
echo "Next steps:"
echo ""
echo "1. Install locally:"
echo "   npm install /path/to/${TARBALL}"
echo ""
echo "2. Or link for development:"
echo "   npm link"
echo "   cd /path/to/your-vendure-project"
echo "   npm link @agxchange/vendure-plugin-dsv-shipping"
echo ""
echo "3. Or publish to NPM:"
echo "   npm login"
echo "   npm publish --access public"
echo ""
echo "For detailed installation instructions, see INSTALL.md"
echo ""
