/**
 * DSV API Types
 * 
 * Based on DSV Developer Guide: https://developer.dsv.com/guide-mydsv
 * These types represent the request and response structures for DSV Generic APIs
 */

/**
 * Plugin Configuration Options
 */
export interface DsvShippingPluginOptions {
  /**
   * OAuth 2.0 client email (system account)
   * Provided by DSV after subscription approval
   */
  clientEmail: string;

  /**
   * OAuth 2.0 client password
   * Provided by DSV after subscription approval
   */
  clientPassword: string;

  /**
   * DSV Subscription Key (API Key)
   * Found in Developer Portal profile page
   * Format: b5c09b92fbf24d62a17caad22227c470
   */
  subscriptionKey: string;

  /**
   * Test MDM account number for Booking Party and Freight Payer
   * 10-digit number provided by DSV
   * Required for booking API calls
   */
  testMdmAccount: string;

  /**
   * API Environment
   * test: https://api-uat.dsv.com
   * production: https://api.dsv.com
   */
  environment: 'test' | 'production';

  /**
   * Supported transport modes
   * Default: ['Air', 'Sea', 'Road', 'Rail']
   */
  transportModes?: DsvTransportMode[];

  /**
   * Default tax rate for shipping (percentage)
   * Default: 0
   */
  defaultTaxRate?: number;

  /**
   * Enable auto-booking (skip draft mode)
   * false = bookings submitted as draft (requires confirmation)
   * true = bookings sent directly to DSV
   * Default: false
   */
  autoBook?: boolean;

  /**
   * Enable debug logging
   * Logs all API requests and responses
   * Default: false
   */
  debugMode?: boolean;

  /**
   * Quote cache TTL in seconds
   * Default: 300 (5 minutes)
   */
  quoteCacheTTL?: number;
}

/**
 * DSV Transport Modes
 */
export type DsvTransportMode = 'Air' | 'Sea' | 'Road' | 'Rail';

/**
 * DSV Service Levels
 */
export type DsvServiceLevel = 'Standard' | 'Express' | 'Economy' | 'FCL' | 'LCL' | 'Same-Day';

/**
 * OAuth 2.0 Token Request
 */
export interface DsvTokenRequest {
  grant_type: 'password';
  username: string;
  password: string;
}

/**
 * OAuth 2.0 Token Response
 */
export interface DsvTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // Seconds until expiration
  refresh_token?: string;
}

/**
 * DSV Address
 */
export interface DsvAddress {
  /**
   * MDM account number (Master Data Management)
   * Required for Booking Party and Freight Payer
   * Optional for other addresses
   */
  mdm?: string;

  /**
   * Company name
   */
  name?: string;

  /**
   * Street address line 1
   */
  addressLine1?: string;

  /**
   * Street address line 2
   */
  addressLine2?: string;

  /**
   * City
   */
  city?: string;

  /**
   * State or province code
   */
  stateCode?: string;

  /**
   * Postal code
   */
  postalCode?: string;

  /**
   * ISO 3166-1 alpha-2 country code (e.g., "US", "GB", "DE")
   */
  countryCode: string;

  /**
   * Contact person name
   */
  contactName?: string;

  /**
   * Contact phone number
   */
  phoneNumber?: string;

  /**
   * Contact email address
   */
  email?: string;
}

/**
 * DSV Package/Cargo Details
 */
export interface DsvPackage {
  /**
   * Number of packages
   */
  quantity: number;

  /**
   * Package type (e.g., "Box", "Pallet", "Crate")
   */
  packageType?: string;

  /**
   * Weight in kilograms
   */
  weight: number;

  /**
   * Length in centimeters
   */
  length?: number;

  /**
   * Width in centimeters
   */
  width?: number;

  /**
   * Height in centimeters
   */
  height?: number;

  /**
   * Volume in cubic meters
   */
  volume?: number;

  /**
   * Goods description
   */
  description?: string;

  /**
   * HS Code (Harmonized System code for customs)
   */
  hsCode?: string;

  /**
   * Commodity value
   */
  value?: number;

  /**
   * Currency code (ISO 4217, e.g., "USD", "EUR")
   */
  currency?: string;
}

/**
 * DSV Quote Request
 */
