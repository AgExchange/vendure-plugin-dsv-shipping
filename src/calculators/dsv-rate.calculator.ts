/**
 * DSV Rate Calculator (CORRECTED)
 * 
 * **IMPORTANT**: This calculator ONLY returns shipping prices
 * - NO booking creation during checkout
 * - NO API calls to DSV (except optional Quote API)
 * - Bookings are created AFTER payment via FulfillmentHandler
 * 
 * Vendure calls this calculator MULTIPLE TIMES during checkout:
 * - When customer adds items
 * - When customer changes quantities
 * - When customer updates shipping address
 * - When customer views eligible shipping methods
 * 
 * Creating bookings here would:
 * - Create multiple duplicate bookings for one order
 * - Hit rate limits (429 errors)
 * - Create bookings before payment
 * 
 * @see DsvFulfillmentHandler for actual booking creation
 */

import {
    ShippingCalculator,
    LanguageCode,
    ShippingCalculationResult,
    Injector,
} from '@vendure/core';
import {
    DsvShippingPluginOptions,
    DsvRateCalculatorArgs,
} from '../types/plugin-options.types';

// Module-level variables
let pluginOptions: DsvShippingPluginOptions;

/**
 * Initialize calculator with plugin options
 */
export function initDsvCalculator(options: DsvShippingPluginOptions): void {
    pluginOptions = options;
}

/**
 * DSV Shipping Rate Calculator
 * 
 * Returns static shipping prices during checkout
 * Actual booking creation happens in FulfillmentHandler after payment
 */
export const dsvRateCalculator = new ShippingCalculator({
    code: 'dsv-rate-calculator',
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'DSV Shipping Rates',
        },
    ],
    
    args: {
        transportMode: {
            type: 'string',
            ui: {
                component: 'select-form-input',
                options: [
                    { value: 'Road', label: [{ languageCode: LanguageCode.en, value: 'Road Freight' }] },
                ],
            },
            label: [{ languageCode: LanguageCode.en, value: 'Transport Mode' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'DSV transport mode (currently Road only)',
                },
            ],
            defaultValue: 'Road',
        },
        
        serviceLevel: {
            type: 'string',
            ui: {
                component: 'select-form-input',
                options: [
                    { value: 'Standard', label: [{ languageCode: LanguageCode.en, value: 'Standard' }] },
                    { value: 'Express', label: [{ languageCode: LanguageCode.en, value: 'Express' }] },
                ],
            },
            label: [{ languageCode: LanguageCode.en, value: 'Service Level' }],
            defaultValue: 'Standard',
        },
        
        basePrice: {
            type: 'int',
            ui: { component: 'currency-form-input' },
            label: [{ languageCode: LanguageCode.en, value: 'Base Shipping Price' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'Base price for shipping (actual cost calculated at fulfillment)',
                },
            ],
            defaultValue: 15000, // R150.00 in cents
        },
        
        pricePerKg: {
            type: 'int',
            ui: { component: 'currency-form-input' },
            label: [{ languageCode: LanguageCode.en, value: 'Price per KG' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'Additional price per kilogram',
                },
            ],
            defaultValue: 500, // R5.00 per kg in cents
        },
        
        taxRate: {
            type: 'int',
            ui: { component: 'number-form-input', suffix: '%' },
            label: [{ languageCode: LanguageCode.en, value: 'Tax Rate' }],
            defaultValue: 15,
        },
    },
    
    /**
     * Initialize calculator
     */
    init(injector: Injector) {
        // No services needed - we're just calculating static prices
    },
    
    /**
     * Calculate shipping rate for order
     * 
     * **CRITICAL**: Only returns PRICE
     * NO booking creation happens here
     * 
     * @returns ShippingCalculationResult with estimated price
     */
    calculate: async (ctx, order, args): Promise<ShippingCalculationResult> => {
        // Calculate total weight from order lines
        let totalWeight = 0;
        for (const line of order.lines) {
            const variantWeight = (line as any).productVariant?.customFields?.weight || 1;
            totalWeight += line.quantity * variantWeight;
        }
        
        // Calculate price: base + (weight * rate)
        const weightPrice = Math.ceil(totalWeight * args.pricePerKg);
        const totalPrice = args.basePrice + weightPrice;
        
        // Estimate delivery date (base + 2 days)
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 2);
        
        // Return price WITHOUT creating any bookings
        return {
            price: totalPrice,
            priceIncludesTax: false,
            taxRate: args.taxRate || 15,
            metadata: {
                transportMode: args.transportMode,
                serviceLevel: args.serviceLevel,
                estimatedDelivery: estimatedDelivery.toISOString().split('T')[0],
                totalWeight,
                // Note: Actual booking will be created after payment
                note: 'Estimated shipping cost - actual booking created at fulfillment',
            },
        };
    },
});
