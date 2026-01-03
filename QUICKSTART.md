# DSV Shipping Plugin - Quick Start

Get up and running with the DSV Shipping Plugin in 10 minutes.

## Prerequisites

- Vendure 3.x project
- DSV Developer Portal account
- Node.js 18+

## 5-Step Setup

### Step 1: Get DSV Credentials (5 min)

1. Go to https://developer.dsv.com
2. Click **Sign up** (or **Sign in** if you have an account)
3. Navigate to **API CATALOGUE**
4. Subscribe to **Quote (test) - Generic**
5. Wait for approval email (~1-2 business days)

You'll receive TWO emails:
- **Email 1**: Contains your **Test MDM Account** (e.g., "1234567890")
- **Email 2**: Contains **OAuth credentials** (email + password)

After approval, get your **Subscription Key**:
1. Login to https://developer.dsv.com
2. Click your name → **Profile**
3. Copy **Primary key** from Subscription Keys section

### Step 2: Install Plugin (1 min)

```bash
npm install @agxchange/vendure-plugin-dsv-shipping
```

### Step 3: Configure Environment (1 min)

Create `.env` file in your project root:

```env
DSV_CLIENT_EMAIL=your-api-email@example.com
DSV_CLIENT_PASSWORD=YourAPIPassword123
DSV_SUBSCRIPTION_KEY=your-32-char-subscription-key
DSV_TEST_MDM=1234567890
DSV_ENVIRONMENT=test
```

### Step 4: Add to Vendure Config (2 min)

```typescript
// vendure-config.ts
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
      debugMode: true, // Enable for development
    }),
  ],
};
```

### Step 5: Create Shipping Method (1 min)

1. Start Vendure: `npm run dev`
2. Login to Admin UI
3. Go to **Settings** → **Shipping methods**
4. Click **Create new shipping method**
5. Fill in:
   - Name: `DSV Air Freight`
   - Calculator: **DSV Rate Calculator**
   - Transport Mode: `Air`
   - Service Level: `Standard`
6. Click **Create**

## Verify Installation

### Check Logs

You should see:
```
=================================================
[DSV Plugin] Initializing DSV Shipping Plugin
=================================================
[DSV Plugin] Configuration: { ... }
[DSV Plugin] ✓ Configuration validation passed
[DSV Plugin] Test environment enabled
[DSV Plugin] Plugin initialized successfully
=================================================
```

### Test in Storefront

1. Add product to cart
2. Go to checkout
3. Enter shipping address
4. You should see DSV shipping option with calculated rate

### Check Server Logs

Look for successful rate calculation:
```
[DSV Rate Calculator] Calculating shipping rate
[DSV API Service] Getting quote
[DSV API Service] Quote received successfully
[DSV Rate Calculator] Calculation complete
```

## Common Issues

### "Authentication failed: Invalid credentials"
- Double-check `DSV_CLIENT_EMAIL` and `DSV_CLIENT_PASSWORD`
- These are from the DSV subscription email, NOT your Developer Portal login

### "No shipping rates available"
- Verify shipping address has country and postal code
- Check product has weight configured (see below)
- Enable `debugMode: true` to see detailed errors

### "Missing required configuration options"
- Ensure all environment variables are set
- Check `.env` file is in project root
- Restart server after changing `.env`

## Add Product Weights

For accurate shipping calculation, add weight custom field:

```typescript
// vendure-config.ts
export const config: VendureConfig = {
  customFields: {
    ProductVariant: [
      {
        name: 'weight',
        type: 'float',
        label: [{ languageCode: LanguageCode.en, value: 'Weight (kg)' }],
        ui: { component: 'number-form-input', suffix: 'kg' },
        defaultValue: 1,
      },
    ],
  },
};
```

Then in Admin UI:
1. Go to **Catalog** → **Products**
2. Edit product → **Variants** tab
3. Set weight for each variant

## Next Steps

### Production Setup

See [SETUP.md](./SETUP.md) for complete production setup guide.

### Advanced Features

See [EXAMPLES.md](./EXAMPLES.md) for:
- Multiple shipping methods
- Custom calculators
- Webhook integration
- Error handling patterns

### Documentation

- **README.md**: Overview and features
- **SETUP.md**: Detailed setup guide
- **EXAMPLES.md**: Implementation patterns
- **DEVELOPMENT.md**: Technical details

## Getting Help

- **Issues**: GitHub Issues
- **DSV Support**: developer.support@dsv.com
- **Demo Portal**: https://demo.mydsv.com (test bookings)
- **Developer Portal**: https://developer.dsv.com

## Troubleshooting

Enable debug mode to see all API requests:

```typescript
DsvShippingPlugin.init({
  // ... other config
  debugMode: true,
});
```

Check logs for:
- `[DSV Auth Service]` - Authentication issues
- `[DSV API Service]` - API errors
- `[DSV Rate Calculator]` - Calculation problems

Common log messages:
- ✓ `Token obtained successfully` - Auth working
- ✓ `Quote received successfully` - API working
- ✓ `Calculation complete` - Rates calculated
- ✗ `Authentication failed` - Check credentials
- ✗ `Failed to get quote` - Check address/weight

---

**That's it!** You should now have DSV shipping rates in your store.

For detailed documentation, see the full guides in this repository.
