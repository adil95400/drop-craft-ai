import { supabase } from '@/integrations/supabase/client';

export type ApiResponse<T = any> = {
  data: T;
  error: null;
} | {
  data: null;
  error: string;
};

class ApiClient {
  private baseURL = '/api';
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('API request failed:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Supabase-specific methods
  async supabaseFunction<T>(
    functionName: string, 
    payload?: any
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error(`Supabase function ${functionName} failed:`, error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Supabase function error' 
      };
    }
  }

  async supabaseQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>
  ): Promise<ApiResponse<T>> {
    try {
      const { data, error } = await queryFn();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Supabase query failed:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Database query error' 
      };
    }
  }
}

export const apiClient = new ApiClient();

// Convenience exports
export const { get, post, put, delete: del, supabaseFunction, supabaseQuery } = apiClient;

// Helper for typed Supabase queries
export const createSupabaseQuery = <T>(queryFn: () => Promise<{ data: T | null; error: any }>) => 
  () => apiClient.supabaseQuery(queryFn);