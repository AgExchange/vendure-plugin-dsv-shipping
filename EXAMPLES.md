# DSV Shipping Plugin - Example Implementation

This document provides practical examples of using the DSV Shipping Plugin in your Vendure project.

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Multiple Shipping Methods](#multiple-shipping-methods)
3. [Custom Product Weights](#custom-product-weights)
4. [Advanced Configuration](#advanced-configuration)
5. [Custom Calculators](#custom-calculators)
6. [Webhook Integration](#webhook-integration)
7. [Error Handling](#error-handling)

---

## Basic Setup

### Minimal Configuration

```typescript
// vendure-config.ts
import { VendureConfig } from '@vendure/core';
import { DsvShippingPlugin } from '@agxchange/vendure-plugin-dsv-shipping';
import * as dotenv from 'dotenv';

dotenv.config();

export const config: VendureConfig = {
  // ... other config
  plugins: [
    DsvShippingPlugin.init({
      clientEmail: process.env.DSV_CLIENT_EMAIL!,
      clientPassword: process.env.DSV_CLIENT_PASSWORD!,
      subscriptionKey: process.env.DSV_SUBSCRIPTION_KEY!,
      testMdmAccount: process.env.DSV_TEST_MDM!,
      environment: 'test',
    }),
  ],
};
```

---

## Multiple Shipping Methods

### Example: Create Different Service Levels

You can create multiple shipping methods for different transport modes and service levels:

#### 1. Air Express Shipping

```typescript
// Admin UI: Settings → Shipping methods → Create new

Name: DSV Air Express
Code: dsv-air-express
Calculator: DSV Rate Calculator
  - Transport Mode: Air
  - Service Level: Express
  - Include Insurance: Yes
  - Tax Rate: 0
```

#### 2. Sea Freight (FCL)

```typescript
Name: DSV Sea Freight (FCL)
Code: dsv-sea-fcl
Calculator: DSV Rate Calculator
  - Transport Mode: Sea
  - Service Level: FCL
  - Include Insurance: Yes
  - Tax Rate: 0
```

#### 3. Road Standard

```typescript
Name: DSV Road Standard
Code: dsv-road-standard
Calculator: DSV Rate Calculator
  - Transport Mode: Road
  - Service Level: Standard
  - Include Insurance: No
  - Tax Rate: 0
```

---

## Custom Product Weights

### Add Weight Custom Field

To properly calculate shipping rates, add a weight custom field to products:

```typescript
// vendure-config.ts
import { LanguageCode } from '@vendure/core';

export const config: VendureConfig = {
  // ... other config
  customFields: {
    ProductVariant: [
      {
        name: 'weight',
        type: 'float',
        label: [
          {
            languageCode: LanguageCode.en,
            value: 'Weight (kg)',
          },
        ],
        description: [
          {
            languageCode: LanguageCode.en,
            value: 'Product weight in kilograms for shipping calculation',
          },
        ],
        ui: {
          component: 'number-form-input',
          suffix: 'kg',
        },
        defaultValue: 1,
        nullable: false,
      },
    ],
  },
};
```

### Set Product Weights

In Admin UI:
1. Navigate to **Catalog** → **Products**
2. Select a product
3. Go to **Variants** tab
4. Enter weight for each variant
5. Click **Save**

---

## Advanced Configuration

### Environment-Specific Configuration

```typescript
// vendure-config.ts
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

export const config: VendureConfig = {
  plugins: [
    DsvShippingPlugin.init({
      clientEmail: process.env.DSV_CLIENT_EMAIL!,
      clientPassword: process.env.DSV_CLIENT_PASSWORD!,
      subscriptionKey: process.env.DSV_SUBSCRIPTION_KEY!,
      testMdmAccount: process.env.DSV_TEST_MDM!,
      
      // Use production in production, test otherwise
      environment: isProduction ? 'production' : 'test',
      
      // Enable debug mode in development
      debugMode: isDevelopment,
      
      // Longer cache in production
      quoteCacheTTL: isProduction ? 600 : 300,
      
      // Auto-book only in production
      autoBook: isProduction,
      
      // Limit transport modes based on business needs
      transportModes: isProduction 
        ? ['Air', 'Sea', 'Road'] // No rail in production
        : ['Air', 'Sea', 'Road', 'Rail'], // All modes in test
    }),
  ],
};
```

### Multiple Warehouses

For businesses with multiple warehouses:

```typescript
// services/warehouse.service.ts
import { Injectable } from '@nestjs/common';

export interface Warehouse {
  code: string;
  name: string;
  address: {
    countryCode: string;
    postalCode: string;
    city: string;
  };
}

@Injectable()
export class WarehouseService {
  private warehouses: Warehouse[] = [
    {
      code: 'WH-ZA',
      name: 'South Africa Warehouse',
      address: {
        countryCode: 'ZA',
        postalCode: '0001',
        city: 'Pretoria',
      },
    },
    {
      code: 'WH-US',
      name: 'USA Warehouse',
      address: {
        countryCode: 'US',
        postalCode: '10001',
        city: 'New York',
      },
    },
  ];

  getClosestWarehouse(destinationCountry: string): Warehouse {
    // Simple logic: match continent
    if (['ZA', 'KE', 'NG', 'GH'].includes(destinationCountry)) {
      return this.warehouses[0]; // Africa warehouse
    }
    return this.warehouses[1]; // USA warehouse
  }
}
```

---

## Custom Calculators

### Create Custom Calculator with Fixed Markup

```typescript
// calculators/dsv-markup.calculator.ts
import {
  LanguageCode,
  ShippingCalculator,
  Order,
  Injector,
} from '@vendure/core';
import { DsvApiService, DsvTransportMode } from '@agxchange/vendure-plugin-dsv-shipping';

export const dsvMarkupCalculator = new ShippingCalculator({
  code: 'dsv-with-markup',
  description: [
    {
      languageCode: LanguageCode.en,
      value: 'DSV Rate with Fixed Markup',
    },
  ],
  args: {
    transportMode: {
      type: 'string',
      ui: { component: 'select-form-input' },
      label: [{ languageCode: LanguageCode.en, value: 'Transport Mode' }],
    },
    markup: {
      type: 'int',
      ui: { 
        component: 'currency-form-input',
      },
      label: [{ languageCode: LanguageCode.en, value: 'Markup Amount' }],
      description: [
        {
          languageCode: LanguageCode.en,
          value: 'Fixed amount to add to DSV rate',
        },
      ],
    },
    taxRate: {
      type: 'int',
      ui: { component: 'number-form-input', suffix: '%' },
      label: [{ languageCode: LanguageCode.en, value: 'Tax Rate' }],
    },
  },
  calculate: async (ctx, order, args, method, injector) => {
    const apiService = injector.get(DsvApiService);
    
    // Get DSV quote
    const quoteRequest = {
      transportMode: args.transportMode as DsvTransportMode,
      origin: { countryCode: 'ZA', postalCode: '0001', city: 'Pretoria' },
      destination: {
        countryCode: order.shippingAddress!.countryCode,
        postalCode: order.shippingAddress!.postalCode,
        city: order.shippingAddress!.city,
      },
      packages: [
        {
          quantity: 1,
          weight: 10, // Calculate from order
          packageType: 'Box',
        },
      ],
      customerReference: order.code,
    };

    const quote = await apiService.getQuote(quoteRequest);
    const basePrice = quote.options[0]?.totalPrice.amount || 0;
    
    // Add markup
    const finalPrice = basePrice + args.markup;

    return {
      price: finalPrice,
      priceIncludesTax: ctx.channel.pricesIncludeTax,
      taxRate: args.taxRate,
      metadata: {
        dsvBasePrice: basePrice,
        markup: args.markup,
        quoteId: quote.quoteRequestId,
      },
    };
  },
});

// Register in config
import { dsvMarkupCalculator } from './calculators/dsv-markup.calculator';

export const config: VendureConfig = {
  // ...
  shippingOptions: {
    shippingCalculators: [
      dsvMarkupCalculator,
    ],
  },
};
```

### Weight-Based Tiered Pricing

```typescript
// calculators/dsv-tiered.calculator.ts
export const dsvTieredCalculator = new ShippingCalculator({
  code: 'dsv-tiered',
  description: [
    {
      languageCode: LanguageCode.en,
      value: 'DSV Rate with Weight Tiers',
    },
  ],
  args: {
    transportMode: { /* ... */ },
    tier1Weight: {
      type: 'int',
      label: [{ languageCode: LanguageCode.en, value: 'Tier 1 Max Weight (kg)' }],
      defaultValue: 10,
    },
    tier1Discount: {
      type: 'int',
      label: [{ languageCode: LanguageCode.en, value: 'Tier 1 Discount (%)' }],
      defaultValue: 0,
    },
    tier2Weight: {
      type: 'int',
      label: [{ languageCode: LanguageCode.en, value: 'Tier 2 Max Weight (kg)' }],
      defaultValue: 50,
    },
    tier2Discount: {
      type: 'int',
      label: [{ languageCode: LanguageCode.en, value: 'Tier 2 Discount (%)' }],
      defaultValue: 10,
    },
    tier3Discount: {
      type: 'int',
      label: [{ languageCode: LanguageCode.en, value: 'Tier 3+ Discount (%)' }],
      defaultValue: 20,
    },
  },
  calculate: async (ctx, order, args) => {
    const apiService = ctx.injector.get(DsvApiService);
    
    // Calculate total weight
    const totalWeight = order.lines.reduce((sum, line) => {
      const weight = (line.productVariant.customFields as any)?.weight || 1;
      return sum + (weight * line.quantity);
    }, 0);

    // Determine discount based on weight tier
    let discount = 0;
    if (totalWeight <= args.tier1Weight) {
      discount = args.tier1Discount;
    } else if (totalWeight <= args.tier2Weight) {
      discount = args.tier2Discount;
    } else {
      discount = args.tier3Discount;
    }

    // Get DSV quote
    const quote = await apiService.getQuote({
      // ... quote request
    });

    const basePrice = quote.options[0]?.totalPrice.amount || 0;
    const discountAmount = (basePrice * discount) / 100;
    const finalPrice = basePrice - discountAmount;

    return {
      price: finalPrice,
      priceIncludesTax: ctx.channel.pricesIncludeTax,
      taxRate: 0,
      metadata: {
        totalWeight,
        basePrice,
        discount,
        discountAmount,
      },
    };
  },
});
```

---

## Webhook Integration

### Setup Tracking Webhooks

```typescript
// services/dsv-webhook.service.ts
import { Injectable } from '@nestjs/common';
import { EventBus, OrderService } from '@vendure/core';

@Injectable()
export class DsvWebhookService {
  constructor(
    private eventBus: EventBus,
    private orderService: OrderService,
  ) {}

  async handleShipmentUpdate(payload: any) {
    console.info('[DSV Webhook] Received shipment update');
    console.info('[DSV Webhook] Booking ID:', payload.bookingId);
    console.info('[DSV Webhook] Status:', payload.status);

    // Find order by DSV booking ID
    const order = await this.findOrderByBookingId(payload.bookingId);
    
    if (!order) {
      console.warn('[DSV Webhook] Order not found for booking:', payload.bookingId);
      return;
    }

    // Update order with tracking information
    await this.orderService.addNoteToOrder(order.id, {
      isPublic: true,
      note: `Shipment ${payload.status}: ${payload.eventDescription}`,
    });

    // Emit custom event for additional processing
    this.eventBus.publish(new DsvShipmentUpdateEvent(order, payload));
  }

  private async findOrderByBookingId(bookingId: string) {
    // Implementation to find order by custom field or metadata
    // This depends on how you store the booking ID
  }
}

// Create webhook endpoint
// api-extensions/dsv-webhook.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { DsvWebhookService } from '../services/dsv-webhook.service';

@Controller('webhooks/dsv')
export class DsvWebhookController {
  constructor(private webhookService: DsvWebhookService) {}

  @Post('tracking')
  async handleTracking(@Body() payload: any) {
    await this.webhookService.handleShipmentUpdate(payload);
    return { received: true };
  }
}
```

---

## Error Handling

### Graceful Degradation

```typescript
// calculators/dsv-with-fallback.calculator.ts
export const dsvWithFallbackCalculator = new ShippingCalculator({
  code: 'dsv-with-fallback',
  description: [
    {
      languageCode: LanguageCode.en,
      value: 'DSV Rate with Fallback',
    },
  ],
  args: {
    transportMode: { /* ... */ },
    fallbackRate: {
      type: 'int',
      ui: { component: 'currency-form-input' },
      label: [{ languageCode: LanguageCode.en, value: 'Fallback Rate' }],
      description: [
        {
          languageCode: LanguageCode.en,
          value: 'Flat rate to use if DSV API is unavailable',
        },
      ],
    },
  },
  calculate: async (ctx, order, args) => {
    const apiService = ctx.injector.get(DsvApiService);

    try {
      // Try to get DSV quote
      const quote = await apiService.getQuote({
        // ... quote request
      });

      const price = quote.options[0]?.totalPrice.amount || args.fallbackRate;

      return {
        price,
        priceIncludesTax: ctx.channel.pricesIncludeTax,
        taxRate: 0,
        metadata: {
          source: 'dsv-api',
          quoteId: quote.quoteRequestId,
        },
      };
    } catch (error) {
      console.error('[Calculator] DSV API error, using fallback rate');
      console.error('[Calculator] Error:', error.message);

      // Use fallback rate
      return {
        price: args.fallbackRate,
        priceIncludesTax: ctx.channel.pricesIncludeTax,
        taxRate: 0,
        metadata: {
          source: 'fallback',
          error: error.message,
        },
      };
    }
  },
});
```

### Retry Logic

```typescript
// services/dsv-api-retry.service.ts
import { Injectable } from '@nestjs/common';
import { DsvApiService } from '@agxchange/vendure-plugin-dsv-shipping';

@Injectable()
export class DsvApiRetryService {
  constructor(private dsvApi: DsvApiService) {}

  async getQuoteWithRetry(
    request: any,
    maxRetries = 3,
    delayMs = 1000,
  ) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.info(`[Retry Service] Attempt ${attempt}/${maxRetries}`);
        const quote = await this.dsvApi.getQuote(request);
        return quote;
      } catch (error: any) {
        console.error(`[Retry Service] Attempt ${attempt} failed:`, error.message);

        if (attempt === maxRetries) {
          throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
        }

        // Wait before retry (exponential backoff)
        const delay = delayMs * Math.pow(2, attempt - 1);
        console.info(`[Retry Service] Waiting ${delay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}
```

---

## Monitoring and Logging

### Custom Logger

```typescript
// services/dsv-logger.service.ts
import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class DsvLoggerService {
  private logDir = join(process.cwd(), 'logs');

  async logQuoteRequest(request: any, response: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type: 'quote_request',
      request,
      response,
    };

    await this.writeLog('quotes.jsonl', JSON.stringify(logEntry));
  }

  async logBooking(booking: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type: 'booking',
      booking,
    };

    await this.writeLog('bookings.jsonl', JSON.stringify(logEntry));
  }

  private async writeLog(filename: string, entry: string) {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
      const filepath = join(this.logDir, filename);
      await fs.appendFile(filepath, entry + '\n');
    } catch (error) {
      console.error('[Logger] Failed to write log:', error);
    }
  }
}
```

### Metrics Collection

```typescript
// services/dsv-metrics.service.ts
import { Injectable } from '@nestjs/common';

interface Metrics {
  totalQuotes: number;
  totalBookings: number;
  cacheHits: number;
  cacheMisses: number;
  errors: number;
  avgResponseTime: number;
}

@Injectable()
export class DsvMetricsService {
  private metrics: Metrics = {
    totalQuotes: 0,
    totalBookings: 0,
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    avgResponseTime: 0,
  };

  recordQuote(cached: boolean, responseTime: number) {
    this.metrics.totalQuotes++;
    if (cached) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    this.updateAvgResponseTime(responseTime);
  }

  recordBooking() {
    this.metrics.totalBookings++;
  }

  recordError() {
    this.metrics.errors++;
  }

  getMetrics(): Metrics {
    return { ...this.metrics };
  }

  private updateAvgResponseTime(newTime: number) {
    const total = this.metrics.totalQuotes;
    const currentAvg = this.metrics.avgResponseTime;
    this.metrics.avgResponseTime = 
      (currentAvg * (total - 1) + newTime) / total;
  }
}
```

---

## Testing

### Unit Tests

```typescript
// __tests__/dsv-rate.calculator.spec.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { DsvRateCalculator } from '../src/calculators/dsv-rate.calculator';

describe('DsvRateCalculator', () => {
  beforeEach(() => {
    DsvRateCalculator.init({
      clientEmail: 'test@example.com',
      clientPassword: 'password',
      subscriptionKey: 'test-key',
      testMdmAccount: '1234567890',
      environment: 'test',
    });
  });

  it('should calculate shipping rate', async () => {
    // Test implementation
  });

  it('should use cached quotes', async () => {
    // Test implementation
  });

  it('should handle API errors', async () => {
    // Test implementation
  });
});
```

### Integration Tests

```typescript
// e2e/dsv-shipping.e2e.spec.ts
describe('DSV Shipping Integration', () => {
  it('should calculate rates for order', async () => {
    // Create test order
    // Query eligibleShippingMethods
    // Verify DSV rates appear
  });

  it('should create booking on order completion', async () => {
    // Complete order with DSV shipping
    // Verify booking was created
    // Check booking in demo portal
  });
});
```

---

This example implementation guide covers common use cases and patterns for the DSV Shipping Plugin. Adapt these examples to your specific business requirements.
