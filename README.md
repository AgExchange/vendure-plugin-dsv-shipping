# Vendure DSV Shipping Plugin

A production-ready Vendure 3.x plugin for DSV shipping integration with OAuth 2.0 authentication and Booking API v2 support.

## 🚀 Features

- ✅ **OAuth 2.0 Authentication** - Secure token management with automatic refresh
- ✅ **DSV Booking API v2** - Create real shipments with tracking
- ✅ **Rate Calculator** - Real-time shipping cost calculation
- ✅ **Fulfillment Handler** - Automatic booking creation on order fulfillment
- ✅ **Multi-Warehouse Support** - StockLocation integration with fallbacks
- ✅ **Extensive Logging** - Comprehensive debugging and monitoring
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Production Ready** - Tested with South African DSV operations

## 📦 Installation

```bash
npm install @agxchange/vendure-plugin-dsv-shipping
```

## 🔧 Quick Start

1. Copy `.env.template` to your project
2. Fill in your DSV credentials
3. Add plugin to `vendure-config.ts`
4. Restart Vendure
5. Configure shipping method in Admin UI

See full documentation below for detailed setup.

## 📋 Requirements

- Vendure 3.x
- Node.js 18+
- TypeScript 5.x
- Valid DSV API credentials
- DSV account with Booking API access

## 📚 Documentation

- [Installation Guide](./docs/INSTALLATION.md)
- [Configuration](./docs/CONFIGURATION.md)
- [API Reference](./docs/API.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## 🏗️ Architecture

### Services
- **DsvAuthService** - OAuth 2.0 token management
- **DsvBookingService** - Booking API v2 integration
- **DsvQuoteService** - Quote API (planned)

### Components
- **DsvRateCalculator** - Shipping rate calculation
- **DsvFulfillment Handler** - Order fulfillment integration

## 🔄 Version

**Current**: 0.4.9 (Production Ready)

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

## 📄 License

MIT

## 🆘 Support

For issues or questions:
- Check [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
- Review PM2 logs: `pm2 logs vendure-server | grep DSV`
- Open an issue on GitHub

---

**Built for AgXchange Agricultural Parts E-Commerce Platform**
