# Getting Started - Build & Install

Complete guide to building and installing the DSV Shipping Plugin package.

## Package Structure

```
vendure-plugin-dsv-shipping/
├── src/                          # TypeScript source code
│   ├── index.ts                 # Main plugin entry
│   ├── types.ts                 # Type definitions
│   ├── services/                # Service layer
│   │   ├── dsv-auth.service.ts # OAuth 2.0 auth
│   │   └── dsv-api.service.ts  # API client
│   └── calculators/             # Shipping calculators
│       └── dsv-rate.calculator.ts
├── dist/                        # Compiled JavaScript (after build)
├── package.json                 # NPM package config
├── tsconfig.json               # TypeScript config
├── build.sh                    # Build script
├── .npmignore                  # NPM publish exclusions
├── .gitignore                  # Git exclusions
├── LICENSE                     # MIT license
└── Documentation/
    ├── README.md               # Full documentation
    ├── NPM-README.md          # NPM package README
    ├── INSTALL.md             # Installation guide
    ├── QUICKSTART.md          # Quick setup
    ├── SETUP.md               # Complete setup
    ├── EXAMPLES.md            # Code examples
    ├── DEVELOPMENT.md         # Technical docs
    └── CHANGELOG.md           # Version history
```

## Step-by-Step: Build & Use

### Step 1: Prepare the Package

Navigate to the plugin directory:

```bash
cd vendure-plugin-dsv-shipping
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- TypeScript compiler
- Vendure peer dependencies (for types)
- axios (HTTP client)
- node-cache (quote caching)

### Step 3: Build the Package

**Option A: Use the build script (recommended)**

```bash
./build.sh
```

This script will:
1. ✓ Clean previous builds
2. ✓ Install dependencies
3. ✓ Compile TypeScript
4. ✓ Verify build output
5. ✓ Create installable tarball

**Option B: Manual build**

```bash
# Clean
rm -rf dist

# Build
npm run build

# Create package
npm pack
```

### Step 4: Verify Build

Check that these files exist:

```bash
# Compiled JavaScript
ls -la dist/index.js
ls -la dist/types.js
ls -la dist/services/dsv-auth.service.js
ls -la dist/services/dsv-api.service.js
ls -la dist/calculators/dsv-rate.calculator.js

# TypeScript definitions
ls -la dist/index.d.ts
ls -la dist/types.d.ts

# Package tarball
ls -la agxchange-vendure-plugin-dsv-shipping-1.0.0.tgz
```

All these files should exist after successful build.

### Step 5: Install in Your Vendure Project

Now you have **three installation options**:

#### Option A: Install from Tarball (Production-like)

```bash
cd /path/to/your-vendure-project
npm install /path/to/vendure-plugin-dsv-shipping/agxchange-vendure-plugin-dsv-shipping-1.0.0.tgz
```

This installs the plugin just like it would be installed from NPM.

#### Option B: Link for Development (Live Updates)

In the plugin directory:
```bash
cd /path/to/vendure-plugin-dsv-shipping
npm link
```

In your Vendure project:
```bash
cd /path/to/your-vendure-project
npm link @agxchange/vendure-plugin-dsv-shipping
```

Benefits:
- Changes to plugin immediately reflected
- No need to rebuild/reinstall after changes
- Perfect for development

To unlink later:
```bash
npm unlink @agxchange/vendure-plugin-dsv-shipping
```

#### Option C: Direct File Path

```bash
cd /path/to/your-vendure-project
npm install ../vendure-plugin-dsv-shipping
```

### Step 6: Configure Vendure

Create `.env` file in your Vendure project:

```env
DSV_CLIENT_EMAIL=your-api-email@example.com
DSV_CLIENT_PASSWORD=YourAPIPassword123
DSV_SUBSCRIPTION_KEY=your-32-char-subscription-key
DSV_TEST_MDM=1234567890
DSV_ENVIRONMENT=test
```

Update `vendure-config.ts`:

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

### Step 7: Start Vendure

```bash
npm run dev
```

Look for initialization logs:

```
=================================================
[DSV Plugin] Initializing DSV Shipping Plugin
=================================================
[DSV Plugin] ✓ Configuration validation passed
[DSV Plugin] Test environment enabled
[DSV Plugin] Plugin initialized successfully
=================================================
```

### Step 8: Test the Plugin

1. Login to Vendure Admin
2. Go to Settings → Shipping methods
3. Create new method with DSV Rate Calculator
4. Test in storefront checkout

## Publishing to NPM

### Prerequisites

1. NPM account: https://www.npmjs.com/signup
2. Organization (optional): https://www.npmjs.com/org/create
3. Package name available: `@agxchange/vendure-plugin-dsv-shipping`

### Steps

1. **Login to NPM**

```bash
npm login
```

2. **Verify package.json**

Check these fields:
- `name`: "@agxchange/vendure-plugin-dsv-shipping"
- `version`: "1.0.0" (or current version)
- `description`: Accurate description
- `main`: "dist/index.js"
- `types`: "dist/index.d.ts"
- `files`: ["dist", "README.md", "CHANGELOG.md", "LICENSE"]

3. **Build and test**

```bash
./build.sh

