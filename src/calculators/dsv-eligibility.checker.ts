/**
 * DSV Shipping Eligibility Checker
 * 
 * Determines if an order qualifies for DSV shipping
 * - Validates required address fields
 * - Uses Vendure's shouldRunCheck for caching
 * - Prevents repeated checks during order changes
 */

import {
    ShippingEligibilityChecker,
    LanguageCode,
} from '@vendure/core';

/**
 * DSV Shipping Eligibility Checker
 * 
 * Checks if order has:
 * 1. Valid shipping address with country code and city
 * 2. At least one line item
 * 3. Positive total weight
 */
export const dsvEligibilityChecker = new ShippingEligibilityChecker({
    code: 'dsv-shipping-eligibility',
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'Checks if order is eligible for DSV shipping',
        },
    ],
    
    args: {
        // No configuration needed - validates standard requirements
    },
    
    /**
     * shouldRunCheck - Caching optimization
     * 
     * Only re-run eligibility check when shipping address changes
     * This prevents repeated checks during quantity/item changes
     */
    shouldRunCheck: (ctx, order) => {
        // Return shipping address as cache key
        // If address hasn't changed, Vendure won't call check() again
        return {
            shippingAddressId: order.shippingAddress?.id,
            countryCode: order.shippingAddress?.countryCode,
            city: order.shippingAddress?.city,
            hasLines: order.lines.length > 0,
        };
    },
    
    /**
     * check - Eligibility validation
     * 
     * Only called when shouldRunCheck returns a different value
     * Validates order has minimum requirements for DSV shipping
     */
    check: async (ctx, order) => {
        // Must have shipping address
        if (!order.shippingAddress) {
            return false;
        }
        
        // Must have country code
        if (!order.shippingAddress.countryCode) {
            return false;
        }
        
        // Must have city
        if (!order.shippingAddress.city) {
            return false;
        }
        
        // Must have at least one line item
        if (!order.lines || order.lines.length === 0) {
            return false;
        }
        
        // Must have positive total weight (all lines combined)
        const totalWeight = order.lines.reduce((sum, line) => {
            // Each line has quantity * variant weight
            const variantWeight = (line as any).productVariant?.customFields?.weight || 1;
            return sum + (line.quantity * variantWeight);
        }, 0);
        
        if (totalWeight <= 0) {
            return false;
        }
        
        // Order qualifies for DSV shipping
        return true;
    },
});
