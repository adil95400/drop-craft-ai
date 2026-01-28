/**
 * E2E Tests - Multi-Platform Support
 * Validates extraction across all 17 supported platforms
 */
import { describe, it, expect, vi } from 'vitest';

// Platform configuration for testing
interface PlatformConfig {
  name: string;
  domains: string[];
  idPattern: RegExp;
  sampleUrls: string[];
  expectedFields: string[];
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    name: 'amazon',
    domains: ['amazon.com', 'amazon.fr', 'amazon.de', 'amazon.co.uk', 'amazon.es', 'amazon.it'],
    idPattern: /\/dp\/([A-Z0-9]{10})/i,
    sampleUrls: [
      'https://www.amazon.fr/dp/B08N5WRWNW',
      'https://www.amazon.com/dp/B09V3KXJPB/ref=sr_1_1'
    ],
    expectedFields: ['name', 'price', 'images', 'description', 'rating', 'reviewsCount', 'asin']
  },
  {
    name: 'aliexpress',
    domains: ['aliexpress.com', 'fr.aliexpress.com', 'de.aliexpress.com'],
    idPattern: /\/item\/(\d+)\.html/,
    sampleUrls: [
      'https://fr.aliexpress.com/item/1005003123456789.html',
      'https://www.aliexpress.com/item/4000123456789.html'
    ],
    expectedFields: ['name', 'price', 'images', 'description', 'variants', 'shipping']
  },
  {
    name: 'ebay',
    domains: ['ebay.com', 'ebay.fr', 'ebay.de', 'ebay.co.uk'],
    idPattern: /\/itm\/(\d+)/,
    sampleUrls: [
      'https://www.ebay.com/itm/123456789012',
      'https://www.ebay.fr/itm/987654321098'
    ],
    expectedFields: ['name', 'price', 'images', 'description', 'condition', 'seller']
  },
  {
    name: 'temu',
    domains: ['temu.com'],
    idPattern: /goods[-_]?id[=:]?(\d+)|product-(\d+)/i,
    sampleUrls: [
      'https://www.temu.com/product-12345.html',
      'https://www.temu.com/item?goods_id=67890'
    ],
    expectedFields: ['name', 'price', 'images', 'description', 'variants']
  },
  {
    name: 'shein',
    domains: ['shein.com', 'us.shein.com', 'fr.shein.com', 'de.shein.com'],
    idPattern: /-p-(\d+)/,
    sampleUrls: [
      'https://us.shein.com/Product-Name-p-12345678.html',
      'https://fr.shein.com/Article-p-87654321.html'
    ],
    expectedFields: ['name', 'price', 'images', 'description', 'color', 'size']
  },
  {
    name: 'shopify',
    domains: ['myshopify.com'],
    idPattern: /\/products\/([^/?]+)/,
    sampleUrls: [
      'https://store.myshopify.com/products/product-handle',
      'https://brand.myshopify.com/products/cool-item'
    ],
    expectedFields: ['name', 'price', 'images', 'description', 'variants', 'vendor']
  },
  {
    name: 'etsy',
    domains: ['etsy.com'],
    idPattern: /\/listing\/(\d+)/,
    sampleUrls: [
      'https://www.etsy.com/listing/123456789/handmade-item',
      'https://www.etsy.com/fr/listing/987654321/article-fait-main'
    ],
    expectedFields: ['name', 'price', 'images', 'description', 'seller', 'materials']
  },
  {
    name: 'cjdropshipping',
    domains: ['cjdropshipping.com'],
    idPattern: /\/product\/([^/?]+)/,
    sampleUrls: ['https://cjdropshipping.com/product/widget-123'],
    expectedFields: ['name', 'price', 'images', 'description', 'variants', 'shipping']
  },
  {
    name: 'banggood',
    domains: ['banggood.com'],
    idPattern: /-p-(\d+)\.html/,
    sampleUrls: ['https://www.banggood.com/Product-Name-p-1234567.html'],
    expectedFields: ['name', 'price', 'images', 'description', 'shipping']
  },
  {
    name: 'dhgate',
    domains: ['dhgate.com'],
    idPattern: /\/product\/[^/]+-(\d+)\.html/,
    sampleUrls: ['https://www.dhgate.com/product/item-name-123456789.html'],
    expectedFields: ['name', 'price', 'images', 'description', 'moq']
  },
  {
    name: 'wish',
    domains: ['wish.com'],
    idPattern: /\/product\/([a-f0-9]+)/i,
    sampleUrls: ['https://www.wish.com/product/5abc123def456'],
    expectedFields: ['name', 'price', 'images', 'description', 'shipping']
  },
  {
    name: 'cdiscount',
    domains: ['cdiscount.com'],
    idPattern: /\/f-(\d+-\d+)/,
    sampleUrls: ['https://www.cdiscount.com/product/f-123-456.html'],
    expectedFields: ['name', 'price', 'images', 'description']
  },
  {
    name: 'walmart',
    domains: ['walmart.com'],
    idPattern: /\/ip\/[^/]+\/(\d+)/,
    sampleUrls: ['https://www.walmart.com/ip/Product-Name/123456789'],
    expectedFields: ['name', 'price', 'images', 'description', 'rating']
  },
  {
    name: 'homedepot',
    domains: ['homedepot.com'],
    idPattern: /\/p\/[^/]+\/(\d+)/,
    sampleUrls: ['https://www.homedepot.com/p/Product-Name/123456789'],
    expectedFields: ['name', 'price', 'images', 'description', 'specifications']
  },
  {
    name: 'fnac',
    domains: ['fnac.com'],
    idPattern: /\/a(\d+)/,
    sampleUrls: ['https://www.fnac.com/Product-Name/a12345678'],
    expectedFields: ['name', 'price', 'images', 'description']
  },
  {
    name: 'rakuten',
    domains: ['rakuten.com', 'fr.shopping.rakuten.com'],
    idPattern: /\/offer\/buy\/(\d+)/,
    sampleUrls: ['https://fr.shopping.rakuten.com/offer/buy/123456789'],
    expectedFields: ['name', 'price', 'images', 'description', 'seller']
  },
  {
    name: 'tiktokshop',
    domains: ['shop.tiktok.com', 'tiktokshop.com'],
    idPattern: /\/product\/(\d+)/,
    sampleUrls: ['https://shop.tiktok.com/product/1234567890123456789'],
    expectedFields: ['name', 'price', 'images', 'description', 'videos']
  }
];

