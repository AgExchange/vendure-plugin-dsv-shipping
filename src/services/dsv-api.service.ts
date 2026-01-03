import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  DsvShippingPluginOptions,
  DsvQuoteRequest,
  DsvQuoteResponse,
  DsvBookingRequest,
  DsvBookingResponse,
  DsvTrackingResponse,
  DsvLabelRequest,
  DsvLabelResponse,
  DsvErrorResponse,
} from '../types';
import { DsvAuthService } from './dsv-auth.service';

/**
 * DSV API Service
 * 
 * Low-level HTTP client for DSV Generic APIs.
 * Handles all API endpoints with proper authentication and error handling.
 * 
 * All requests include:
 * - Authorization: Bearer <access_token>
 * - DSV-Subscription-Key: <subscription_key>
 * 
 * API Documentation: https://developer.dsv.com/guide-mydsv
 */
@Injectable()
export class DsvApiService {
  private readonly axiosInstance: AxiosInstance;
  private readonly baseUrl: string;

  constructor(
    private readonly options: DsvShippingPluginOptions,
    private readonly authService: DsvAuthService
  ) {
    console.info('[DSV API Service] Initializing API service');

    // Set base URL based on environment
    this.baseUrl = options.environment === 'production'
      ? 'https://api.dsv.com'
      : 'https://api-uat.dsv.com';

    console.info(`[DSV API Service] Base URL: ${this.baseUrl}`);

    // Create axios instance for API requests
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 60000, // 60 second timeout for API calls
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // DSV-Subscription-Key is added per request
      },
    });

    // Add request interceptor to inject authentication
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Get valid access token
        const token = await this.authService.getAccessToken();

        // Add authentication headers
        config.headers.Authorization = `Bearer ${token}`;
        config.headers['DSV-Subscription-Key'] = this.options.subscriptionKey;

        if (this.options.debugMode) {
          console.info('[DSV API Service] Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: this.sanitizeHeaders(config.headers),
            data: config.data ? JSON.stringify(config.data, null, 2) : undefined,
          });
        }

        return config;
      },
      (error) => {
        console.error('[DSV API Service] Request interceptor error:', error.message);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (this.options.debugMode) {
          console.info('[DSV API Service] Response:', {
            status: response.status,
            statusText: response.statusText,
            data: JSON.stringify(response.data, null, 2),
          });
        }
        return response;
      },
      (error) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const data = error.response?.data as DsvErrorResponse | undefined;

          console.error('[DSV API Service] API Error:', {
            status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            errorData: data,
          });

          // Handle specific error codes
          if (status === 401) {
            console.error('[DSV API Service] Unauthorized - token may be invalid');
            console.error('[DSV API Service] Clearing token cache and retrying...');
            this.authService.clearToken();
          } else if (status === 403) {
            console.error('[DSV API Service] Forbidden - check subscription key and permissions');
          } else if (status === 429) {
            console.error('[DSV API Service] Rate limit exceeded - slow down requests');
          } else if (status === 400) {
            console.error('[DSV API Service] Bad request - check request data');
          } else if (status === 404) {
            console.error('[DSV API Service] Not found - check endpoint URL');
          } else if (status && status >= 500) {
            console.error('[DSV API Service] Server error - DSV API may be unavailable');
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get shipping quote
   * 
   * Endpoint: POST /Generic/Quote/v1
   * Documentation: https://developer.dsv.com/guide-mydsv#whe60
   */
  async getQuote(request: DsvQuoteRequest): Promise<DsvQuoteResponse> {
    console.info('[DSV API Service] Getting quote');
    console.info('[DSV API Service] Transport mode:', request.transportMode);
    console.info('[DSV API Service] Origin:', request.origin);
    console.info('[DSV API Service] Destination:', request.destination);
    console.info('[DSV API Service] Packages:', request.packages.length);

    try {
      const response = await this.axiosInstance.post<DsvQuoteResponse>(
        '/Generic/Quote/v1',
        request
      );

      console.info('[DSV API Service] Quote received successfully');
      console.info('[DSV API Service] Quote ID:', response.data.quoteRequestId);
      console.info('[DSV API Service] Status:', response.data.status);
      console.info('[DSV API Service] Options available:', response.data.options?.length || 0);

      return response.data;
    } catch (error: any) {
      console.error('[DSV API Service] Failed to get quote');
      this.logError('getQuote', error);
      throw this.normalizeError(error, 'Failed to get shipping quote');
    }
  }

  /**
   * Submit booking
   * 
   * Endpoint: POST /Generic/Booking/v2
   * Documentation: https://developer.dsv.com/guide-mydsv#manOr
   * 
   * IMPORTANT: For test environment, use test MDM account for Booking Party and Freight Payer
   */
  async submitBooking(request: DsvBookingRequest): Promise<DsvBookingResponse> {
    console.info('[DSV API Service] Submitting booking');
    console.info('[DSV API Service] Auto-book:', request.autobook);
    console.info('[DSV API Service] Transport mode:', request.transportMode);
    console.info('[DSV API Service] Booking party MDM:', request.parties.bookingParty.address.mdm);
    console.info('[DSV API Service] Freight payer MDM:', request.parties.freightPayer.address.mdm);

    // Validate MDM accounts in test environment
    if (this.options.environment === 'test') {
      if (!request.parties.bookingParty.address.mdm) {
        console.warn('[DSV API Service] Missing Booking Party MDM - adding test account');
        request.parties.bookingParty.address.mdm = this.options.testMdmAccount;
      }
      if (!request.parties.freightPayer.address.mdm) {
        console.warn('[DSV API Service] Missing Freight Payer MDM - adding test account');
        request.parties.freightPayer.address.mdm = this.options.testMdmAccount;
      }
    }

    try {
      const response = await this.axiosInstance.post<DsvBookingResponse>(
        '/Generic/Booking/v2',
        request
      );

      console.info('[DSV API Service] Booking submitted successfully');
      console.info('[DSV API Service] Booking ID:', response.data.bookingId);
      console.info('[DSV API Service] Status:', response.data.status);
      
      if (response.data.shipmentId) {
        console.info('[DSV API Service] Shipment ID:', response.data.shipmentId);
      }

      if (response.data.messages && response.data.messages.length > 0) {
        console.info('[DSV API Service] Booking messages:');
        response.data.messages.forEach((msg) => {
          console.info(`  [${msg.type}] ${msg.code}: ${msg.message}`);
        });
      }

      return response.data;
    } catch (error: any) {
      console.error('[DSV API Service] Failed to submit booking');
      this.logError('submitBooking', error);
      throw this.normalizeError(error, 'Failed to submit booking');
    }
  }

  /**
   * Validate booking (test mode - does not submit to DSV)
   * 
   * Endpoint: POST /Generic/Booking/v2/validate
   * Documentation: https://developer.dsv.com/guide-mydsv#manOr
   */
  async validateBooking(request: DsvBookingRequest): Promise<DsvBookingResponse> {
    console.info('[DSV API Service] Validating booking (test mode)');

    try {
      const response = await this.axiosInstance.post<DsvBookingResponse>(
        '/Generic/Booking/v2/validate',
        request
      );

      console.info('[DSV API Service] Booking validation successful');
      
      if (response.data.messages) {
        console.info('[DSV API Service] Validation messages:');
        response.data.messages.forEach((msg) => {
          console.info(`  [${msg.type}] ${msg.code}: ${msg.message}`);
        });
      }

      return response.data;
    } catch (error: any) {
      console.error('[DSV API Service] Booking validation failed');
      this.logError('validateBooking', error);
      throw this.normalizeError(error, 'Booking validation failed');
    }
  }

  /**
   * Track shipment by booking ID
   * 
   * Endpoint: GET /Generic/Tracking/v2/shipment/bookingId/{bookingId}
   * Documentation: https://developer.dsv.com/guide-mydsv#WI1bf
   */
  async trackShipmentByBookingId(bookingId: string): Promise<DsvTrackingResponse> {
    console.info('[DSV API Service] Tracking shipment by booking ID:', bookingId);

    try {
      const response = await this.axiosInstance.get<DsvTrackingResponse>(
        `/Generic/Tracking/v2/shipment/bookingId/${bookingId}`
      );

      console.info('[DSV API Service] Tracking data retrieved');
      console.info('[DSV API Service] Shipment ID:', response.data.shipmentId);
      console.info('[DSV API Service] Status:', response.data.status);
      console.info('[DSV API Service] Events:', response.data.events?.length || 0);

      return response.data;
    } catch (error: any) {
      console.error('[DSV API Service] Failed to track shipment');
      this.logError('trackShipmentByBookingId', error);
      throw this.normalizeError(error, 'Failed to track shipment');
    }
  }

  /**
   * Track shipment by shipment ID
   * 
   * Endpoint: GET /Generic/Tracking/v2/shipment/shipmentId/{shipmentId}
   * Documentation: https://developer.dsv.com/guide-mydsv#WI1bf
   */
  async trackShipmentByShipmentId(shipmentId: string): Promise<DsvTrackingResponse> {
    console.info('[DSV API Service] Tracking shipment by shipment ID:', shipmentId);

    try {
      const response = await this.axiosInstance.get<DsvTrackingResponse>(
        `/Generic/Tracking/v2/shipment/shipmentId/${shipmentId}`
      );

      console.info('[DSV API Service] Tracking data retrieved');
      console.info('[DSV API Service] Status:', response.data.status);

      return response.data;
    } catch (error: any) {
      console.error('[DSV API Service] Failed to track shipment');
      this.logError('trackShipmentByShipmentId', error);
      throw this.normalizeError(error, 'Failed to track shipment');
    }
  }

  /**
   * Track shipment by customer reference
   * 
   * Endpoint: GET /Generic/Tracking/v2/shipment/customerReference/{reference}
   * Documentation: https://developer.dsv.com/guide-mydsv#WI1bf
   */
  async trackShipmentByReference(reference: string): Promise<DsvTrackingResponse> {
    console.info('[DSV API Service] Tracking shipment by customer reference:', reference);

    try {
      const response = await this.axiosInstance.get<DsvTrackingResponse>(
        `/Generic/Tracking/v2/shipment/customerReference/${reference}`
      );

      console.info('[DSV API Service] Tracking data retrieved');
      console.info('[DSV API Service] Shipment ID:', response.data.shipmentId);

      return response.data;
    } catch (error: any) {
      console.error('[DSV API Service] Failed to track shipment');
      this.logError('trackShipmentByReference', error);
      throw this.normalizeError(error, 'Failed to track shipment');
    }
  }

  /**
   * Get shipping label
   * 
   * Endpoint: GET /Generic/Label/v1/print/{bookingId}
   * Documentation: https://developer.dsv.com/guide-mydsv#MBx8i
   */
  async getLabel(request: DsvLabelRequest): Promise<DsvLabelResponse> {
    console.info('[DSV API Service] Getting shipping label');
    console.info('[DSV API Service] Booking ID:', request.bookingId);
    console.info('[DSV API Service] Format:', request.format || 'PDF');

    try {
      const format = request.format || 'PDF';
      const response = await this.axiosInstance.get<DsvLabelResponse>(
        `/Generic/Label/v1/print/${request.bookingId}`,
        {
          params: {
            format,
          },
        }
      );

      console.info('[DSV API Service] Label retrieved successfully');
      console.info('[DSV API Service] Format:', response.data.format);
      console.info('[DSV API Service] MIME type:', response.data.mimeType);

      return response.data;
    } catch (error: any) {
      console.error('[DSV API Service] Failed to get label');
      this.logError('getLabel', error);
      throw this.normalizeError(error, 'Failed to get shipping label');
    }
  }

  /**
   * Get shipment list with filters
   * 
   * Endpoint: GET /Generic/Tracking/v2/shipments
   * Documentation: https://developer.dsv.com/guide-mydsv#WI1bf
   */
  async getShipmentList(filters: {
    startDate?: string;
    endDate?: string;
    transportMode?: string;
    status?: string;
  }): Promise<DsvTrackingResponse[]> {
    console.info('[DSV API Service] Getting shipment list');
    console.info('[DSV API Service] Filters:', filters);

    try {
      const response = await this.axiosInstance.get<DsvTrackingResponse[]>(
        '/Generic/Tracking/v2/shipments',
        {
          params: filters,
        }
      );

      console.info('[DSV API Service] Shipment list retrieved');
      console.info('[DSV API Service] Total shipments:', response.data.length);

      return response.data;
    } catch (error: any) {
      console.error('[DSV API Service] Failed to get shipment list');
      this.logError('getShipmentList', error);
      throw this.normalizeError(error, 'Failed to get shipment list');
    }
  }

  /**
   * Log detailed error information
   */
  private logError(method: string, error: any): void {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data as DsvErrorResponse | undefined;
      
      console.error(`[DSV API Service] ${method} error details:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        errorCode: errorData?.code,
        errorMessage: errorData?.message,
        errorDetails: errorData?.details,
        url: error.config?.url,
        method: error.config?.method,
      });
    } else {
      console.error(`[DSV API Service] ${method} error:`, error.message);
    }
  }

  /**
   * Normalize errors into a consistent format
   */
  private normalizeError(error: any, defaultMessage: string): Error {
    if (axios.isAxiosError(error)) {
      const errorData = error.response?.data as DsvErrorResponse | undefined;
      
      if (errorData?.message) {
        return new Error(`DSV API Error: ${errorData.message} (Code: ${errorData.code || 'unknown'})`);
      }
      
      if (error.response?.status) {
        return new Error(`DSV API Error: HTTP ${error.response.status} - ${error.response.statusText}`);
      }
    }

    return new Error(`${defaultMessage}: ${error.message || 'Unknown error'}`);
  }

  /**
   * Sanitize headers for logging
   */
  private sanitizeHeaders(headers: any): any {
    if (!headers) return headers;

    const sanitized = { ...headers };

    if (sanitized.Authorization) {
      sanitized.Authorization = 'Bearer ***';
    }

    if (sanitized['DSV-Subscription-Key']) {
      const key = sanitized['DSV-Subscription-Key'];
      sanitized['DSV-Subscription-Key'] = `${key.substring(0, 8)}...`;
    }

    return sanitized;
  }
}
