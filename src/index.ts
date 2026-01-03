import { PluginCommonModule, VendurePlugin } from '@vendure/core';
import { DsvShippingPluginOptions } from './types';
import { DsvAuthService } from './services/dsv-auth.service';
import { DsvApiService } from './services/dsv-api.service';
import { dsvRateCalculator, initDsvCalculator } from './calculators/dsv-rate.calculator';

@VendurePlugin({
  imports: [PluginCommonModule],
  providers: [DsvAuthService, DsvApiService],
  configuration: (config) => {
    config.shippingOptions.shippingCalculators = [
      ...(config.shippingOptions.shippingCalculators || []),
      dsvRateCalculator,
    ];
    return config;
  },
  compatibility: '^3.0.0',
})
export class DsvShippingPlugin {
  static init(options: DsvShippingPluginOptions): typeof DsvShippingPlugin {
    console.info('[DSV Plugin] Initializing DSV Shipping Plugin');
    
    // Validate options
    validateOptions(options);
    
    // Initialize calculator with options
    initDsvCalculator(options);
    
    console.info('[DSV Plugin] Plugin initialized successfully');
    return this;
  }
}

function validateOptions(options: DsvShippingPluginOptions): void {
  const required = ['clientEmail', 'clientPassword', 'subscriptionKey', 'testMdmAccount', 'environment'];
  const missing = required.filter(field => !options[field as keyof DsvShippingPluginOptions]);
  
  if (missing.length > 0) {
    throw new Error(`DSV Plugin: Missing required options: ${missing.join(', ')}`);
  }
}

export * from './types';
export { DsvAuthService } from './services/dsv-auth.service';
export { DsvApiService } from './services/dsv-api.service';
