# 🚀 START HERE - DSV Shipping Plugin

Welcome! This is your complete DSV Shipping Plugin for Vendure.

## 📦 What You Have

A production-ready NPM package for DSV shipping integration with:
- ✅ OAuth 2.0 authentication
- ✅ Real-time rate calculation
- ✅ Complete API integration
- ✅ Full TypeScript support
- ✅ Comprehensive documentation

## 🎯 Three Ways to Use This

### 1️⃣ Quick Start (10 minutes)
**Just want it working?**
→ Read **QUICKSTART.md**

### 2️⃣ Build & Install Locally (30 minutes)
**Want to install before publishing?**
→ Read **GETTING-STARTED.md**

Steps:
```bash
# 1. Install dependencies
npm install

# 2. Build the package
./build.sh

# 3. Install in your Vendure project
cd /path/to/your-vendure-project
npm install /path/to/agxchange-vendure-plugin-dsv-shipping-1.0.0.tgz
```

### 3️⃣ Publish to NPM (1 hour)
**Want to publish for everyone?**
→ Read **GETTING-STARTED.md** → "Publishing to NPM"

Steps:
```bash
# 1. Build
./build.sh

# 2. Login to NPM
npm login

# 3. Publish
npm publish --access public
```

Then anyone can install:
```bash
npm install @agxchange/vendure-plugin-dsv-shipping
```

## 📚 Documentation Guide

### For Setup & Configuration
1. **QUICKSTART.md** ⚡ - Get running in 10 minutes
2. **INSTALL.md** 📦 - All installation methods
3. **SETUP.md** 🔧 - Complete configuration guide
4. **GETTING-STARTED.md** 🏗️ - Build from source

### For Development
5. **EXAMPLES.md** 💡 - Code examples and patterns
6. **DEVELOPMENT.md** 🔬 - Technical deep-dive
7. **CHANGELOG.md** 📝 - All assumptions documented

### For Reference
8. **README.md** 📖 - Full documentation
9. **NPM-README.md** 📦 - NPM package description

## 🗂️ Package Structure

```
vendure-plugin-dsv-shipping/
├── src/                          # Source code
│   ├── index.ts                 # Main plugin
│   ├── types.ts                 # TypeScript types
│   ├── services/
│   │   ├── dsv-auth.service.ts # OAuth 2.0
│   │   └── dsv-api.service.ts  # API client
│   └── calculators/
│       └── dsv-rate.calculator.ts
│
├── dist/                        # Built code (after npm run build)
├── package.json                 # NPM config
├── tsconfig.json               # TypeScript config
├── build.sh                    # Build script ⭐
└── *.md                        # Documentation

⭐ Run ./build.sh to build everything!
```

## 🎬 Quick Commands

```bash
# Install dependencies
npm install

# Build the package
npm run build
# or use the build script:
./build.sh

# Watch for changes (development)
npm run watch

# Create installable package
npm pack

# Clean build files
npm run clean
```

## ✅ What Works Right Now

After building and installing, you can:
1. ✅ Get real-time DSV shipping quotes
2. ✅ Calculate rates for Air, Sea, Road, Rail
3. ✅ Configure multiple shipping methods
4. ✅ Cache quotes to reduce API calls
5. ✅ Track shipments via DSV API
6. ✅ Download shipping labels
7. ✅ Full debug logging

## 🔑 What You Need

Before using, get from DSV:
- OAuth email & password
- Subscription key
- Test MDM account number

See **SETUP.md** for how to get these.

## 🆘 Need Help?

1. **Can't build?** → Check GETTING-STARTED.md
2. **Can't install?** → Check INSTALL.md
3. **Can't configure?** → Check SETUP.md
4. **Want examples?** → Check EXAMPLES.md
5. **Technical questions?** → Check DEVELOPMENT.md

## 🚦 Recommended Path

For first-time users:

```
1. Read this file (you are here!) ✓
2. Read GETTING-STARTED.md
3. Run: npm install && ./build.sh
4. Read QUICKSTART.md
5. Configure and test
6. Read EXAMPLES.md for advanced usage
```

## 📧 Support

- GitHub Issues (when published)
- Email: support@agxchange.com
- DSV Support: developer.support@dsv.com

---

**Ready to start?** 
→ Next: Open **GETTING-STARTED.md**

Good luck! 🚀
