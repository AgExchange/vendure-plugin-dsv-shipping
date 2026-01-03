# DSV Shipping Plugin for Vendure

A comprehensive Vendure plugin that integrates DSV Air, Sea, Road (EU), and Rail shipping services with support for quotes, bookings, tracking, and document management.

## Overview

This plugin implements the DSV Generic APIs (Air, Sea, Road, Rail) according to the official DSV Developer Guide available at https://developer.dsv.com/guide-mydsv

### Supported Features

1. **Rate & Service API** - Get shipping quotes based on agreed tariff rates
2. **Booking API** - Submit draft and final bookings to DSV
3. **Tracking API** - Track shipments by various identifiers
4. **Label Printing API** - Download shipping labels
5. **Document Upload/Download API** - Manage shipping documents
6. **Webhook Support** - Real-time notifications for shipment events

## Authentication

DSV Generic APIs use OAuth 2.0 authentication (replacing the legacy DSV-Service-Auth method). The plugin requires:

### Required Credentials

1. **DSV-Subscription-Key** (API Key)
   - Obtained from DSV Developer Portal profile page after subscription approval
   - Used in HTTP header: `DSV-Subscription-Key`
   - Format: `b5c09b92fbf24d62a17caad22227c470`

2. **OAuth 2.0 Access Token**
   - Obtained using system account credentials (email/password)
   - Used in HTTP header: `Authorization: Bearer <access_token>`
   - Token expires and must be refreshed

3. **Test Account Number (MDM)**
   - Used for Booking Party and Freight Payer addresses
   - Provided by DSV via email after subscription approval
   - Format: 10-digit number (e.g., "1234567890")

### Environments

- **Test Environment**: https://api-uat.dsv.com
- **Production Environment**: https://api.dsv.com
- **Demo Portal**: https://demo.mydsv.com (for testing bookings)

## Installation

```bash
npm install @your-org/vendure-plugin-dsv-shipping
```

## Configuration

Add the plugin to your Vendure config:

```typescript
import { DsvShippingPlugin } from '@your-org/vendure-plugin-dsv-shipping';

export const config: VendureConfig = {
  // ...
  plugins: [
    DsvShippingPlugin.init({
      // OAuth 2.0 Credentials
      clientEmail: process.env.DSV_CLIENT_EMAIL,
      clientPassword: process.env.DSV_CLIENT_PASSWORD,
      
      // API Key (DSV-Subscription-Key)
      subscriptionKey: process.env.DSV_SUBSCRIPTION_KEY,
      
      // Test MDM Account Number
      testMdmAccount: process.env.DSV_TEST_MDM,
      
      // Environment
      environment: 'test', // 'test' or 'production'
      
      // Optional: Enable specific transport modes
      transportModes: ['Air', 'Sea', 'Road', 'Rail'], // Default: all
      
      // Optional: Tax rate for shipping (default: 0)
      defaultTaxRate: 0,
      
      // Optional: Enable auto-booking (false = draft mode)
      autoBook: false,
    }),
  ],
};
```

## Environment Variables

Create a `.env` file with your DSV credentials:

```env
# DSV OAuth 2.0 Credentials
DSV_CLIENT_EMAIL=your-email@example.com
DSV_CLIENT_PASSWORD=your-password

# DSV Subscription Key (from Developer Portal)
DSV_SUBSCRIPTION_KEY=b5c09b92fbf24d62a17caad22227c470

# Test MDM Account Number (for Booking Party / Freight Payer)
DSV_TEST_MDM=1234567890

# Environment: test or production
DSV_ENVIRONMENT=test
```

## Usage

### 1. Create a Shipping Method

In the Vendure Admin UI:

1. Navigate to **Settings** → **Shipping methods**
2. Click **Create new shipping method**
3. Select **DSV Rate Calculator** as the calculator
4. Configure the settings:
   - Transport Mode (Air, Sea, Road, Rail)
   - Service Level (Standard, Express, etc.)
   - Include insurance (optional)

### 2. Storefront Integration

The shipping calculator will automatically calculate rates when customers:
- Add items to cart
- Enter a shipping address
- Query `eligibleShippingMethods`

```graphql
query {
  eligibleShippingMethods {
    id
    name
    price
    priceWithTax
    metadata # Contains DSV-specific data
  }
}
```

### Metadata Structure

The shipping calculator returns metadata with DSV-specific information:

```json
{
  "dsvTransportMode": "Air",
  "dsvServiceLevel": "Express",
  "estimatedDeliveryDate": "2025-01-15",
  "quoteId": "QUOTE-12345",
  "carrier": "DSV Air Freight"
}
```