# Test the tarball
cd /tmp/test-vendure-project
npm install /path/to/agxchange-vendure-plugin-dsv-shipping-1.0.0.tgz
npm run dev
```

4. **Dry run**

See what will be published:

```bash
npm publish --dry-run
```

5. **Publish**

For scoped public package:

```bash
npm publish --access public
```

For private package (requires paid account):

```bash
npm publish --access restricted
```

6. **Verify**

```bash
npm view @agxchange/vendure-plugin-dsv-shipping

# Or visit
# https://www.npmjs.com/package/@agxchange/vendure-plugin-dsv-shipping
```

### Publish Updates

1. Update version in package.json:
```json
{
  "version": "1.0.1"
}
```

2. Build and publish:
```bash
./build.sh
npm publish --access public
```

## GitHub Setup

### Create Repository

```bash
# Initialize git (if not already)
git init

# Add remote
git remote add origin https://github.com/agxchange/vendure-plugin-dsv-shipping.git

# Add files
git add .

# Commit
git commit -m "Initial commit - DSV Shipping Plugin v1.0.0"

# Push
git push -u origin main
```

### Install from GitHub

After pushing to GitHub:

```bash
# Install specific version
npm install github:agxchange/vendure-plugin-dsv-shipping#v1.0.0

# Install from main branch
npm install github:agxchange/vendure-plugin-dsv-shipping

# Or add to package.json
{
  "dependencies": {
    "@agxchange/vendure-plugin-dsv-shipping": "github:agxchange/vendure-plugin-dsv-shipping"
  }
}
```

## Troubleshooting

### Build fails with TypeScript errors

**Solution**: Install TypeScript:
```bash
npm install typescript@^5.3.0 --save-dev
```

### "Cannot find module" after install

**Solution**: Rebuild:
```bash
npm run build
```

### Peer dependency warnings

**Solution**: Install Vendure:
```bash
npm install @vendure/core@^3.0.0 @vendure/common@^3.0.0
```

### npm link not working

**Solution**: Unlink and relink:
```bash
npm unlink @agxchange/vendure-plugin-dsv-shipping
cd /path/to/vendure-plugin-dsv-shipping
npm run build
npm link
cd /path/to/your-vendure-project
npm link @agxchange/vendure-plugin-dsv-shipping
```

### Changes not reflected after npm link

**Solution**: Rebuild the plugin:
```bash
cd /path/to/vendure-plugin-dsv-shipping
npm run build
# Vendure will auto-reload if using npm run dev
```

## Maintenance

### Update dependencies

```bash
npm update
```

### Check outdated packages

```bash
npm outdated
```

### Rebuild

```bash
npm run clean
npm run build
```

### Watch mode for development

```bash
npm run watch
```

This rebuilds automatically when source files change.

## Next Steps

- **QUICKSTART.md** - Get running in 10 minutes
- **SETUP.md** - Complete configuration guide
- **EXAMPLES.md** - Implementation patterns
- **DEVELOPMENT.md** - Technical documentation
- **INSTALL.md** - All installation options

## Support

- GitHub Issues: https://github.com/agxchange/vendure-plugin-dsv-shipping/issues
- Email: support@agxchange.com
- DSV Support: developer.support@dsv.com
