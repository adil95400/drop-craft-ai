import { supabase } from '@/integrations/supabase/client';
import { SupplierProduct } from '@/types/suppliers';

interface DuplicationMatch {
  product1: SupplierProduct;
  product2: SupplierProduct;
  similarity: number;
  type: 'exact' | 'fuzzy' | 'variant';
  reasons: string[];
}

export class DeduplicationService {
  private static instance: DeduplicationService;

  static getInstance(): DeduplicationService {
    if (!DeduplicationService.instance) {
      DeduplicationService.instance = new DeduplicationService();
    }
    return DeduplicationService.instance;
  }

  // Advanced deduplication with fuzzy matching
  async deduplicateProducts(products: SupplierProduct[]): Promise<{
    duplicates: DuplicationMatch[];
    unique: SupplierProduct[];
    merged: SupplierProduct[];
  }> {
    const duplicates: DuplicationMatch[] = [];
    const unique: SupplierProduct[] = [];
    const processed = new Set<string>();

    // Group products for comparison
    for (let i = 0; i < products.length; i++) {
      if (processed.has(products[i].id)) continue;

      const currentProduct = products[i];
      const matches: DuplicationMatch[] = [];

      // Find potential duplicates
      for (let j = i + 1; j < products.length; j++) {
        if (processed.has(products[j].id)) continue;

        const compareProduct = products[j];
        const match = this.compareProducts(currentProduct, compareProduct);

        if (match.similarity >= 0.7) { // 70% similarity threshold
          matches.push(match);
          processed.add(compareProduct.id);
        }
      }

      if (matches.length > 0) {
        duplicates.push(...matches);
        processed.add(currentProduct.id);
      } else {
        unique.push(currentProduct);
      }
    }

    // Merge duplicates
    const merged = await this.mergeProducts(duplicates);

    return { duplicates, unique, merged };
  }

