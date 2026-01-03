import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { DsvTokenRequest, DsvTokenResponse, DsvShippingPluginOptions } from '../types';

/**
 * DSV OAuth 2.0 Authentication Service
 * 
 * Handles authentication with DSV APIs using OAuth 2.0.
 * According to DSV documentation, all Generic APIs require:
 * - Bearer token in Authorization header
 * - DSV-Subscription-Key in header
 * 
 * Token Management:
 * - Automatically refreshes tokens before expiration
 * - Caches valid tokens to minimize API calls
 * - Handles token expiration with 5-minute buffer
 */
@Injectable()
export class DsvAuthService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private readonly axiosInstance: AxiosInstance;
  private readonly baseUrl: string;
  private readonly tokenBufferSeconds = 300; // Refresh 5 minutes before expiry

  constructor(private readonly options: DsvShippingPluginOptions) {
    console.info('[DSV Auth Service] Initializing authentication service');
    
    // Set base URL based on environment
    this.baseUrl = options.environment === 'production' 
      ? 'https://api.dsv.com' 
      : 'https://api-uat.dsv.com';

    console.info(`[DSV Auth Service] Environment: ${options.environment}`);
    console.info(`[DSV Auth Service] Base URL: ${this.baseUrl}`);

    // Create axios instance for token requests
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
    });

    // Add request interceptor for debugging
    if (options.debugMode) {
      this.axiosInstance.interceptors.request.use(
        (config) => {
          console.info('[DSV Auth Service] Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: this.sanitizeHeaders(config.headers),
          });
          return config;
        },
        (error) => {
          console.error('[DSV Auth Service] Request error:', error.message);
          return Promise.reject(error);
        }
      );
    }

    // Add response interceptor for debugging
    if (options.debugMode) {
      this.axiosInstance.interceptors.response.use(
        (response) => {
          console.info('[DSV Auth Service] Response:', {
            status: response.status,
            statusText: response.statusText,
            data: this.sanitizeResponseData(response.data),
          });
          return response;
        },
        (error) => {
          console.error('[DSV Auth Service] Response error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
          });
          return Promise.reject(error);
        }
      );
    }
  }

  /**
   * Get a valid access token
   * Automatically refreshes if token is expired or about to expire
   */
  async getAccessToken(): Promise<string> {
    console.info('[DSV Auth Service] Getting access token');

    // Check if we have a valid cached token
    if (this.isTokenValid()) {
      const remainingTime = this.tokenExpiresAt ? Math.floor((this.tokenExpiresAt - Date.now()) / 1000) : 0;
      console.info(`[DSV Auth Service] Using cached token (expires in ${remainingTime}s)`);
      return this.accessToken!;
    }

    console.info('[DSV Auth Service] Token expired or not available, requesting new token');
    
    // Request new token
    await this.refreshToken();
    
    if (!this.accessToken) {
      throw new Error('Failed to obtain access token');
    }

    return this.accessToken;
  }

  /**
   * Force refresh the access token
   */
  async refreshToken(): Promise<void> {
    console.info('[DSV Auth Service] Refreshing access token');
    console.info(`[DSV Auth Service] Client email: ${this.options.clientEmail}`);

    try {
      // Prepare token request according to OAuth 2.0 password grant
      const tokenRequest: DsvTokenRequest = {
        grant_type: 'password',
        username: this.options.clientEmail,
        password: this.options.clientPassword,
      };

      // Convert to URL-encoded format
      const urlEncodedData = new URLSearchParams({
        grant_type: tokenRequest.grant_type,
        username: tokenRequest.username,
        password: tokenRequest.password,
      }).toString();

      console.info('[DSV Auth Service] Sending token request to /oauth/v1/Token');

      // Request token from DSV OAuth endpoint
      const response = await this.axiosInstance.post<DsvTokenResponse>(
        '/oauth/v1/Token',
        urlEncodedData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      console.info('[DSV Auth Service] Token request successful');

      // Extract token data
      const tokenData = response.data;
      
      if (!tokenData.access_token) {
        console.error('[DSV Auth Service] No access_token in response:', tokenData);
        throw new Error('Invalid token response: missing access_token');
      }

      // Store token and calculate expiration time
      this.accessToken = tokenData.access_token;
      const expiresIn = tokenData.expires_in || 3600; // Default to 1 hour if not specified
      
      // Calculate expiration with buffer
      const expirationTime = Date.now() + (expiresIn - this.tokenBufferSeconds) * 1000;
      this.tokenExpiresAt = expirationTime;

      const expiresInMinutes = Math.floor(expiresIn / 60);
      console.info(`[DSV Auth Service] Token obtained successfully`);
      console.info(`[DSV Auth Service] Token type: ${tokenData.token_type}`);
      console.info(`[DSV Auth Service] Expires in: ${expiresInMinutes} minutes`);
      console.info(`[DSV Auth Service] Token will be refreshed ${this.tokenBufferSeconds / 60} minutes before expiry`);

    } catch (error: any) {
      console.error('[DSV Auth Service] Failed to obtain access token');
      
      if (axios.isAxiosError(error)) {
        console.error('[DSV Auth Service] HTTP Status:', error.response?.status);
        console.error('[DSV Auth Service] Response data:', error.response?.data);
        
        // Provide helpful error messages based on status code
        if (error.response?.status === 401) {
          console.error('[DSV Auth Service] Authentication failed - check credentials');
          console.error('[DSV Auth Service] Verify DSV_CLIENT_EMAIL and DSV_CLIENT_PASSWORD');
          throw new Error('DSV Authentication failed: Invalid credentials');
        } else if (error.response?.status === 403) {
          console.error('[DSV Auth Service] Access forbidden - check subscription status');
          throw new Error('DSV Authentication failed: Access forbidden');
        } else if (error.response?.status === 429) {
          console.error('[DSV Auth Service] Rate limit exceeded');
          throw new Error('DSV Authentication failed: Rate limit exceeded');
        }
      }

      console.error('[DSV Auth Service] Error details:', error.message);
      throw new Error(`DSV Authentication failed: ${error.message}`);
    }
  }

  /**
   * Check if current token is valid
   * Token is considered valid if it exists and hasn't expired (with buffer)
   */
  private isTokenValid(): boolean {
    if (!this.accessToken || !this.tokenExpiresAt) {
      console.info('[DSV Auth Service] No token cached');
      return false;
    }

    const now = Date.now();
    const isValid = now < this.tokenExpiresAt;
    
    if (!isValid) {
      const expiredSeconds = Math.floor((now - this.tokenExpiresAt) / 1000);
      console.info(`[DSV Auth Service] Token expired ${expiredSeconds}s ago`);
    }

    return isValid;
  }

  /**
   * Clear cached token (useful for testing or manual refresh)
   */
  clearToken(): void {
    console.info('[DSV Auth Service] Clearing cached token');
    this.accessToken = null;
    this.tokenExpiresAt = null;
  }

  /**
   * Get token info (for debugging)
   */
  getTokenInfo(): {
    hasToken: boolean;
    expiresAt: number | null;
    expiresInSeconds: number | null;
  } {
    const expiresInSeconds = this.tokenExpiresAt 
      ? Math.floor((this.tokenExpiresAt - Date.now()) / 1000)
      : null;

    return {
      hasToken: !!this.accessToken,
      expiresAt: this.tokenExpiresAt,
      expiresInSeconds,
    };
  }

  /**
   * Sanitize headers for logging (hide sensitive data)
   */
  private sanitizeHeaders(headers: any): any {
    if (!headers) return headers;

    const sanitized = { ...headers };
    
    if (sanitized.Authorization) {
      sanitized.Authorization = 'Bearer ***';
    }

    return sanitized;
  }

  /**
   * Sanitize response data for logging (hide sensitive tokens)
   */
  private sanitizeResponseData(data: any): any {
    if (!data) return data;

    const sanitized = { ...data };

    if (sanitized.access_token) {
      sanitized.access_token = `${sanitized.access_token.substring(0, 10)}...`;
    }

    if (sanitized.refresh_token) {
      sanitized.refresh_token = `${sanitized.refresh_token.substring(0, 10)}...`;
    }

    return sanitized;
  }
}