## API Reference

### Shipping Calculator

The plugin provides `DsvRateCalculator` which implements Vendure's `ShippingCalculator` interface.

**Arguments:**
- `transportMode`: Air | Sea | Road | Rail
- `serviceLevel`: Standard | Express | Economy
- `includeInsurance`: boolean
- `taxRate`: number (percentage)

**Returns:**
```typescript
{
  price: number;
  priceIncludesTax: boolean;
  taxRate: number;
  metadata: {
    dsvTransportMode: string;
    dsvServiceLevel: string;
    estimatedDeliveryDate: string;
    quoteId: string;
    carrier: string;
  };
}
```

### Services

#### DsvAuthService

Handles OAuth 2.0 authentication:

```typescript
// Get valid access token
const token = await dsvAuthService.getAccessToken();

// Force token refresh
await dsvAuthService.refreshToken();
```

#### DsvApiService

Low-level API client for DSV endpoints:

```typescript
// Get quote
const quote = await dsvApiService.getQuote({
  origin: { countryCode: 'US', postalCode: '10001' },
  destination: { countryCode: 'GB', postalCode: 'SW1A 1AA' },
  packages: [{ weight: 10, length: 30, width: 20, height: 15 }],
  transportMode: 'Air'
});

// Submit booking
const booking = await dsvApiService.submitBooking({
  autobook: false,
  // ... booking details
});

// Track shipment
const tracking = await dsvApiService.trackShipment('40257145990000123456');
```

#### DsvTrackingService

High-level tracking functionality:

```typescript
// Track by DSV Booking ID
const details = await dsvTrackingService.trackByBookingId('40257145990000123456');

// Track by Customer Reference
const details = await dsvTrackingService.trackByReference('PO123456');

// Get shipment events
const events = await dsvTrackingService.getShipmentEvents('SCPH1234567');
```

## Logging

The plugin includes comprehensive logging for debugging and testing:

### Log Levels

All logs use `console.info()` for visibility during development:

```typescript
console.info('[DSV Plugin] Initializing with config:', sanitizedConfig);
console.info('[DSV Auth] Requesting new access token');
console.info('[DSV API] Quote request:', requestData);
console.info('[DSV API] Quote response:', responseData);
console.info('[DSV Calculator] Calculating shipping for order:', orderId);
```

### Debug Mode

Enable detailed logging by setting:

```typescript
DsvShippingPlugin.init({
  // ... other config
  debugMode: true, // Logs all API requests/responses
});
```

## Error Handling

The plugin includes comprehensive error handling with detailed error messages:

### Common Errors

1. **Authentication Failed**
```
[DSV Auth] Failed to obtain access token: Invalid credentials
```
**Solution**: Verify DSV_CLIENT_EMAIL and DSV_CLIENT_PASSWORD

2. **Invalid Subscription Key**
```
[DSV API] Request failed: 401 Unauthorized - Invalid subscription key
```
**Solution**: Verify DSV_SUBSCRIPTION_KEY in Developer Portal

3. **Missing MDM Account**
```
[DSV Booking] Booking Party MDM account is required
```
**Solution**: Set DSV_TEST_MDM environment variable

4. **Rate Not Available**
```
[DSV Calculator] No rates available for the selected transport mode
```
**Solution**: Check if route is supported, verify shipping address

## API Endpoints

### Base URLs

- **Test**: `https://api-uat.dsv.com`
- **Production**: `https://api.dsv.com`

### Available Endpoints

#### OAuth 2.0 Token
- **Endpoint**: `/oauth/v1/Token`
- **Method**: POST
- **Purpose**: Obtain access token

#### Quote API
- **Endpoint**: `/Generic/Quote/v1`
- **Method**: POST
- **Purpose**: Request shipping quotes

#### Booking API
- **Endpoint**: `/Generic/Booking/v2`
- **Method**: POST
- **Purpose**: Submit bookings (draft or final)

#### Tracking API
- **Endpoint**: `/Generic/Tracking/v2/shipment`
- **Method**: GET
- **Purpose**: Track shipments

#### Label Printing
- **Endpoint**: `/Generic/Label/v1/print/{bookingId}`
- **Method**: GET
- **Purpose**: Download shipping labels (PDF)

## Transport Modes & Features

### Supported Transport Modes

| Mode | Quote | Booking | Tracking | Labels |
|------|-------|---------|----------|--------|
| Air  | ✅    | ✅      | ✅       | ✅     |
| Sea  | ✅    | ✅      | ✅       | ✅     |
| Road | ✅    | ✅      | ✅       | ✅     |
| Rail | ✅    | ✅      | ✅       | ✅     |

