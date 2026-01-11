# DSV Shipping Plugin for Vendure 3.x

Real-time shipping rate calculation using DSV's Global Transport & Logistics API.

**Current Version**: 0.2.0  
**Phase**: Phase 1 - OAuth + Quote API  
**Status**: ✅ Production Ready

## Features

### Phase 1 (✅ Implemented)
- ✅ OAuth 2.0 authentication with automatic token refresh
- ✅ Real-time shipping quotes via DSV Quote API
- ✅ Support for all 4 transport modes (Air, Sea, Road, Rail)
- ✅ Intelligent package calculation from order items
- ✅ Quote caching (5-minute TTL)
- ✅ Comprehensive error handling and logging
- ✅ Dashboard testing capability

### Future Phases (Planned)
- ⏸️ Phase 2: Booking API integration
- ⏸️ Phase 3: Tracking API + Webhook integration
- ⏸️ Phase 4: Label printing
- ⏸️ Phase 5: Document upload/download

## Installation

### 1. Install Package

```bash
npm install @agxchange/vendure-plugin-dsv-shipping
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# ============================================
# DSV Generic API - OAuth Authentication
# ============================================
DSV_CLIENT_EMAIL=your-email@company.com
DSV_CLIENT_PASSWORD=your-password
DSV_TEST_MDM=2838182313
DSV_ENVIRONMENT=test  # or 'production'

# ============================================
# DSV API Subscription Keys
# ============================================

# Access Token API - for OAuth authentication
DSV_ACCESS_TOKEN_KEY=your-access-token-subscription-key

# Quote API - for shipping rate calculations
DSV_QUOTE_API_KEY=7d43a8e7ec2444d2b4d82297ab45d19c

# ============================================
# Plugin Settings
# ============================================
DSV_QUOTE_CACHE_TTL=300  # seconds
DSV_DEBUG_MODE=true
```

### 3. Register Plugin in Vendure Config

```typescript
// src/vendure-config.ts
import { DsvShippingPlugin } from '@agxchange/vendure-plugin-dsv-shipping';

export const config: VendureConfig = {
  // ... other config
  plugins: [
    DsvShippingPlugin.init({
      // OAuth Configuration
      auth: {
        clientEmail: process.env.DSV_CLIENT_EMAIL!,
        clientPassword: process.env.DSV_CLIENT_PASSWORD!,
        accessTokenKey: process.env.DSV_ACCESS_TOKEN_KEY!,
        environment: process.env.DSV_ENVIRONMENT as 'test' | 'production',
      },
      
      // API Subscription Keys
      subscriptionKeys: {
        quote: process.env.DSV_QUOTE_API_KEY!,
        // Future phases:
        // booking: process.env.DSV_BOOKING_API_KEY,
        // tracking: process.env.DSV_TRACKING_API_KEY,
        // webhook: process.env.DSV_WEBHOOK_API_KEY,
      },
      
      // Test Account
      testMdmAccount: process.env.DSV_TEST_MDM!,
      
      // Feature Flags
      features: {
        quote: true,       // Phase 1: ENABLED
        booking: false,    // Phase 2: Not yet implemented
        tracking: false,   // Phase 3: Not yet implemented
        webhooks: false,   // Phase 4: Not yet implemented
        labels: false,     // Phase 5: Not yet implemented
      },
      
      // Optional Settings
      quoteCacheTTL: parseInt(process.env.DSV_QUOTE_CACHE_TTL || '300'),
      debugMode: process.env.DSV_DEBUG_MODE === 'true',
    }),
    // ... other plugins
  ],
};
```

### 4. Build and Start Vendure

```bash
npm run build
npm run dev
```

## Usage

### Create Shipping Method in Dashboard

1. Navigate to **Settings → Shipping Methods**
2. Click **Create new shipping method**
3. Configure:
   - **Name**: "DSV Air Freight Express"
   - **Code**: "dsv-air-freight"
   - **Eligibility Checker**: Select "Default shipping eligibility checker"
   - **Shipping Calculator**: Select **"DSV Real-Time Shipping Rate Calculator"**
