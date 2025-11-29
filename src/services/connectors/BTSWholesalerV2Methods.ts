// BTSWholesaler API v2.0 Methods
// Documentation: https://api.btswholesaler.com/docs

export interface BTSFeedStatus {
  status: 'use_pagination' | 'available' | 'stale' | 'not_available';
  message: string;
  recommended_page_size: number;
  cached_file_exists: boolean;
  cached_file_age_minutes: number | null;
}

export interface BTSProductChange {
  id: number;
  ean: number;
  name: string;
  price: number;
  stock: number;
  last_modified: string;
}

export interface BTSProductStock {
  sku: string;
  stock: number;
  price: number;
  availability: 'in_stock' | 'out_of_stock' | 'not_found';
}

export interface BTSPaginatedResponse<T> {
  products: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    page_size: number;
    total_items: number;
    has_next_page: boolean;
    has_previous_page: boolean;
  };
}

export class BTSWholesalerV2 {
  private baseUrl = 'https://api.btswholesaler.com';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json'
    };
  }

  /**
   * Check feed status (v2.0 new endpoint)
   */
  async getFeedStatus(languageCode: string = 'fr-FR'): Promise<BTSFeedStatus> {
    const response = await fetch(
      `${this.baseUrl}/v1/api/getFeedStatus?language_code=${languageCode}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to get feed status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get products changed since a specific date (delta sync)
   * Max 30 days back
   */
  async getProductChanges(
    since: string, // Format: Y-m-d
    page: number = 1,
    pageSize: number = 200,
    languageCode: string = 'fr-FR'
  ): Promise<BTSPaginatedResponse<BTSProductChange>> {
    const params = new URLSearchParams({
      since,
      page: page.toString(),
      page_size: pageSize.toString(),
      language_code: languageCode
    });

    const response = await fetch(
      `${this.baseUrl}/v1/api/getProductChanges?${params}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to get product changes: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get real-time stock for specific SKUs (max 100)
   */
  async getProductStock(skus: string[]): Promise<BTSProductStock[]> {
    if (skus.length > 100) {
      throw new Error('Maximum 100 SKUs per request');
    }

    const params = new URLSearchParams();
    skus.forEach(sku => params.append('product_sku[]', sku));

    const response = await fetch(
      `${this.baseUrl}/v1/api/getProductStock?${params}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to get product stock: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get newly added products
   */
  async getNewProducts(
    days: number = 7,
    page: number = 1,
    pageSize: number = 200,
    languageCode: string = 'fr-FR'
  ): Promise<BTSPaginatedResponse<any>> {
    if (days < 1 || days > 30) {
      throw new Error('Days parameter must be between 1 and 30');
    }

    const params = new URLSearchParams({
      days: days.toString(),
      page: page.toString(),
      page_size: pageSize.toString(),
      language_code: languageCode
    });

    const response = await fetch(
      `${this.baseUrl}/v1/api/getNewProducts?${params}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to get new products: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get full product catalog with pagination (v2.0 required)
   */
  async getListProducts(
    page: number = 1,
    pageSize: number = 200,
    languageCode: string = 'fr-FR'
  ): Promise<BTSPaginatedResponse<any>> {
    if (pageSize < 50 || pageSize > 500) {
      throw new Error('Page size must be between 50 and 500');
    }

    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      format_file: 'json',
      language_code: languageCode
    });

    const response = await fetch(
      `${this.baseUrl}/v1/api/getListProducts?${params}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to get products: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Fetch all products with automatic pagination
   */
  async fetchAllProducts(
    pageSize: number = 500,
    languageCode: string = 'fr-FR',
    onProgress?: (current: number, total: number) => void
  ): Promise<any[]> {
    const allProducts: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.getListProducts(page, pageSize, languageCode);
      allProducts.push(...response.products);

      if (onProgress) {
        onProgress(response.pagination.current_page, response.pagination.total_pages);
      }

      hasMore = response.pagination.has_next_page;
      page++;

      // Respect rate limits
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return allProducts;
  }
}