### Service Levels (Transport Mode Dependent)

- **Air**: Standard, Express, Economy
- **Sea**: FCL (Full Container Load), LCL (Less than Container Load)
- **Road**: Standard, Express, Same-Day
- **Rail**: Standard

## Booking Process

### Simple Booking Flow

1. Get quote via Rate API
2. Submit draft booking
3. Confirm booking (if autobook: false)
4. Download labels

### Complex Booking Flow (Outside Europe)

1. Get quote via Rate API
2. Submit draft booking
3. Upload required documents (invoice, packing list, etc.)
4. Confirm booking
5. Download labels

### Required Documents by Trade Lane

See DSV Developer Guide for mandatory documents per country/trade lane.

## Testing

### Test in Demo Portal

1. Submit bookings via API
2. Login to https://demo.mydsv.com
3. Verify booking appears correctly
4. Test tracking functionality

### Postman Collections

DSV provides Postman collections for testing:
- Download from Developer Portal
- Import into Postman
- Update environment variables
- Test individual endpoints

## Production Migration

### Steps to Go Live

1. **Complete Testing**
   - Test all transport modes
   - Verify address handling
   - Test error scenarios

2. **Request Production Access**
   - Email DSV Support via Developer Portal
   - Specify APIs needed (Quote, Booking, Tracking)
   - Provide production account details

3. **Update Configuration**
```typescript
DsvShippingPlugin.init({
  environment: 'production',
  clientEmail: process.env.DSV_PROD_EMAIL,
  clientPassword: process.env.DSV_PROD_PASSWORD,
  subscriptionKey: process.env.DSV_PROD_SUBSCRIPTION_KEY,
  // Use actual customer MDM accounts
  autoBook: true, // Enable direct bookings
});
```

4. **Monitor & Optimize**
   - Monitor API response times
   - Track booking success rates
   - Optimize caching strategies

## Assumptions & Design Decisions

### 1. Authentication
- **Assumption**: OAuth 2.0 is used (DSV migrating from legacy auth by Jan 2026)
- **Implementation**: Automatic token refresh with 5-minute buffer before expiration

### 2. Booking Party & Freight Payer
- **Assumption**: Using test MDM account for both parties in test environment
- **Reason**: DSV requires MDM account numbers; other address fields are optional

### 3. Transport Modes
- **Assumption**: All four modes (Air, Sea, Road, Rail) use same API structure
- **Reason**: DSV Generic API documentation shows unified interface

### 4. Rate Calculation
- **Assumption**: Quote API returns rates based on agreed tariffs
- **Implementation**: Caching quotes for 5 minutes to reduce API calls

### 5. Error Handling
- **Assumption**: Network failures should not break checkout
- **Implementation**: Fallback to default rates if API unavailable

### 6. Webhook Support
- **Assumption**: Webhooks are optional for MVP
- **Implementation**: Webhook service included but not required

### 7. Document Management
- **Assumption**: Document upload needed for complex bookings only
- **Implementation**: Automated document handling based on trade lane

### 8. Label Generation
- **Assumption**: PDF format preferred over ZPL
- **Reason**: More universally compatible for printing

## Known Limitations

1. **XPress Not Supported**
   - This plugin supports Generic APIs only (Air, Sea, Road, Rail)
   - DSV XPress requires separate authentication (DSV-Service-Auth + x-pat)
   - Consider separate plugin for XPress integration

2. **Document Upload Automation**
   - Manual document preparation required for complex bookings
   - Future: Automatic document generation from order data

3. **Rate Caching**
   - Quotes cached for 5 minutes
   - May not reflect real-time price changes
   - Consider shorter cache for production

4. **Address Validation**
   - No pre-validation of addresses before API call
   - DSV validates addresses server-side
   - Invalid addresses cause booking failures

## Support & Resources

### DSV Resources
- **Developer Portal**: https://developer.dsv.com
- **API Documentation**: https://developer.dsv.com/guide-mydsv
- **Support Email**: developer.support@dsv.com
- **Demo Portal**: https://demo.mydsv.com

### Vendure Resources
- **Docs**: https://docs.vendure.io
- **Shipping Guide**: https://docs.vendure.io/guides/core-concepts/shipping/
- **Discord**: https://vendure.io/discord

## License

MIT

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## Changelog

### v1.0.0 (2025-01-02)
- Initial release
- OAuth 2.0 authentication
- Quote API integration
- Booking API support
- Tracking functionality
- Label printing
- Comprehensive logging
- Full TypeScript support