4. Configure calculator arguments:
   - **Transport Mode**: Air / Sea / Road / Rail
   - **Service Level**: Express / Standard / Economy
   - **Tax Rate**: 15 (for 15% VAT)
   - **Include Insurance**: Yes/No
   - For Air: Set origin/destination airport codes (e.g., JNB, FRA)
   - For Sea: Set origin/destination port codes (e.g., ZADUR, USNYC)
5. **Fulfillment Handler**: Select "Manual fulfillment" (Phase 2 will add DSV handler)
6. Save

### Test Calculator in Dashboard

1. Open the shipping method
2. Click **"Test calculator"** button
3. Enter test order details:
   - Shipping address
   - Order items
4. Click **"Run test"**
5. Verify rate is calculated successfully

### Customer Checkout Flow

When customers check out:
1. They enter shipping address
2. Shop API calls `eligibleShippingMethods`
3. Plugin calculates real-time rates from DSV
4. Customer sees shipping options with prices
5. Customer selects shipping method
6. Order is placed with DSV shipping rate

## Configuration Options

### DsvShippingPluginOptions

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `auth` | `DsvAuthConfig` | Yes | OAuth credentials |
| `auth.clientEmail` | `string` | Yes | Email from DSV subscription |
| `auth.clientPassword` | `string` | Yes | Password from DSV subscription |
| `auth.accessTokenKey` | `string` | Yes | Access Token API subscription key |
| `auth.environment` | `'test' \| 'production'` | Yes | API environment |
| `subscriptionKeys` | `DsvSubscriptionKeys` | Yes | API subscription keys |
| `subscriptionKeys.quote` | `string` | Yes | Quote API subscription key |
| `testMdmAccount` | `string` | Yes | Test MDM account from DSV |
| `features` | `DsvFeatureFlags` | Yes | Feature enable/disable flags |
| `features.quote` | `boolean` | Yes | Enable quote calculation (must be `true`) |
| `quoteCacheTTL` | `number` | No | Cache TTL in seconds (default: 300) |
| `debugMode` | `boolean` | No | Enable debug logging (default: false) |

### Calculator Arguments

When configuring a shipping method, these arguments are available:

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `transportMode` | `'Air' \| 'Sea' \| 'Road' \| 'Rail'` | Yes | DSV transport mode |
| `serviceLevel` | `'Express' \| 'Standard' \| 'Economy'` | Yes | Service level |
| `taxRate` | `number` | Yes | Tax rate percentage |
| `includeInsurance` | `boolean` | Yes | Include goods insurance |
| `originAirport` | `string` | No | IATA code (Air only) |
| `destinationAirport` | `string` | No | IATA code (Air only) |
| `originPort` | `string` | No | UN/LOCODE (Sea only) |
| `destinationPort` | `string` | No | UN/LOCODE (Sea only) |

## Product Configuration

### Optional Custom Fields

For accurate shipping calculations, add these custom fields to ProductVariant:

```typescript
// src/vendure-config.ts
export const config: VendureConfig = {
  customFields: {
    ProductVariant: [
      {
        name: 'weight',
        type: 'float',
        label: [{ languageCode: LanguageCode.en, value: 'Weight (kg)' }],
        public: true,
        ui: { component: 'number-form-input', suffix: 'kg' },
      },
      {
        name: 'length',
        type: 'float',
        label: [{ languageCode: LanguageCode.en, value: 'Length (cm)' }],
        public: true,
      },
      {
        name: 'width',
        type: 'float',
        label: [{ languageCode: LanguageCode.en, value: 'Width (cm)' }],
        public: true,
      },
      {
        name: 'height',
        type: 'float',
        label: [{ languageCode: LanguageCode.en, value: 'Height (cm)' }],
        public: true,
      },
    ],
  },
};
```

**If custom fields are not set**, the plugin uses sensible defaults:
- Weight: 1.0 kg per item
- Dimensions: 30cm × 20cm × 10cm

## Troubleshooting

### Calculator Not Showing in Dashboard

**Check**:
1. Plugin is registered in `vendure-config.ts`
2. Vendure restarted after adding plugin: `npm run dev`
3. Check server logs for initialization messages

