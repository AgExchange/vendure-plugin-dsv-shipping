/**
 * DSV Rate Calculator
 * 
 * Vendure ShippingCalculator implementation for DSV shipping rates
 * - Integrates with DSV Quote API
 * - Supports all 4 transport modes (Air, Sea, Road, Rail)
 * - Returns real-time shipping rates to customers
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
    DsvQuoteRequest,
    DsvBookingRequest,
    DsvTransportMode,
    DsvServiceLevel,
} from '../types/plugin-options.types';
import { DsvAuthService } from '../services/dsv-auth.service';
import { DsvQuoteService } from '../services/dsv-quote.service';
import { DsvBookingService } from '../services/dsv-booking.service';
import {
    calculatePackages,
    convertAddress,
    convertContact,
    validateOrderForQuote,
    DEFAULT_UNITS,
} from '../utils/package-calculator';
import {
    buildBookingParties,
    calculateBookingTime,
    convertToBookingPackages,
} from '../utils/booking-converter';

// Module-level variables to hold services and options
let authService: DsvAuthService;
let quoteService: DsvQuoteService;
let bookingService: DsvBookingService;
let pluginOptions: DsvShippingPluginOptions;

/**
 * Initialize calculator with plugin options
 * Called from plugin initialization
 */
export function initDsvCalculator(options: DsvShippingPluginOptions): void {
    pluginOptions = options;
    console.info('[DSV Rate Calculator] Initializing with options');
}

/**
 * DSV Shipping Rate Calculator
 * Calculates real-time shipping rates from DSV Quote API
 */