export interface DsvQuoteRequest {
  /**
   * Transport mode
   */
  transportMode: DsvTransportMode;

  /**
   * Origin address
   */
  origin: {
    countryCode: string;
    postalCode?: string;
    city?: string;
  };

  /**
   * Destination address
   */
  destination: {
    countryCode: string;
    postalCode?: string;
    city?: string;
  };

  /**
   * Package/cargo details
   */
  packages: DsvPackage[];

  /**
   * Service level (optional)
   */
  serviceLevel?: DsvServiceLevel;

  /**
   * Include insurance (optional)
   */
  includeInsurance?: boolean;

  /**
   * Pickup date (ISO 8601 format)
   */
  pickupDate?: string;

  /**
   * Delivery date (ISO 8601 format)
   */
  deliveryDate?: string;

  /**
   * Customer reference
   */
  customerReference?: string;
}

/**
 * DSV Quote Response
 */
export interface DsvQuoteResponse {
  /**
   * Quote request ID
   */
  quoteRequestId: string;

  /**
   * Quote status
   */
  status: 'Draft' | 'AwaitingForOptions' | 'Completed' | 'Cancelled';

  /**
   * Available quote options
   */
  options: DsvQuoteOption[];

  /**
   * Request timestamp
   */
  createdDate: string;

  /**
   * Last update timestamp
   */
  lastUpdatedDate: string;
}

/**
 * DSV Quote Option
 */
export interface DsvQuoteOption {
  /**
   * Option ID
   */
  optionId: string;

  /**
   * Transport mode
   */
  transportMode: DsvTransportMode;

  /**
   * Service level
   */
  serviceLevel: string;

  /**
   * Total price
   */
  totalPrice: {
    /**
     * Amount
     */
    amount: number;

    /**
     * Currency code (ISO 4217)
     */
    currency: string;
  };

  /**
   * Price breakdown
   */
  priceBreakdown?: {
    freight?: number;
    insurance?: number;
    fuel?: number;
    customs?: number;
    other?: number;
  };

  /**
   * Estimated pickup date
   */
  estimatedPickupDate?: string;

  /**
   * Estimated delivery date
   */
  estimatedDeliveryDate?: string;

  /**
   * Transit time in days
   */
  transitTimeDays?: number;

  /**
   * Carrier name
   */
  carrier?: string;

  /**
   * Additional service options
   */
  services?: string[];
}

/**
 * DSV Booking Request
 */
export interface DsvBookingRequest {
  /**
   * Auto-book flag
   * false = draft booking (requires confirmation)
   * true = direct booking to DSV
   */
  autobook: boolean;

  /**
   * Transport mode
   */
  transportMode: DsvTransportMode;

  /**
   * Booking parties
   */
  parties: {
    /**
     * Booking party (who places the booking)
     */
    bookingParty: {
      address: DsvAddress;
    };

    /**
     * Freight payer (who pays for shipping)
     */
    freightPayer: {
      address: DsvAddress;
    };

    /**
     * Shipper (sender)
     */
    shipper?: {
      address: DsvAddress;
    };

    /**
     * Consignee (receiver)
     */
    consignee?: {
      address: DsvAddress;
    };
  };

  /**
   * Cargo details
   */
  cargo: {
    packages: DsvPackage[];
  };

  /**
   * Service requirements
   */
  services?: {
    /**
     * Include insurance
     */
    insurance?: boolean;

    /**
     * Require dangerous goods handling
     */
    dangerousGoods?: boolean;

    /**
     * Temperature controlled
     */
    temperatureControlled?: boolean;
  };

  /**
   * Pickup details
   */
  pickup?: {
    /**
     * Requested pickup date (ISO 8601)
     */
    date?: string;

    /**
     * Pickup time window
     */
    timeWindow?: {
      from: string; // HH:mm format
      to: string;
    };

    /**
     * Special instructions
     */
    instructions?: string;
  };

  /**
   * Delivery details
   */
  delivery?: {
    /**
     * Requested delivery date (ISO 8601)
     */
    date?: string;

    /**
     * Delivery time window
     */
    timeWindow?: {
      from: string;
      to: string;
    };

    /**
     * Special instructions
     */
    instructions?: string;
  };