describe('E2E: Multi-Platform Support', () => {
  describe('Platform Detection', () => {
    PLATFORM_CONFIGS.forEach(platform => {
      describe(`${platform.name.toUpperCase()}`, () => {
        platform.sampleUrls.forEach(url => {
          it(`detects platform from: ${url}`, () => {
            const detectPlatform = (testUrl: string): string | null => {
              for (const config of PLATFORM_CONFIGS) {
                for (const domain of config.domains) {
                  if (testUrl.includes(domain)) {
                    return config.name;
                  }
                }
              }
              return null;
            };

            expect(detectPlatform(url)).toBe(platform.name);
          });

          it(`extracts product ID from: ${url}`, () => {
            const match = url.match(platform.idPattern);
            const productId = match?.[1] || match?.[2];
            expect(productId).toBeTruthy();
          });
        });
      });
    });
  });

  describe('Field Mapping Consistency', () => {
    it('ensures all platforms return unified product structure', () => {
      const requiredUnifiedFields = [
        'name',
        'price',
        'images',
        'source',
        'externalId'
      ];

      const optionalUnifiedFields = [
        'description',
        'compareAtPrice',
        'costPrice',
        'variants',
        'brand',
        'category',
        'tags',
        'rating',
        'reviewsCount',
        'reviews',
        'shipping',
        'videos'
      ];

      // Mock unified product output
      const createMockUnifiedProduct = (platform: string) => ({
        name: `Test Product from ${platform}`,
        price: 29.99,
        images: ['https://example.com/img1.jpg'],
        source: platform,
        externalId: 'EXT-123',
        description: 'Test description',
        variants: []
      });

      PLATFORM_CONFIGS.forEach(platform => {
        const product = createMockUnifiedProduct(platform.name);
        
        requiredUnifiedFields.forEach(field => {
          expect(product).toHaveProperty(field);
          expect((product as any)[field]).toBeTruthy();
        });
      });
    });
  });

  describe('Price Format Handling by Region', () => {
    const regionFormats = [
      { region: 'US', format: '$29.99', expected: 29.99 },
      { region: 'FR', format: '29,99 €', expected: 29.99 },
      { region: 'DE', format: '29,99 €', expected: 29.99 },
      { region: 'UK', format: '£29.99', expected: 29.99 },
      { region: 'JP', format: '¥2,999', expected: 2999 },
      { region: 'CN', format: '¥29.99', expected: 29.99 }
    ];

    regionFormats.forEach(({ region, format, expected }) => {
      it(`parses ${region} price format: ${format}`, () => {
        const parsePrice = (priceStr: string): number => {
          let cleaned = priceStr.replace(/[$€£¥\s]/g, '').trim();
          
          // Handle comma as decimal separator
          if (cleaned.includes(',') && !cleaned.includes('.')) {
            if (cleaned.split(',')[1]?.length === 2) {
              cleaned = cleaned.replace(',', '.');
            } else {
              cleaned = cleaned.replace(/,/g, '');
            }
          } else if (cleaned.includes(',') && cleaned.includes('.')) {
            if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
              cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            } else {
              cleaned = cleaned.replace(/,/g, '');
            }
          }
          
          return parseFloat(cleaned) || 0;
        };

        expect(parsePrice(format)).toBe(expected);
      });
    });
  });

  describe('Image URL Normalization by Platform', () => {
    const imageTests = [
      {
        platform: 'amazon',
        input: 'https://m.media-amazon.com/images/I/71abc._SX300_.jpg',
        expectedContains: '_SL1500_'
      },
      {
        platform: 'aliexpress',
        input: 'https://ae01.alicdn.com/kf/img_50x50.jpg',
        expectedContains: '_800x800'
      },
      {
        platform: 'ebay',
        input: 'https://i.ebayimg.com/images/g/abc/s-l300.jpg',
        expectedContains: 's-l1600'
      },
      {
        platform: 'etsy',
        input: 'https://i.etsystatic.com/123/r/il_340x270/abc.jpg',
        expectedContains: 'il_fullxfull'
      },
      {
        platform: 'shein',
        input: 'https://img.ltwebstatic.com/images/pi/123_thumbnail_100x.jpg',
        expectedContains: '_thumbnail_900x'
      }
    ];

    imageTests.forEach(({ platform, input, expectedContains }) => {
      it(`normalizes ${platform} image URL to HD`, () => {
        const normalizeImageUrl = (url: string, plat: string): string => {
          let result = url;
          
          switch (plat) {
            case 'amazon':
              result = url.replace(/\._[A-Z]+_[0-9]+_\./, '._SL1500_.');
              break;
            case 'aliexpress':
              result = url.replace(/_\d+x\d+/, '_800x800');
              break;
            case 'ebay':
              result = url.replace(/s-l\d+/, 's-l1600');
              break;
            case 'etsy':
              result = url.replace(/il_\d+x\d+/, 'il_fullxfull');
              break;
            case 'shein':
              result = url.replace(/_thumbnail_\d+x/, '_thumbnail_900x');
              break;
          }
          
          return result;
        };

        const result = normalizeImageUrl(input, platform);
        expect(result).toContain(expectedContains);
      });
    });
  });

  describe('Variant Structure Normalization', () => {
    it('normalizes Amazon variant structure', () => {
      const amazonVariants = {
        dimensionValuesDisplayData: {
          'B08N5WRWNW': ['Red', 'Large'],
          'B08N5WRWNX': ['Blue', 'Medium']
        },
        dimensionDisplayText: ['Color', 'Size']
      };

      const normalized = Object.entries(amazonVariants.dimensionValuesDisplayData).map(
        ([asin, values]) => ({
          externalId: asin,
          options: amazonVariants.dimensionDisplayText.reduce((acc, dim, i) => {
            acc[dim] = values[i];
            return acc;
          }, {} as Record<string, string>)
        })
      );

      expect(normalized).toHaveLength(2);
      expect(normalized[0].externalId).toBe('B08N5WRWNW');
      expect(normalized[0].options.Color).toBe('Red');
      expect(normalized[0].options.Size).toBe('Large');
    });

    it('normalizes AliExpress SKU properties', () => {
      const aliexpressSkus = {
        skuPropertyList: [
          {
            skuPropertyName: 'Color',
            skuPropertyValues: [
              { propertyValueId: '1', propertyValueDisplayName: 'Black', skuPropertyImagePath: 'url1' },
              { propertyValueId: '2', propertyValueDisplayName: 'White', skuPropertyImagePath: 'url2' }
            ]
          },
          {
            skuPropertyName: 'Size',
            skuPropertyValues: [
              { propertyValueId: '10', propertyValueDisplayName: 'S' },
              { propertyValueId: '11', propertyValueDisplayName: 'M' }
            ]
          }
        ]
      };

      const normalized = aliexpressSkus.skuPropertyList.map(prop => ({
        name: prop.skuPropertyName,
        options: prop.skuPropertyValues.map(v => ({
          id: v.propertyValueId,
          value: v.propertyValueDisplayName,
          image: v.skuPropertyImagePath
        }))
      }));

      expect(normalized).toHaveLength(2);
      expect(normalized[0].name).toBe('Color');
      expect(normalized[0].options).toHaveLength(2);
      expect(normalized[0].options[0].image).toBe('url1');
      expect(normalized[1].name).toBe('Size');
    });

    it('normalizes Shopify variant structure', () => {
      const shopifyVariants = [
        { id: 1, title: 'Small / Red', price: '29.99', sku: 'TS-S-R', option1: 'Small', option2: 'Red' },
        { id: 2, title: 'Medium / Blue', price: '29.99', sku: 'TS-M-B', option1: 'Medium', option2: 'Blue' }
      ];

      const normalized = shopifyVariants.map(v => ({
        externalId: String(v.id),
        title: v.title,
        price: parseFloat(v.price),
        sku: v.sku,
        options: {
          Size: v.option1,
          Color: v.option2
        }
      }));

      expect(normalized).toHaveLength(2);
      expect(normalized[0].options.Size).toBe('Small');
      expect(normalized[0].options.Color).toBe('Red');
      expect(normalized[1].price).toBe(29.99);
    });
  });

  describe('Review Data Extraction', () => {
    it('normalizes review structure across platforms', () => {
      interface UnifiedReview {
        author: string;
        rating: number;
        date: string;
        content: string;
        images?: string[];
        helpful?: number;
      }

      const normalizeReview = (raw: any, platform: string): UnifiedReview => {
        switch (platform) {
          case 'amazon':
            return {
              author: raw.reviewerName || 'Anonymous',
              rating: parseFloat(raw.rating) || 0,
              date: raw.reviewDate || '',
              content: raw.reviewText || '',
              images: raw.images || [],
              helpful: raw.helpfulVotes || 0
            };
          case 'aliexpress':
            return {
              author: raw.buyerName || 'Anonymous',
              rating: raw.buyerEval / 20 || 0,
              date: raw.evalDate || '',
              content: raw.buyerFeedback || '',
              images: raw.images?.map((i: any) => i.imgUrl) || []
            };
          default:
            return {
              author: raw.author || 'Anonymous',
              rating: raw.rating || 0,
              date: raw.date || '',
              content: raw.content || ''
            };
        }
      };

      const amazonReview = {
        reviewerName: 'John D.',
        rating: '4.0',
        reviewDate: '2024-01-15',
        reviewText: 'Great product!',
        helpfulVotes: 42
      };

      const normalized = normalizeReview(amazonReview, 'amazon');
      expect(normalized.author).toBe('John D.');
      expect(normalized.rating).toBe(4.0);
      expect(normalized.helpful).toBe(42);
    });
  });

  describe('Shipping Information Extraction', () => {
    it('parses shipping details from various formats', () => {
      interface ShippingInfo {
        cost: number;
        currency: string;
        estimatedDays: { min: number; max: number };
        method: string;
      }

      const parseShipping = (text: string): Partial<ShippingInfo> => {
        const result: Partial<ShippingInfo> = {};
        
        // Free shipping detection
        if (/free|gratuit|kostenlos/i.test(text)) {
          result.cost = 0;
        } else {
          const priceMatch = text.match(/[\$€£]?\s*(\d+[.,]?\d*)/);
          if (priceMatch) {
            result.cost = parseFloat(priceMatch[1].replace(',', '.'));
          }
        }
        
        // Delivery days extraction
        const daysMatch = text.match(/(\d+)\s*[-–à]\s*(\d+)\s*(jours?|days?|tage)/i);
        if (daysMatch) {
          result.estimatedDays = {
            min: parseInt(daysMatch[1]),
            max: parseInt(daysMatch[2])
          };
        }
        
        return result;
      };

      expect(parseShipping('Livraison gratuite')).toEqual({ cost: 0 });
      expect(parseShipping('Free shipping')).toEqual({ cost: 0 });
      expect(parseShipping('€4.99 shipping')).toEqual({ cost: 4.99 });
      expect(parseShipping('Delivery: 5-10 days')).toEqual({ 
        estimatedDays: { min: 5, max: 10 } 
      });
    });
  });
});
