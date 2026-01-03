import {
  LanguageCode,
  ShippingCalculator,
  Order,
  RequestContext,
  Injector,
} from '@vendure/core';
import NodeCache from 'node-cache';
import {
  DsvShippingPluginOptions,
  DsvTransportMode,
  DsvServiceLevel,
  DsvQuoteRequest,
  DsvPackage,
} from '../types';
import { DsvApiService } from '../services/dsv-api.service';

// Module-level variables for injected dependencies
// This follows the official Vendure pattern for ConfigurableOperations
let apiService: DsvApiService;
let quoteCache: NodeCache;

/**
 * Initialize calculator with options
 */
export function initDsvCalculator(options: DsvShippingPluginOptions): void {
  console.info('[DSV Rate Calculator] Initializing calculator');
  
  // Initialize quote cache
  const cacheTTL = options.quoteCacheTTL || 300;
  quoteCache = new NodeCache({
    stdTTL: cacheTTL,
    checkperiod: 60,
    useClones: false,
  });

  console.info(`[DSV Rate Calculator] Quote cache TTL: ${cacheTTL} seconds`);
}

/**
 * DSV Rate Calculator
 * 
 * Following official Vendure 3.x ConfigurableOperation pattern
 */
export const dsvRateCalculator = new ShippingCalculator({
  code: 'dsv-rate-calculator',
  description: [
    {
      languageCode: LanguageCode.en,
      value: 'DSV Shipping Rate Calculator - Calculate rates for Air, Sea, Road, and Rail',
    },
  ],
  args: {
    transportMode: {
      type: 'string',
      ui: {
        component: 'select-form-input',
        options: [
          { value: 'Air', label: [{ languageCode: LanguageCode.en, value: 'Air Freight' }] },
          { value: 'Sea', label: [{ languageCode: LanguageCode.en, value: 'Sea Freight' }] },
          { value: 'Road', label: [{ languageCode: LanguageCode.en, value: 'Road (EU)' }] },
          { value: 'Rail', label: [{ languageCode: LanguageCode.en, value: 'Rail' }] },
        ],
      },
      label: [{ languageCode: LanguageCode.en, value: 'Transport Mode' }],
      description: [{ languageCode: LanguageCode.en, value: 'Select the transport mode for shipping' }],
    },
    serviceLevel: {
      type: 'string',
      ui: {
        component: 'select-form-input',
        options: [
          { value: 'Standard', label: [{ languageCode: LanguageCode.en, value: 'Standard' }] },
          { value: 'Express', label: [{ languageCode: LanguageCode.en, value: 'Express' }] },
          { value: 'Economy', label: [{ languageCode: LanguageCode.en, value: 'Economy' }] },
          { value: 'FCL', label: [{ languageCode: LanguageCode.en, value: 'FCL (Full Container)' }] },
          { value: 'LCL', label: [{ languageCode: LanguageCode.en, value: 'LCL (Less than Container)' }] },
          { value: 'Same-Day', label: [{ languageCode: LanguageCode.en, value: 'Same Day' }] },
        ],
      },
      label: [{ languageCode: LanguageCode.en, value: 'Service Level' }],
      defaultValue: 'Standard',
    },
    includeInsurance: {
      type: 'boolean',
      ui: { component: 'boolean-form-input' },
      label: [{ languageCode: LanguageCode.en, value: 'Include Insurance' }],
      defaultValue: false,
    },
    taxRate: {
      type: 'int',
      ui: { component: 'number-form-input', suffix: '%' },
      label: [{ languageCode: LanguageCode.en, value: 'Tax Rate' }],
      defaultValue: 0,
    },
  },

  // Dependency injection using official Vendure pattern
  init(injector: Injector) {
    console.info('[DSV Rate Calculator] Injecting DsvApiService');
    apiService = injector.get(DsvApiService);
  },

  // Calculate shipping rate
  calculate: async (ctx: RequestContext, order: Order, args) => {
    console.info('[DSV Rate Calculator] Calculating shipping rate for order:', order.code);

    try {
      if (!order.shippingAddress) {
        throw new Error('Shipping address is required');
      }

      // Build quote request
      const quoteRequest: DsvQuoteRequest = {
        transportMode: args.transportMode as DsvTransportMode,
        origin: {
          countryCode: 'ZA',
          postalCode: '0001',
          city: 'Pretoria',
        },
        destination: {
          countryCode: order.shippingAddress.countryCode || '',
          postalCode: order.shippingAddress.postalCode || undefined,
          city: order.shippingAddress.city || undefined,
        },
        packages: calculatePackages(order),
        serviceLevel: args.serviceLevel as DsvServiceLevel,
        includeInsurance: args.includeInsurance as boolean,
        customerReference: order.code,
      };

      // Check cache
      const cacheKey = buildCacheKey(quoteRequest);
      let quoteResponse = quoteCache.get<any>(cacheKey);

      if (!quoteResponse) {
        console.info('[DSV Rate Calculator] Requesting quote from DSV API');
        quoteResponse = await apiService.getQuote(quoteRequest);
        quoteCache.set(cacheKey, quoteResponse);
      }

      if (!quoteResponse.options || quoteResponse.options.length === 0) {
        throw new Error('No shipping rates available');
      }

      // Select best option
      const selectedOption = selectBestOption(quoteResponse.options, args.serviceLevel as DsvServiceLevel);

      return {
        price: selectedOption.totalPrice.amount,
        priceIncludesTax: ctx.channel.pricesIncludeTax,
        taxRate: (args.taxRate as number) || 0,
        metadata: {
          dsvQuoteId: quoteResponse.quoteRequestId,
          dsvOptionId: selectedOption.optionId,
          carrier: selectedOption.carrier,
          transitTimeDays: selectedOption.transitTimeDays,
        },
      };

    } catch (error: any) {
      console.error('[DSV Rate Calculator] Error:', error.message);
      throw new Error(`Failed to calculate DSV shipping rate: ${error.message}`);
    }
  },
});

// Helper functions
function calculatePackages(order: Order): DsvPackage[] {
  let totalWeight = 0;
  let totalValue = 0;

  order.lines.forEach((line) => {
    const itemWeight = (line.productVariant.customFields as any)?.weight || 1;
    totalWeight += itemWeight * line.quantity;
    totalValue += line.proratedLinePrice;
  });

  return [{
    quantity: 1,
    packageType: 'Box',
    weight: totalWeight,
    description: `Order ${order.code}`,
    value: totalValue,
    currency: order.currencyCode,
  }];
}

function selectBestOption(options: any[], preferredServiceLevel: DsvServiceLevel): any {
  const exactMatch = options.find(opt => opt.serviceLevel === preferredServiceLevel);
  if (exactMatch) return exactMatch;

  return options.reduce((cheapest, current) => {
    if (!cheapest) return current;
    return current.totalPrice.amount < cheapest.totalPrice.amount ? current : cheapest;
  }, null);
}

function buildCacheKey(request: DsvQuoteRequest): string {
  return `quote:${request.transportMode}:${request.origin.countryCode}:${request.destination.countryCode}:${request.packages[0]?.weight || 0}`;
}
