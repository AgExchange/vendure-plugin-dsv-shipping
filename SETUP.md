# DSV Shipping Plugin - Setup Guide

Complete step-by-step guide to setting up the DSV Shipping Plugin for Vendure.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [DSV Account Setup](#dsv-account-setup)
3. [Plugin Installation](#plugin-installation)
4. [Configuration](#configuration)
5. [Testing](#testing)
6. [Production Setup](#production-setup)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- Node.js 18+ or 20+
- Vendure 3.0.0 or higher
- Active DSV account with API access
- DSV Developer Portal account

### Knowledge Requirements

- Basic understanding of Vendure configuration
- Familiarity with environment variables
- Understanding of shipping/logistics concepts

---

## DSV Account Setup

### 1. Create DSV Developer Account

1. Visit https://developer.dsv.com
2. Click **Sign up** in the top navigation
3. Fill in your details and create account
4. Verify your email address

### 2. Subscribe to APIs

After logging in to the Developer Portal:

1. Navigate to **API CATALOGUE**
2. Subscribe to the following APIs:
   - **Quote (test) - Generic** (for rate calculation)
   - **Booking (test) - Generic** (for shipment booking)
   - **Tracking (test) - Generic** (for tracking shipments)
   - **Label Printing (test) - Generic** (for printing labels)

3. For each API:
   - Click the API name
   - Click **Subscribe**
   - Fill in your details
   - Submit subscription request

### 3. Wait for Approval

DSV will review your subscription request. This typically takes:
- **Normal**: 1-2 business days
- **Urgent**: Contact developer.support@dsv.com

You will receive **two emails**:

#### Email 1: Subscription Approved
- Confirms your subscription is active
- Contains your **Test MDM Account Number** (10 digits)
- Example: "Your test account number is: 1234567890"

#### Email 2: Demo Portal Credentials
- Contains login credentials for https://demo.mydsv.com
- Username (email)
- Temporary password
- These credentials are for testing bookings only

### 4. Get API Credentials

After subscription approval:

1. Login to https://developer.dsv.com
2. Click your name in top right → **Profile**
3. Find **Subscription Keys** section
4. Copy your **Primary key** (32 characters)
   - Format: `b5c09b92fbf24d62a17caad22227c470`
5. Note: You can use either Primary or Secondary key

### 5. Get OAuth Credentials

Provided in the subscription approval email:
- **Client Email**: `your-email@example.com`
- **Client Password**: `YourPassword123`

⚠️ **IMPORTANT**: These are the credentials for API authentication, NOT your Developer Portal login.

---

## Plugin Installation

### 1. Install Package

```bash
npm install @agxchange/vendure-plugin-dsv-shipping
```

### 2. Create Environment Variables

Create or update `.env` file in your Vendure project root:

```env
# DSV OAuth 2.0 Credentials (from subscription email)
DSV_CLIENT_EMAIL=your-api-email@example.com
DSV_CLIENT_PASSWORD=YourAPIPassword123

# DSV Subscription Key (from Developer Portal profile page)
DSV_SUBSCRIPTION_KEY=b5c09b92fbf24d62a17caad22227c470

# Test MDM Account (from subscription approval email)
DSV_TEST_MDM=1234567890

# Environment (test or production)
DSV_ENVIRONMENT=test
```

**Security Note**: Never commit `.env` file to version control!

### 3. Update .gitignore

Ensure your `.gitignore` includes:

```gitignore
.env
.env.local
.env.*.local
```

---

## Configuration

### 1. Import Plugin

In your `vendure-config.ts`:

```typescript
import { DsvShippingPlugin } from '@agxchange/vendure-plugin-dsv-shipping';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config: VendureConfig = {
  // ... other config
  plugins: [
    // ... other plugins
    DsvShippingPlugin.init({
      // Required: OAuth 2.0 credentials
      clientEmail: process.env.DSV_CLIENT_EMAIL!,
      clientPassword: process.env.DSV_CLIENT_PASSWORD!,
      
      // Required: API subscription key
      subscriptionKey: process.env.DSV_SUBSCRIPTION_KEY!,
      
      // Required: Test MDM account for test environment
      testMdmAccount: process.env.DSV_TEST_MDM!,
      
      // Required: Environment
      environment: (process.env.DSV_ENVIRONMENT as 'test' | 'production') || 'test',
      
      // Optional: Transport modes (default: all)
      transportModes: ['Air', 'Sea', 'Road', 'Rail'],
      
      // Optional: Default tax rate (default: 0)
      defaultTaxRate: 0,
      
      // Optional: Auto-book (default: false)
      // false = bookings submitted as drafts
      // true = bookings sent directly to DSV
      autoBook: false,
      
      // Optional: Debug mode (default: false)
      // Logs all API requests and responses
      debugMode: process.env.NODE_ENV !== 'production',
      
      // Optional: Quote cache TTL in seconds (default: 300)
      quoteCacheTTL: 300, // 5 minutes
    }),
  ],
};
```

### 2. Verify Installation

Start your Vendure server:

```bash
npm run dev
```

Look for these log messages:

```
=================================================
[DSV Plugin] Initializing DSV Shipping Plugin
=================================================
[DSV Plugin] Configuration: {
  "clientEmail": "your-email@example.com",
  "clientPassword": "***",
  "subscriptionKey": "b5c09b92...",
  "testMdmAccount": "1234567890",
  "environment": "test",
  "transportModes": ["Air", "Sea", "Road", "Rail"],
  ...
}
[DSV Plugin] ✓ Configuration validation passed
[DSV Plugin] Test environment enabled
[DSV Plugin] Plugin initialized successfully
=================================================
```

If you see error messages, check the [Troubleshooting](#troubleshooting) section.

---

## Testing

### 1. Create Shipping Method

1. Login to Vendure Admin UI
2. Navigate to **Settings** → **Shipping methods**
3. Click **Create new shipping method**
4. Fill in basic details:
   - **Name**: `DSV Air Freight`
   - **Code**: `dsv-air`
   - **Description**: `DSV Air freight shipping`

5. Under **Shipping calculator**:
   - Select: **DSV Rate Calculator**
   - Configure:
     - Transport Mode: `Air`
     - Service Level: `Standard`
     - Include Insurance: `No`
     - Tax Rate: `0`

6. Click **Create**

### 2. Test in Storefront

#### Create Test Order

1. Add products to cart
2. Proceed to checkout
3. Enter shipping address:
   - Country: Select a country (e.g., "United States")
   - Postal Code: Enter valid postal code
   - City: Enter city name
4. Continue to shipping selection

#### Verify Shipping Options

You should see the DSV shipping method appear with:
- Calculated shipping rate
- Estimated delivery date (if available)

**Check server logs** for detailed information:

```
[DSV Rate Calculator] ======================================
[DSV Rate Calculator] Calculating shipping rate
[DSV Rate Calculator] Order ID: 123
[DSV Rate Calculator] Transport mode: Air
[DSV Rate Calculator] Shipping to: { country: 'US', postalCode: '10001', city: 'New York' }
[DSV Rate Calculator] Requesting new quote from DSV API
[DSV API Service] Getting quote
[DSV API Service] Quote received successfully
[DSV API Service] Quote ID: QUOTE-12345
[DSV API Service] Options available: 3
[DSV Rate Calculator] Selected option:
  Option ID: OPT-001
  Service level: Standard
  Price: 150.00 USD
  Transit time: 5 days
[DSV Rate Calculator] Calculation complete
[DSV Rate Calculator] ======================================
```

### 3. Test Quote Caching

Repeat the checkout process. Second time should show:

```
[DSV Rate Calculator] Using cached quote
[DSV Rate Calculator] Cache age: 45 seconds
```

### 4. Verify in Demo Portal

After creating bookings (requires booking API integration):

1. Login to https://demo.mydsv.com
2. Use credentials from DSV email
3. Navigate to bookings section
4. Verify your test booking appears
5. Check booking details, status, and tracking

---

## Production Setup

### 1. Request Production Access

When ready for production:

1. Complete all testing in test environment
2. Email DSV Support: developer.support@dsv.com
3. Subject: "Production Access Request - [Your Company Name]"
4. Include:
   - Company name
   - Contact information
   - APIs you need (Quote, Booking, Tracking, etc.)
   - Completed certification tests (if applicable)

### 2. Receive Production Credentials

DSV will provide:
- Production OAuth 2.0 credentials
- Production subscription key
- Production MDM account number
- Production API URL: https://api.dsv.com

### 3. Update Configuration

Update your `.env.production` file:

```env
DSV_CLIENT_EMAIL=production-email@example.com
DSV_CLIENT_PASSWORD=ProductionPassword123
DSV_SUBSCRIPTION_KEY=production-key-32-chars
DSV_TEST_MDM=production-mdm-account
DSV_ENVIRONMENT=production
```

### 4. Deploy

Deploy your application with production environment variables.

**IMPORTANT**: 
- Never commit production credentials to version control
- Use secure secret management (e.g., AWS Secrets Manager, Azure Key Vault)
- Monitor API usage and rate limits
- Set up error alerting

---

## Troubleshooting

### Authentication Errors

#### Error: "DSV Authentication failed: Invalid credentials"

**Cause**: Incorrect OAuth credentials

**Solution**:
1. Verify `DSV_CLIENT_EMAIL` and `DSV_CLIENT_PASSWORD`
2. These are NOT your Developer Portal credentials
3. Check subscription approval email for correct API credentials
4. Try resetting password via Developer Portal support

**Test manually**:
```bash
curl -X POST https://api-uat.dsv.com/oauth/v1/Token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&username=YOUR_EMAIL&password=YOUR_PASSWORD"
```

#### Error: "Unauthorized - token may be invalid"

**Cause**: Token expired or subscription key invalid

**Solution**:
1. Check `DSV_SUBSCRIPTION_KEY` in Developer Portal
2. Verify subscription is still active
3. Check for typos in subscription key (must be 32 characters)

### Quote/Rate Errors

#### Error: "No shipping rates available"

**Possible Causes**:
1. Invalid shipping address (missing country or postal code)
2. Unsupported route for selected transport mode
3. Missing product weight data

**Solutions**:
1. Check order shipping address is complete
2. Verify product weights are configured
3. Check supported routes for transport mode
4. Review server logs for specific error details

#### Error: "Failed to calculate DSV shipping rate"

**Check logs for**:
- API timeout (increase timeout in axios config)
- Network connectivity issues
- DSV API downtime (check status page)
- Rate limiting (reduce request frequency)

### Booking Errors

#### Error: "Booking Party MDM account is required"

**Cause**: Missing test MDM account in configuration

**Solution**:
1. Verify `DSV_TEST_MDM` is set in environment
2. Check subscription approval email for MDM number
3. Must be 10 digits (e.g., "1234567890")

#### Error: "Bad request - check request data"

**Possible Issues**:
- Invalid address format
- Missing required fields
- Incorrect package dimensions
- Invalid transport mode combination

**Debug**:
1. Enable debug mode: `debugMode: true`
2. Check full request payload in logs
3. Compare with DSV API documentation
4. Validate booking with DSV's validation endpoint first

### Configuration Errors

#### Error: "Missing required configuration options"

**Solution**: Ensure all required fields are provided:
- `clientEmail`
- `clientPassword`
- `subscriptionKey`
- `testMdmAccount`
- `environment`

#### Warning: "Subscription key length is not 32 characters"

**Solution**: 
1. Copy key carefully from Developer Portal
2. No extra spaces or newlines
3. Should look like: `b5c09b92fbf24d62a17caad22227c470`

### Performance Issues

#### Slow shipping calculation

**Possible Causes**:
1. Quotes not being cached
2. Network latency to DSV API
3. Complex shipping address validation

**Solutions**:
1. Verify cache is working (check logs for "Using cached quote")
2. Increase `quoteCacheTTL` for longer caching
3. Consider implementing address pre-validation
4. Monitor API response times

#### Rate limiting

**Symptoms**:
- HTTP 429 errors
- "Rate limit exceeded" messages

**Solutions**:
1. Increase cache TTL to reduce API calls
2. Implement request queuing
3. Contact DSV to increase rate limits
4. Consider batch operations where possible

### Getting Help

If you can't resolve an issue:

1. **Check Logs**: Enable debug mode and review full logs
2. **DSV Support**: developer.support@dsv.com
3. **Developer Portal**: https://developer.dsv.com/support-contact
4. **API Documentation**: https://developer.dsv.com/guide-mydsv
5. **GitHub Issues**: Report plugin-specific issues on GitHub

### Common Log Messages

**Success Messages**:
```
[DSV Plugin] ✓ Configuration validation passed
[DSV Auth Service] Token obtained successfully
[DSV API Service] Quote received successfully
[DSV Rate Calculator] Calculation complete
```

**Warning Messages**:
```
[DSV Plugin] ⚠️  Subscription key length is not 32 characters
[DSV Auth Service] No token cached
[DSV Rate Calculator] No matching option for service level
```

**Error Messages**:
```
[DSV Plugin] ❌ Missing required configuration options
[DSV Auth Service] Failed to obtain access token
[DSV API Service] API Error
[DSV Rate Calculator] Error calculating shipping rate
```

---

## Additional Resources

### Documentation

- **DSV Developer Portal**: https://developer.dsv.com
- **DSV API Guide**: https://developer.dsv.com/guide-mydsv
- **DSV OAuth Guide**: https://developer.dsv.com/oauth-guide
- **Vendure Docs**: https://docs.vendure.io
- **Vendure Shipping Guide**: https://docs.vendure.io/guides/core-concepts/shipping/

### Postman Collections

Download from DSV Developer Portal:
- Quote API Collection
- Booking API Collection
- Tracking API Collection

### Testing Portals

- **Demo Portal**: https://demo.mydsv.com (test bookings)
- **Developer Portal**: https://developer.dsv.com (API management)

### Support Contacts

- **DSV Developer Support**: developer.support@dsv.com
- **DSV API Support**: Via Developer Portal support page
- **Emergency**: Include "URGENT" in subject line
