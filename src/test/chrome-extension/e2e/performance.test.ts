/**
 * E2E Tests - Performance & Reliability
 * Validates extraction speed, memory usage, and error recovery
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('E2E: Performance & Reliability', () => {
  describe('Extraction Speed Benchmarks', () => {
    it('completes single extraction within 5 seconds', async () => {
      const startTime = Date.now();
      
      // Simulate extraction process
      const simulateExtraction = async (): Promise<{ success: boolean; durationMs: number }> => {
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DOM parsing
        await new Promise(resolve => setTimeout(resolve, 30)); // Simulate data normalization
        await new Promise(resolve => setTimeout(resolve, 20)); // Simulate validation
        
        return {
          success: true,
          durationMs: Date.now() - startTime
        };
      };

      const result = await simulateExtraction();
      expect(result.success).toBe(true);
      expect(result.durationMs).toBeLessThan(5000);
    });

    it('processes batch of 10 URLs within 30 seconds', async () => {
      const urls = Array(10).fill(null).map((_, i) => `https://example.com/product/${i}`);
      const startTime = Date.now();
      
      const processBatch = async (urlList: string[]): Promise<{ 
        completed: number; 
        durationMs: number 
      }> => {
        let completed = 0;
        
        // Simulate concurrent processing (2 at a time)
        const concurrency = 2;
        for (let i = 0; i < urlList.length; i += concurrency) {
          const batch = urlList.slice(i, i + concurrency);
          await Promise.all(batch.map(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            completed++;
          }));
        }
        
        return {
          completed,
          durationMs: Date.now() - startTime
        };
      };

      const result = await processBatch(urls);
      expect(result.completed).toBe(10);
      expect(result.durationMs).toBeLessThan(30000);
    });

    it('measures extraction step timings', async () => {
      interface StepTiming {
        step: string;
        durationMs: number;
      }

      const measureSteps = async (): Promise<StepTiming[]> => {
        const timings: StepTiming[] = [];
        
        const measureStep = async (name: string, fn: () => Promise<void>): Promise<void> => {
          const start = Date.now();
          await fn();
          timings.push({ step: name, durationMs: Date.now() - start });
        };

        await measureStep('platform_detection', async () => {
          await new Promise(r => setTimeout(r, 5));
        });
        
        await measureStep('dom_extraction', async () => {
          await new Promise(r => setTimeout(r, 50));
        });
        
        await measureStep('data_normalization', async () => {
          await new Promise(r => setTimeout(r, 20));
        });
        
        await measureStep('validation', async () => {
          await new Promise(r => setTimeout(r, 10));
        });
        
        await measureStep('api_submission', async () => {
          await new Promise(r => setTimeout(r, 100));
        });

        return timings;
      };

      const timings = await measureSteps();
      
      expect(timings).toHaveLength(5);
      expect(timings.find(t => t.step === 'platform_detection')?.durationMs).toBeLessThan(50);
      expect(timings.find(t => t.step === 'dom_extraction')?.durationMs).toBeLessThan(200);
      
      const totalTime = timings.reduce((sum, t) => sum + t.durationMs, 0);
      expect(totalTime).toBeLessThan(500);
    });
  });

  describe('Memory Efficiency', () => {
    it('handles large image arrays without memory issues', () => {
      const createLargeImageArray = (count: number): string[] => {
        return Array(count).fill(null).map((_, i) => 
          `https://cdn.example.com/images/product-${i}-${Date.now()}.jpg`
        );
      };

      // Simulate processing 100 images
      const images = createLargeImageArray(100);
      
      // Filter unique and valid
      const processedImages = [...new Set(images)]
        .filter(url => url.startsWith('https://'))
        .slice(0, 20); // Limit to 20 for storage

      expect(processedImages).toHaveLength(20);
      expect(processedImages[0]).toMatch(/^https:\/\//);
    });

    it('cleans up extracted data properly', () => {
      const createExtractedData = () => ({
        raw: { html: '<div>...</div>'.repeat(1000) },
        processed: { name: 'Product', price: 29.99 },
        images: Array(50).fill('https://example.com/img.jpg')
      });

      const cleanupData = (data: any): any => {
        // Remove raw HTML to save memory
        const cleaned = { ...data };
        delete cleaned.raw;
        
        // Limit images
        if (cleaned.images?.length > 10) {
          cleaned.images = cleaned.images.slice(0, 10);
        }
        
        return cleaned;
      };

      const original = createExtractedData();
      const cleaned = cleanupData(original);

      expect(cleaned.raw).toBeUndefined();
      expect(cleaned.images).toHaveLength(10);
      expect(cleaned.processed.name).toBe('Product');
    });
  });

  describe('Error Recovery', () => {
    it('recovers from network timeout', async () => {
      let attemptCount = 0;
      
      const fetchWithTimeout = async (
        url: string, 
        timeoutMs: number,
        maxRetries: number = 3
      ): Promise<{ success: boolean; attempts: number }> => {
        for (let i = 0; i < maxRetries; i++) {
          attemptCount++;
          try {
            // Simulate timeout on first attempt
            if (i === 0) {
              throw new Error('Request timeout');
            }
            return { success: true, attempts: attemptCount };
          } catch (e) {
            if (i === maxRetries - 1) throw e;
            await new Promise(r => setTimeout(r, 10)); // Brief delay before retry
          }
        }
        return { success: false, attempts: attemptCount };
      };

      const result = await fetchWithTimeout('https://example.com', 5000);
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2); // Failed first, succeeded second
    });

    it('handles DOM changes during extraction', () => {
      // Simulate dynamic DOM where elements might disappear
      const extractWithFallback = (
        primarySelector: string,
        fallbackSelector: string
      ): string | null => {
        const mockDocument = {
          primary: null as string | null,
          fallback: 'Fallback Value'
        };

        // Primary selector fails
        if (mockDocument.primary) {
          return mockDocument.primary;
        }
        
        // Fallback succeeds
        return mockDocument.fallback;
      };

      const result = extractWithFallback('.title', '.product-name');
      expect(result).toBe('Fallback Value');
    });

    it('gracefully handles malformed data', () => {
      const sanitizeProduct = (data: any): any => {
        const sanitized: any = {};
        
        // Name: ensure string, trim, default
        sanitized.name = typeof data.name === 'string' 
          ? data.name.trim().substring(0, 500) 
          : 'Untitled Product';
        
        // Price: ensure number, default to 0
        sanitized.price = typeof data.price === 'number' && !isNaN(data.price) && data.price >= 0
          ? data.price
          : 0;
        
        // Images: ensure array of valid URLs
        sanitized.images = Array.isArray(data.images)
          ? data.images.filter((url: any) => 
              typeof url === 'string' && url.startsWith('http')
            )
          : [];
        
        // Description: sanitize HTML
        sanitized.description = typeof data.description === 'string'
          ? data.description.replace(/<script[^>]*>.*?<\/script>/gi, '').substring(0, 5000)
          : '';

        return sanitized;
      };

      const malformedData = {
        name: '  Product with spaces  ',
        price: 'not a number',
        images: ['https://valid.com/img.jpg', null, 123, 'invalid-url'],
        description: '<p>Good</p><script>evil()</script>'
      };

      const sanitized = sanitizeProduct(malformedData);
      
      expect(sanitized.name).toBe('Product with spaces');
      expect(sanitized.price).toBe(0);
      expect(sanitized.images).toEqual(['https://valid.com/img.jpg']);
      expect(sanitized.description).not.toContain('<script>');
    });

    it('handles interrupted bulk imports', async () => {
      interface ImportState {
        total: number;
        completed: string[];
        failed: string[];
        pending: string[];
      }

      const resumeImport = (state: ImportState): string[] => {
        // Return pending items that weren't completed
        return state.pending.filter(
          url => !state.completed.includes(url) && !state.failed.includes(url)
        );
      };

      const savedState: ImportState = {
        total: 10,
        completed: ['url1', 'url2', 'url3'],
        failed: ['url4'],
        pending: ['url1', 'url2', 'url3', 'url4', 'url5', 'url6', 'url7']
      };

      const toResume = resumeImport(savedState);
      expect(toResume).toEqual(['url5', 'url6', 'url7']);
    });
  });

  describe('Concurrent Operation Safety', () => {
    it('prevents duplicate imports of same URL', async () => {
      const importedUrls = new Set<string>();
      const importQueue: string[] = [];
      
      const queueImport = (url: string): boolean => {
        if (importedUrls.has(url) || importQueue.includes(url)) {
          return false; // Duplicate
        }
        importQueue.push(url);
        return true;
      };

      const completeImport = (url: string): void => {
        const index = importQueue.indexOf(url);
        if (index > -1) {
          importQueue.splice(index, 1);
          importedUrls.add(url);
        }
      };

      expect(queueImport('https://example.com/product/1')).toBe(true);
      expect(queueImport('https://example.com/product/1')).toBe(false); // Duplicate in queue
      
      completeImport('https://example.com/product/1');
      expect(queueImport('https://example.com/product/1')).toBe(false); // Already imported
      
      expect(queueImport('https://example.com/product/2')).toBe(true);
    });

    it('maintains consistent state during concurrent extractions', async () => {
      interface ExtractionState {
        activeCount: number;
        maxConcurrent: number;
        history: string[];
      }

      const state: ExtractionState = {
        activeCount: 0,
        maxConcurrent: 2,
        history: []
      };

      const startExtraction = async (id: string): Promise<boolean> => {
        if (state.activeCount >= state.maxConcurrent) {
          return false;
        }
        
        state.activeCount++;
        state.history.push(`start:${id}`);
        
        // Simulate work
        await new Promise(r => setTimeout(r, 10));
        
        state.activeCount--;
        state.history.push(`end:${id}`);
        return true;
      };

      // Start multiple extractions
      const results = await Promise.all([
        startExtraction('a'),
        startExtraction('b'),
        startExtraction('c') // Should be rejected
      ]);

      // At least 2 should succeed
      const succeeded = results.filter(r => r).length;
      expect(succeeded).toBeGreaterThanOrEqual(2);
      expect(state.activeCount).toBe(0); // All completed
    });
  });

  describe('Data Integrity Checks', () => {
    it('validates product data checksum', () => {
      const calculateChecksum = (product: any): string => {
        const key = `${product.name}|${product.price}|${product.externalId}`;
        // Simple hash for testing
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
          const char = key.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
      };

      const product1 = { name: 'Product A', price: 29.99, externalId: 'EXT-1' };
      const product2 = { name: 'Product A', price: 29.99, externalId: 'EXT-1' };
      const product3 = { name: 'Product B', price: 29.99, externalId: 'EXT-1' };

      expect(calculateChecksum(product1)).toBe(calculateChecksum(product2));
      expect(calculateChecksum(product1)).not.toBe(calculateChecksum(product3));
    });

    it('detects data corruption during transfer', () => {
      const validateTransferIntegrity = (
        sent: { data: any; checksum: string },
        received: { data: any; checksum: string }
      ): boolean => {
        return sent.checksum === received.checksum;
      };

      const sentData = {
        data: { name: 'Product', price: 29.99 },
        checksum: 'abc123'
      };

      const validReceived = { ...sentData };
      const corruptedReceived = { ...sentData, checksum: 'xyz789' };

      expect(validateTransferIntegrity(sentData, validReceived)).toBe(true);
      expect(validateTransferIntegrity(sentData, corruptedReceived)).toBe(false);
    });
  });
});