export const dsvRateCalculator = new ShippingCalculator({
    code: 'dsv-rate-calculator',
    description: [
        {
            languageCode: LanguageCode.en,
            value: 'DSV Real-Time Shipping Rate Calculator',
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
                    { value: 'Road', label: [{ languageCode: LanguageCode.en, value: 'Road Freight (EU)' }] },
                    { value: 'Rail', label: [{ languageCode: LanguageCode.en, value: 'Rail Freight' }] },
                ],
            },
            label: [{ languageCode: LanguageCode.en, value: 'Transport Mode' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'Select the DSV transport mode for this shipping method',
                },
            ],
        },
        
        serviceLevel: {
            type: 'string',
            ui: {
                component: 'select-form-input',
                options: [
                    { value: 'Express', label: [{ languageCode: LanguageCode.en, value: 'Express' }] },
                    { value: 'Standard', label: [{ languageCode: LanguageCode.en, value: 'Standard' }] },
                    { value: 'Economy', label: [{ languageCode: LanguageCode.en, value: 'Economy' }] },
                ],
            },
            label: [{ languageCode: LanguageCode.en, value: 'Service Level' }],
            defaultValue: 'Standard',
        },
        
        includeInsurance: {
            type: 'boolean',
            label: [{ languageCode: LanguageCode.en, value: 'Include Insurance' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'Include goods insurance in the quote',
                },
            ],
            defaultValue: false,
        },
        
        taxRate: {
            type: 'int',
            ui: {
                component: 'number-form-input',
                suffix: '%',
            },
            label: [{ languageCode: LanguageCode.en, value: 'Tax Rate' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'Tax rate percentage (e.g., 15 for 15% VAT)',
                },
            ],
            defaultValue: 15,
        },
        
        originAirport: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Origin Airport Code (Air only)' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'IATA airport code (e.g., JNB for Johannesburg)',
                },
            ],
            required: false,
        },
        
        destinationAirport: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Destination Airport Code (Air only)' }],
            required: false,
        },
        
        originPort: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Origin Port Code (Sea only)' }],
            description: [
                {
                    languageCode: LanguageCode.en,
                    value: 'UN/LOCODE port code (e.g., ZADUR for Durban)',
                },
            ],
            required: false,
        },
        
        destinationPort: {
            type: 'string',
            label: [{ languageCode: LanguageCode.en, value: 'Destination Port Code (Sea only)' }],
            required: false,
        },
    },
    
    /**
     * Initialize calculator
     * Injects Vendure services and initializes DSV services
     */
    init(injector: Injector) {
        console.info('[DSV Rate Calculator] Initializing services');
        
        // Get DSV services from injector
        authService = injector.get(DsvAuthService);
        quoteService = injector.get(DsvQuoteService);
        bookingService = injector.get(DsvBookingService);
        
        // Initialize services with plugin options
        authService.init(pluginOptions);
        quoteService.init(pluginOptions);
        bookingService.init(pluginOptions);
        
        console.info('[DSV Rate Calculator] Services initialized successfully');
    },
    
    /**
     * Calculate shipping rate for order
     * Called by Vendure when customer requests eligible shipping methods
     */
    calculate: async (ctx, order, args) => {
        console.info('[DSV Rate Calculator] Testing DSV Booking API', {
            orderId: order.id,
            orderCode: order.code,
            transportMode: args.transportMode,
            serviceLevel: args.serviceLevel,
        });
        
        // When quote feature is disabled, test Booking API instead
        if (!pluginOptions?.features?.quote) {
            console.info('[DSV Rate Calculator] Quote disabled, testing Booking API (LIVE MODE - CREATES REAL BOOKING)');
            
            try {
                // Validate order has required data
                const validation = validateOrderForQuote(order);
                if (!validation.valid) {
                    console.error('[DSV Rate Calculator] Order validation failed', {
                        errors: validation.errors,
                    });
                    return {
                        price: 0,
                        priceIncludesTax: false,
                        taxRate: args.taxRate || 0,
                        metadata: {
                            error: true,
                            message: `Order validation failed: ${validation.errors.join(', ')}`,
                        },
                    };
                }
                
                // Calculate packages from order
                const { packages: oldPackages, totalWeight, totalValue } = calculatePackages(order);
                
                // Convert to Booking API v2 package structure
                const packages = convertToBookingPackages(order.lines as any[], pluginOptions);
                
                console.info('[DSV Rate Calculator] Packages calculated', {
                    packageCount: packages.length,
                });
                
                // Build booking request with correct Booking API v2 structure
                const bookingRequest: DsvBookingRequest = {
                    autobook: true, // TRUE - Create real booking for testing
                    
                    product: {
                        name: pluginOptions.bookingDefaults.product,
                        dropOff: false,
                    },
                    
                    parties: buildBookingParties(
                        order,
                        null, // No warehouse in test order - uses fallback
                        pluginOptions.testMdmAccount,
                        pluginOptions
                    ),
                    
                    pickupTime: calculateBookingTime(
                        pluginOptions.bookingDefaults.pickupTime.daysFromNow,
                        pluginOptions.bookingDefaults.pickupTime.start,
                        pluginOptions.bookingDefaults.pickupTime.end
                    ),
                    
                    deliveryTime: calculateBookingTime(
                        pluginOptions.bookingDefaults.deliveryTime.daysFromNow,
                        pluginOptions.bookingDefaults.deliveryTime.start,
                        pluginOptions.bookingDefaults.deliveryTime.end
                    ),
                    
                    // Match working example - include instructions
                    pickupInstructions: [],  // Empty array like working example
                    deliveryInstructions: [],  // Empty array like working example
                    
                    incoterms: pluginOptions.bookingDefaults.incoterms,
                    
                    packages,
                    
                    references: [
                        {
                            value: order.code || 'TEST',
                            type: 'ORDER_NUMBER',
                        },
                    ],
                    
                    units: pluginOptions.bookingDefaults.units,
                };
                
                // Add insurance if enabled in calculator args
                if (args.includeInsurance && pluginOptions.bookingDefaults.insurance?.enabled) {
                    bookingRequest.services = {
                        insurance: {
                            amount: {
                                value: totalValue,
                                currency: pluginOptions.bookingDefaults.insurance.currency,
                            },
                            category: pluginOptions.bookingDefaults.insurance.category,
                        },
                    };
                }
                
                // Test Booking API
                const bookingResponse = await bookingService.createBooking(bookingRequest);
                
                console.info('[DSV Rate Calculator] Booking API test successful', {
                    bookingId: bookingResponse.bookingId,
                    status: bookingResponse.status,
                });
                
                // Return success with booking details
                return {
                    price: 0, // Real price would come from quote
                    priceIncludesTax: false,
                    taxRate: args.taxRate || 0,
                    metadata: {
                        success: true,
                        message: '✓ DSV Booking API test successful (LIVE BOOKING CREATED)',
                        bookingId: bookingResponse.bookingId,
                        status: bookingResponse.status,
                        transportMode: pluginOptions.bookingDefaults.product,
                        carrier: bookingResponse.carrier || 'DSV',
                        note: 'Live booking created - shipment is real!',
                    },
                };
                
            } catch (error) {
                console.error('[DSV Rate Calculator] Booking API test failed', {
                    error: error instanceof Error ? error.message : String(error),
                });
                
                return {
                    price: 0,
                    priceIncludesTax: false,
                    taxRate: args.taxRate || 0,
                    metadata: {
                        error: true,
                        message: 'Booking API test failed',
                        details: error instanceof Error ? error.message : String(error),
                    },
                };
            }
        }
        
        // If quote feature IS enabled, use Quote API
        try {
            // Validate order has required data
            const validation = validateOrderForQuote(order);
            if (!validation.valid) {
                console.error('[DSV Rate Calculator] Order validation failed', {
                    errors: validation.errors,
                });
                throw new Error(`Order validation failed: ${validation.errors.join(', ')}`);
            }
            
            // Calculate packages from order
            const { packages, totalWeight, totalValue } = calculatePackages(order);
            
            console.info('[DSV Rate Calculator] Packages calculated', {
                packageCount: packages.length,
                totalWeight,
                totalValue,
            });
            
            // Build quote request
            const quoteRequest: DsvQuoteRequest = {
                requestedBy: convertContact(order.customer),
                bookingParty: convertAddress(
                    { ...order.shippingAddress, fullName: order.customer?.firstName || 'Customer' },
                    pluginOptions.testMdmAccount
                ),
                from: convertAddress(
                    {
                        fullName: 'Warehouse',
                        countryCode: 'ZA',
                        city: 'Johannesburg',
                        postalCode: '2000',
                        streetLine1: 'Warehouse Address',
                    },
                    pluginOptions.testMdmAccount
                ),
                to: convertAddress(order.shippingAddress),
                cargoType: 'LCL', // Less than Container Load for e-commerce
                packages,
                totalWeight,
                unitsOfMeasurement: DEFAULT_UNITS,
            };
            
            // Add transport mode specific data
            const transportMode = args.transportMode as DsvTransportMode;
            const serviceLevel = args.serviceLevel as DsvServiceLevel;
            
            switch (transportMode) {
                case 'Air':
                    quoteRequest.air = {
                        originAirport: args.originAirport || undefined,
                        destinationAirport: args.destinationAirport || undefined,
                        serviceLevel,
                    };
                    break;
                    
                case 'Sea':
                    quoteRequest.sea = {
                        originPort: args.originPort || undefined,
                        destinationPort: args.destinationPort || undefined,
                        serviceLevel,
                    };
                    break;
                    
                case 'Road':
                    quoteRequest.road = {
                        serviceLevel,
                    };
                    break;
                    
                case 'Rail':
                    quoteRequest.rail = {
                        serviceLevel,
                    };
                    break;
            }
            
            // Get quote from DSV
            const quoteResponse = await quoteService.getQuote(quoteRequest);
            
            // Find the best matching option (first one for now)
            if (!quoteResponse.options || quoteResponse.options.length === 0) {
                throw new Error('No shipping options available for this route');
            }
            
            const selectedOption = quoteResponse.options[0];
            
            console.info('[DSV Rate Calculator] Quote received', {
                quoteId: quoteResponse.quoteRequestId,
                optionId: selectedOption.optionId,
                price: selectedOption.totalPrice.amount,
                carrier: selectedOption.carrier,
                transitDays: selectedOption.transitTimeDays,
            });
            
            // Return shipping calculation result
            const result: ShippingCalculationResult = {
                price: selectedOption.totalPrice.amount * 100, // Convert to cents
                priceIncludesTax: ctx.channel.pricesIncludeTax,
                taxRate: args.taxRate,
                metadata: {
                    dsvQuoteId: quoteResponse.quoteRequestId,
                    dsvOptionId: selectedOption.optionId,
                    carrier: selectedOption.carrier,
                    transportMode: selectedOption.transportMode,
                    serviceLevel: selectedOption.serviceLevel,
                    transitTimeDays: selectedOption.transitTimeDays,
                    currency: selectedOption.totalPrice.currency,
                },
            };
            
            console.info('[DSV Rate Calculator] Rate calculated successfully', {
                price: result.price,
                metadata: result.metadata,
            });
            
            return result;
            
        } catch (error) {
            console.error('[DSV Rate Calculator] Failed to calculate rate', {
                error: error instanceof Error ? error.message : String(error),
            });
            
            // Return a fallback rate so checkout doesn't break
            // In production, you might want to throw the error instead
            return {
                price: 0,
                priceIncludesTax: ctx.channel.pricesIncludeTax,
                taxRate: args.taxRate,
                metadata: {
                    error: 'Failed to get quote from DSV',
                    message: error instanceof Error ? error.message : String(error),
                },
            };
        }
    },
});
