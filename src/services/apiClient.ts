/**
 * ============================================================================
 * CORE API CLIENT
 * HTEIM School of Ministry
 * ============================================================================
 * Central HTTP client communicating with the backend Express API (/api).
 * Enforces typed requests/responses, request validation, error normalization,
 * and unified timeout handling without mixing UI state or local storage.
 */

import { AppError, classifyError, ErrorType } from '../lib/errorHandler';
import { logger } from '../lib/logger';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  skipErrorLogging?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  statusCode: number;
}

export class ApiClientError extends AppError {
  public statusCode: number;
  public endpoint: string;

  constructor(message: string, statusCode = 500, endpoint = '', errorType: ErrorType = 'network', originalError?: any) {
    super({
      type: errorType,
      userMessage: message,
      developerMessage: `[API ${statusCode}] ${endpoint}: ${message}`,
      originalError,
      details: { statusCode, endpoint },
    });
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
  }
}

class ApiClient {
  private baseUrl = '/api';
  private defaultTimeoutMs = 25000;
  private authToken: string | null = null;
  private currentUserEmail: string | null = null;

  /**
   * Configure global auth headers for requests
   */
  public setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  public setUserEmail(email: string | null): void {
    this.currentUserEmail = email;
  }

  public getUserEmail(): string | null {
    return this.currentUserEmail;
  }

  /**
   * Builds full URL with normalized query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    if (!params) return url;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  /**
   * Normalizes HTTP errors into structured ApiClientError
   */
  private async parseErrorResponse(response: Response, endpoint: string): Promise<ApiClientError> {
    const status = response.status;
    let errorMessage = `Request to ${endpoint} failed with HTTP ${status}`;
    let errorDetails: any = null;

    try {
      const errorJson = await response.json();
      if (errorJson) {
        errorMessage = errorJson.error || errorJson.message || errorMessage;
        errorDetails = errorJson.details || errorJson;
      }
    } catch {
      try {
        const text = await response.text();
        if (text) errorMessage = text.slice(0, 300);
      } catch {
        // Fallback to default message
      }
    }

    let errorType: ErrorType = 'network';
    if (status === 401) errorType = 'authentication';
    else if (status === 403) errorType = 'unauthorized';
    else if (status === 400 || status === 422) errorType = 'validation';
    else if (status === 404) errorType = 'missing';
    else if (status >= 500) errorType = 'database';

    return new ApiClientError(errorMessage, status, endpoint, errorType, errorDetails);
  }

  /**
   * Standardized request method
   */
  public async request<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options.params);
    const timeout = options.timeoutMs || this.defaultTimeoutMs;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (body !== undefined && !(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    if (this.currentUserEmail && !headers['X-User-Email']) {
      headers['X-User-Email'] = this.currentUserEmail;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const parsedError = await this.parseErrorResponse(response, endpoint);
        if (!options.skipErrorLogging) {
          logger.warn(`[ApiClient] ${method} ${endpoint} failed (${parsedError.statusCode}): ${parsedError.message}`);
        }
        throw parsedError;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err instanceof ApiClientError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        const timeoutError = new ApiClientError(
          `Request to ${endpoint} timed out after ${timeout}ms`,
          408,
          endpoint,
          'timeout',
          err
        );
        logger.error(`[ApiClient] Timeout: ${method} ${endpoint}`);
        throw timeoutError;
      }

      const networkError = new ApiClientError(
        err.message || `Network error connecting to ${endpoint}`,
        0,
        endpoint,
        'network',
        err
      );
      logger.error(`[ApiClient] Network failure: ${method} ${endpoint}`, err);
      throw networkError;
    }
  }

  public get<T = any>(endpoint: string, params?: Record<string, any>, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'GET', undefined, { ...options, params });
  }

  public post<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'POST', body, options);
  }

  public put<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'PUT', body, options);
  }

  public patch<T = any>(endpoint: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'PATCH', body, options);
  }

  public delete<T = any>(endpoint: string, params?: Record<string, any>, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', undefined, { ...options, params });
  }
}

export const apiClient = new ApiClient();