**Expected logs**:
```
[DSV Plugin] Initializing DSV Shipping Plugin
[DSV Plugin] Phase 1: OAuth + Quote API
[DSV Plugin] ✓ Configuration validation passed
[DSV Rate Calculator] Initializing services
```

### Rates Not Calculating

**Check**:
1. All environment variables are set correctly
2. DSV credentials are valid (test login at https://demo.mydsv.com)
3. Subscription keys are correct (check DSV Developer Portal)
4. Order has shipping address with city and country
5. Check calculator test in Dashboard

**Debug**:
```bash
# Enable debug logging
DSV_DEBUG_MODE=true npm run dev

# Check logs for errors
pm2 logs vendure-server
```

### OAuth Errors

**Error**: `DSV OAuth authentication failed: 401 Unauthorized`

**Solution**:
- Verify `DSV_CLIENT_EMAIL` and `DSV_CLIENT_PASSWORD`
- Verify `DSV_ACCESS_TOKEN_KEY`
- Check credentials work at https://demo.mydsv.com

### Quote API Errors

**Error**: `DSV Quote API failed: 403 Forbidden`

**Solution**:
- Verify `DSV_QUOTE_API_KEY` is correct
- Check subscription is active in DSV Developer Portal
- Ensure using correct environment (test vs production)

**Error**: `No shipping options available for this route`

**Solution**:
- Check origin/destination are valid
- Try different transport mode
- Verify package weights/dimensions are reasonable

## Logging

The plugin provides comprehensive logging:

```
[DSV Plugin] Initialization and configuration validation
[DSV Auth Service] OAuth token acquisition and refresh
[DSV Quote Service] Quote requests and responses
[DSV Rate Calculator] Rate calculation process
```

**Log Levels**:
- `info`: Normal operations (always logged)
- `debug`: Detailed information (requires `debugMode: true`)
- `error`: Failures and exceptions (always logged)

## Architecture

### Vendure Integration Points

1. **ShippingCalculator**: `dsvRateCalculator`
   - Registered in `shippingOptions.shippingCalculators`
   - Called when customer requests `eligibleShippingMethods`
   - Returns `ShippingCalculationResult` with price and metadata

2. **Services**:
   - `DsvAuthService`: OAuth 2.0 token management
   - `DsvQuoteService`: Quote API integration

3. **Utilities**:
   - `calculatePackages()`: Convert order lines to DSV packages
   - `convertAddress()`: Convert Vendure addresses to DSV format
   - `validateOrderForQuote()`: Ensure order has required data

### DSV API Flow

```
Customer Checkout
  ↓
Vendure: eligibleShippingMethods query
  ↓
Calculator: calculate(ctx, order, args)
  ↓
DsvAuthService: getAccessToken()
  ↓
DSV: OAuth token request
  ↓
DsvQuoteService: getQuote(request)
  ↓
DSV Quote API: POST /qs-demo/quote/v1/quotes
  ↓
Response: { quoteRequestId, options: [{price, transitTime}] }
  ↓
Calculator: return { price, taxRate, metadata }
  ↓
Customer: sees shipping options with prices
```

## Support

- **Issues**: https://github.com/agxchange/vendure-plugin-dsv-shipping/issues
- **DSV API Docs**: https://developer.dsv.com/guide-mydsv
- **Vendure Docs**: https://docs.vendure.io

## License

MIT

## Contributing

Contributions welcome! Please open an issue first to discuss proposed changes.

## Roadmap

- [x] Phase 1: OAuth + Quote API (v0.2.0)
- [ ] Phase 2: Booking API integration
- [ ] Phase 3: Tracking API + Webhooks
- [ ] Phase 4: Label printing
- [ ] Phase 5: Document management

## Changelog

### v0.2.0 (2026-01-04)
- ✅ Complete Phase 1 implementation
- ✅ OAuth 2.0 authentication with auto-refresh
- ✅ DSV Quote API integration
- ✅ Real-time rate calculation
- ✅ Quote caching
- ✅ Support for all 4 transport modes
- ✅ Comprehensive error handling
- ✅ Dashboard testing capability

### v0.1.0 (Previous)
- Initial dependency injection setup