  private compareProducts(product1: SupplierProduct, product2: SupplierProduct): DuplicationMatch {
    let similarity = 0;
    const reasons: string[] = [];

    // Exact SKU match (highest priority)
    if (product1.sku === product2.sku && product1.sku) {
      similarity = 1.0;
      reasons.push('Exact SKU match');
      return {
        product1,
        product2,
        similarity,
        type: 'exact',
        reasons
      };
    }

    // Title similarity using Levenshtein distance
    const titleSimilarity = this.calculateTextSimilarity(
      this.normalizeText(product1.title),
      this.normalizeText(product2.title)
    );
    similarity += titleSimilarity * 0.4;

    if (titleSimilarity > 0.8) {
      reasons.push('High title similarity');
    }

    // Brand match
    if (product1.brand && product2.brand) {
      const brandSimilarity = this.calculateTextSimilarity(
        this.normalizeText(product1.brand),
        this.normalizeText(product2.brand)
      );
      similarity += brandSimilarity * 0.2;

      if (brandSimilarity > 0.9) {
        reasons.push('Same brand');
      }
    }

    // Price similarity (within 10% range)
    const priceDiff = Math.abs(product1.price - product2.price);
    const avgPrice = (product1.price + product2.price) / 2;
    const priceVariance = avgPrice > 0 ? priceDiff / avgPrice : 0;
    
    if (priceVariance < 0.1) {
      similarity += 0.2;
      reasons.push('Similar pricing');
    }

    // Category match
    if (product1.category && product2.category) {
      const categorySimilarity = this.calculateTextSimilarity(
        this.normalizeText(product1.category),
        this.normalizeText(product2.category)
      );
      similarity += categorySimilarity * 0.1;

      if (categorySimilarity > 0.8) {
        reasons.push('Same category');
      }
    }

    // Image similarity (basic URL comparison)
    if (product1.images.length > 0 && product2.images.length > 0) {
      const imageMatch = product1.images.some(img1 => 
        product2.images.some(img2 => this.compareImageUrls(img1, img2))
      );
      
      if (imageMatch) {
        similarity += 0.1;
        reasons.push('Shared images');
      }
    }

    const type: 'exact' | 'fuzzy' | 'variant' = 
      similarity === 1.0 ? 'exact' : 
      similarity > 0.8 ? 'variant' : 'fuzzy';

    return {
      product1,
      product2,
      similarity: Math.min(similarity, 1.0),
      type,
      reasons
    };
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    if (text1 === text2) return 1;

    const distance = this.levenshteinDistance(text1, text2);
    const maxLength = Math.max(text1.length, text2.length);
    
    return maxLength > 0 ? 1 - (distance / maxLength) : 0;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private normalizeText(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }

  private compareImageUrls(url1: string, url2: string): boolean {
    // Basic image URL comparison - could be enhanced with image hashing
    const normalize = (url: string) => {
      // Remove query parameters and protocol
      return url.replace(/\?.*$/, '').replace(/^https?:\/\//, '');
    };

    return normalize(url1) === normalize(url2);
  }

  private async mergeProducts(duplicates: DuplicationMatch[]): Promise<SupplierProduct[]> {
    const merged: SupplierProduct[] = [];
    const processedGroups = new Set<string>();

    for (const duplicate of duplicates) {
      const groupKey = `${duplicate.product1.id}-${duplicate.product2.id}`;
      if (processedGroups.has(groupKey)) continue;

      const mergedProduct = this.mergeTwoProducts(duplicate.product1, duplicate.product2);
      merged.push(mergedProduct);
      processedGroups.add(groupKey);
    }

    return merged;
  }

  private mergeTwoProducts(product1: SupplierProduct, product2: SupplierProduct): SupplierProduct {
    // Merge strategy: prefer product with more complete data
    const score1 = this.calculateCompletenessScore(product1);
    const score2 = this.calculateCompletenessScore(product2);
    
    const primary = score1 >= score2 ? product1 : product2;
    const secondary = score1 >= score2 ? product2 : product1;

    return {
      id: primary.id,
      sku: primary.sku || secondary.sku,
      title: primary.title || secondary.title,
      description: this.mergeDescriptions(primary.description, secondary.description),
      price: Math.min(primary.price, secondary.price), // Use lower price
      costPrice: primary.costPrice || secondary.costPrice,
      currency: primary.currency,
      stock: Math.max(primary.stock, secondary.stock), // Use higher stock
      images: this.mergeArrays(primary.images, secondary.images),
      category: primary.category || secondary.category,
      brand: primary.brand || secondary.brand,
      weight: primary.weight || secondary.weight,
      dimensions: primary.dimensions || secondary.dimensions,
      variants: this.mergeArrays(primary.variants || [], secondary.variants || []),
      attributes: { ...secondary.attributes, ...primary.attributes },
      supplier: primary.supplier,
    };
  }

  private calculateCompletenessScore(product: SupplierProduct): number {
    let score = 0;
    
    // Basic fields
    if (product.title) score += 1;
    if (product.description) score += 1;
    if (product.sku) score += 1;
    if (product.brand) score += 1;
    if (product.category) score += 1;
    
    // Optional fields
    if (product.weight) score += 0.5;
    if (product.dimensions) score += 0.5;
    if (product.costPrice) score += 0.5;
    if (product.images.length > 0) score += 1;
    if (product.variants && product.variants.length > 0) score += 0.5;
    
    return score;
  }

  private mergeDescriptions(desc1?: string, desc2?: string): string {
    if (!desc1) return desc2 || '';
    if (!desc2) return desc1;
    
    // If descriptions are very similar, use the longer one
    if (this.calculateTextSimilarity(desc1, desc2) > 0.8) {
      return desc1.length > desc2.length ? desc1 : desc2;
    }
    
    // Otherwise combine them
    return `${desc1}\n\n${desc2}`;
  }

  private mergeArrays<T>(arr1: T[], arr2: T[]): T[] {
    return [...new Set([...arr1, ...arr2])];
  }

  // Store deduplication results
  async storeDeduplicationResults(results: {
    duplicates: DuplicationMatch[];
    unique: SupplierProduct[];
    merged: SupplierProduct[];
  }): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Store in deduplication_jobs table for tracking
    await supabase.from('ai_optimization_jobs').insert({
      user_id: user.user.id,
      job_type: 'product_deduplication',
      status: 'completed',
      input_data: {
        total_products: results.duplicates.length + results.unique.length,
        duplicates_found: results.duplicates.length
      },
      output_data: {
        unique_products: results.unique.length,
        merged_products: results.merged.length,
        deduplication_rate: results.duplicates.length / (results.duplicates.length + results.unique.length)
      },
      progress: 100
    });
  }
}

export const deduplicationService = DeduplicationService.getInstance();
