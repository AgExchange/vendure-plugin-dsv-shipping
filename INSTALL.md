# Installation Guide

This guide explains how to install the DSV Shipping Plugin in your Vendure project.

## Option 1: Install from NPM (Published Package)

Once published to NPM registry:

```bash
npm install @agxchange/vendure-plugin-dsv-shipping
```

## Option 2: Install Locally (Before Publishing)

### Method A: Direct File Path

1. Place the plugin directory in your project or a known location
2. Install using file path:

```bash
# From same directory as your Vendure project
npm install ../vendure-plugin-dsv-shipping

# Or absolute path
npm install /path/to/vendure-plugin-dsv-shipping
```

### Method B: Create and Install Tarball

1. Build the plugin:
```bash
cd vendure-plugin-dsv-shipping
npm install
npm run build
```

2. Create tarball:
```bash
npm pack
```

This creates: `agxchange-vendure-plugin-dsv-shipping-1.0.0.tgz`

3. Install in your Vendure project:
```bash
cd /path/to/your-vendure-project
npm install /path/to/agxchange-vendure-plugin-dsv-shipping-1.0.0.tgz
```

### Method C: Link for Development

1. In the plugin directory:
```bash
cd vendure-plugin-dsv-shipping
npm install
npm run build
npm link
```

2. In your Vendure project:
```bash
cd /path/to/your-vendure-project
npm link @agxchange/vendure-plugin-dsv-shipping
```

This creates a symlink, so changes to the plugin are immediately reflected.

## Option 3: Install from GitHub

### Method A: Direct from GitHub

If you publish to GitHub:

```bash
npm install github:agxchange/vendure-plugin-dsv-shipping
```

Or with specific branch/tag:
```bash
npm install github:agxchange/vendure-plugin-dsv-shipping#main
npm install github:agxchange/vendure-plugin-dsv-shipping#v1.0.0
```

### Method B: Add to package.json

```json
{
  "dependencies": {
    "@agxchange/vendure-plugin-dsv-shipping": "github:agxchange/vendure-plugin-dsv-shipping"
  }
}
```

Then run:
```bash
npm install
```

## Publishing to NPM

If you want to publish this package to NPM:

### 1. Prerequisites

- NPM account (https://www.npmjs.com/signup)
- Package name available (@agxchange/vendure-plugin-dsv-shipping)
- Organization setup if using scoped package (@agxchange)

### 2. Login to NPM

```bash
npm login
```

### 3. Build the Package

```bash
npm install
npm run build
```

### 4. Test the Package Locally

```bash
# Create tarball
npm pack

# Install in test project
cd /path/to/test-vendure-project
npm install /path/to/agxchange-vendure-plugin-dsv-shipping-1.0.0.tgz

# Test it works
npm run dev
```

### 5. Publish

```bash
cd vendure-plugin-dsv-shipping

# Dry run (see what would be published)
npm publish --dry-run

# Public scoped package
npm publish --access public

# Or for private package (requires paid NPM account)
npm publish --access restricted
```

### 6. Verify

```bash
npm view @agxchange/vendure-plugin-dsv-shipping
```

## Verify Installation

After installing, verify in your Vendure project:

```bash
# Check it's installed
npm list @agxchange/vendure-plugin-dsv-shipping

# Try importing in your config
node -e "console.log(require('@agxchange/vendure-plugin-dsv-shipping'))"
```

## Configuration

Once installed, configure in your `vendure-config.ts`:

```typescript
import { DsvShippingPlugin } from '@agxchange/vendure-plugin-dsv-shipping';
import * as dotenv from 'dotenv';

dotenv.config();

export const config: VendureConfig = {
  // ... other config
  plugins: [
    // ... other plugins
    DsvShippingPlugin.init({
      clientEmail: process.env.DSV_CLIENT_EMAIL!,
      clientPassword: process.env.DSV_CLIENT_PASSWORD!,
      subscriptionKey: process.env.DSV_SUBSCRIPTION_KEY!,
      testMdmAccount: process.env.DSV_TEST_MDM!,
      environment: 'test',
      debugMode: true,
    }),
  ],
};
```

## Troubleshooting

### "Cannot find module '@agxchange/vendure-plugin-dsv-shipping'"

**Solution**: Ensure package is installed:
```bash
npm install @agxchange/vendure-plugin-dsv-shipping
```

### Build errors with TypeScript

**Solution**: The plugin requires TypeScript 5.3+. Update:
```bash
npm install typescript@^5.3.0 --save-dev
```

### Peer dependency warnings

**Solution**: Install required Vendure packages:
```bash
npm install @vendure/core@^3.0.0 @vendure/common@^3.0.0
```

### "Module not found" after npm link

**Solution**: Rebuild the plugin:
```bash
cd vendure-plugin-dsv-shipping
npm run build
```

## Updating

### From NPM
```bash
npm update @agxchange/vendure-plugin-dsv-shipping
```

### From Local
Rebuild and reinstall:
```bash
cd vendure-plugin-dsv-shipping
npm run build
npm pack
cd /path/to/your-project
npm install /path/to/agxchange-vendure-plugin-dsv-shipping-1.0.0.tgz --force
```

### From GitHub
```bash
npm install github:agxchange/vendure-plugin-dsv-shipping --force
```

## Uninstalling

```bash
npm uninstall @agxchange/vendure-plugin-dsv-shipping
```

If using npm link:
```bash
npm unlink @agxchange/vendure-plugin-dsv-shipping
```

## Next Steps

After installation, see:
- **QUICKSTART.md** - 10-minute setup guide
- **SETUP.md** - Complete configuration instructions
- **EXAMPLES.md** - Implementation patterns
- **README.md** - Full documentation