  /**
   * Customer references
   */
  references?: {
    /**
     * Customer reference number
     */
    customerReference?: string;

    /**
     * Purchase order number
     */
    purchaseOrderNumber?: string;

    /**
     * Invoice number
     */
    invoiceNumber?: string;
  };
}

/**
 * DSV Booking Response
 */
export interface DsvBookingResponse {
  /**
   * DSV Booking ID (myDSV format)
   * Format: 40257145990000123456
   */
  bookingId: string;

  /**
   * DSV Shipment ID (internal format)
   * Format: SCPH1234567 or CPHUK-12345
   */
  shipmentId?: string;

  /**
   * Booking status
   */
  status: 'Draft' | 'Confirmed' | 'Cancelled';

  /**
   * Confirmation timestamp
   */
  confirmedDate?: string;

  /**
   * Carrier details
   */
  carrier?: {
    name: string;
    trackingNumber?: string;
  };

  /**
   * Estimated pickup
   */
  estimatedPickup?: string;

  /**
   * Estimated delivery
   */
  estimatedDelivery?: string;

  /**
   * Validation messages
   */
  messages?: Array<{
    type: 'Info' | 'Warning' | 'Error';
    code: string;
    message: string;
  }>;
}

/**
 * DSV Tracking Response
 */
export interface DsvTrackingResponse {
  /**
   * DSV Shipment ID
   */
  shipmentId: string;

  /**
   * DSV Booking ID
   */
  bookingId: string;

  /**
   * Transport mode
   */
  transportMode: DsvTransportMode;

  /**
   * Shipment status
   */
  status: string;

  /**
   * Booked by
   */
  bookedBy?: string;

  /**
   * Origin address
   */
  origin?: DsvAddress;

  /**
   * Destination address
   */
  destination?: DsvAddress;

  /**
   * Estimated pickup date/time
   */
  estimatedPickup?: string;

  /**
   * Actual pickup date/time
   */
  actualPickup?: string;

  /**
   * Estimated delivery date/time
   */
  estimatedDelivery?: string;

  /**
   * Actual delivery date/time
   */
  actualDelivery?: string;

  /**
   * Shipment events
   */
  events?: DsvTrackingEvent[];

  /**
   * Customer references
   */
  references?: {
    customerReference?: string;
    purchaseOrderNumber?: string;
  };
}

/**
 * DSV Tracking Event
 */
export interface DsvTrackingEvent {
  /**
   * Event code
   */
  eventCode: string;

  /**
   * Event description
   */
  eventDescription: string;

  /**
   * Event date/time (ISO 8601)
   */
  eventDateTime: string;

  /**
   * Event location
   */
  location?: {
    city?: string;
    countryCode?: string;
  };

  /**
   * Event status
   */
  status?: string;
}

/**
 * DSV Label Request
 */
export interface DsvLabelRequest {
  /**
   * DSV Booking ID
   */
  bookingId: string;

  /**
   * Label format
   */
  format?: 'PDF' | 'ZPL';
}

/**
 * DSV Label Response
 */
export interface DsvLabelResponse {
  /**
   * Label data (base64 encoded)
   */
  labelData: string;

  /**
   * Format
   */
  format: 'PDF' | 'ZPL';

  /**
   * MIME type
   */
  mimeType: string;
}

/**
 * DSV Document Upload Request
 */
export interface DsvDocumentUploadRequest {
  /**
   * DSV Booking ID or Shipment ID
   */
  shipmentIdentifier: string;

  /**
   * Document type
   */
  documentType: 'CUS' | 'GDS' | 'HAZ' | 'INV' | 'PKL';

  /**
   * Document name
   */
  fileName: string;

  /**
   * Document data (base64 encoded)
   */
  fileData: string;
}

/**
 * DSV Error Response
 */
export interface DsvErrorResponse {
  /**
   * Error code
   */
  code: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Error details
   */
  details?: string;

  /**
   * Timestamp
   */
  timestamp?: string;
}

/**
 * Internal cache entry for quotes
 */
export interface DsvQuoteCacheEntry {
  quote: DsvQuoteResponse;
  timestamp: number;
  expiresAt: number;
}
