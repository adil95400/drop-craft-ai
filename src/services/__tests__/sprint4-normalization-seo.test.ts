import { describe, it, expect } from 'vitest';
import { NormalizationEngine } from '@/services/NormalizationEngine';
import { scoreSeo, scoreBatch } from '@/services/seo/SeoScoringEngine';

// ════════════════════════════════════════════════════════════════════════
// NormalizationEngine v2 Tests
// ════════════════════════════════════════════════════════════════════════

describe('NormalizationEngine v2', () => {
  const engine = new NormalizationEngine('import');

  describe('normalize()', () => {
    it('normalizes a complete product correctly', () => {
      const result = engine.normalize({
        title: 'Chaussures Running Pro',
        description: '<p>Confort et performance pour les coureurs.</p>',
        price: 89.99,
        category: 'Chaussures',
        images: ['https://img.test/shoe1.jpg', 'https://img.test/shoe2.jpg', 'https://img.test/shoe3.jpg'],
        sku: 'SHOE-001',
        seo_title: 'Chaussures Running Pro - Livraison rapide',
        seo_description: 'Découvrez nos chaussures running confortables pour la course.',
        tags: ['running', 'sport', 'chaussures'],
      });

      expect(result.title).toBe('Chaussures Running Pro');
      expect(result.price).toBe(89.99);
      expect(result.status).toBe('active');
      expect(result.completeness_score).toBe(100);
      expect(result.content_hash).toBeTruthy();
      expect(result.images).toHaveLength(3);
    });

    it('handles missing fields gracefully', () => {
      const result = engine.normalize({ name: 'Basic' });
      expect(result.title).toBe('Basic');
      expect(result.price).toBe(0);
      expect(result.status).toBe('error_incomplete');
      expect(result.completeness_score).toBeLessThan(60);
    });

    it('throws on null input', () => {
      expect(() => engine.normalize(null as any)).toThrow('non-null object');
    });

    it('sanitizes HTML in descriptions', () => {
      const result = engine.normalize({
        title: 'Test',
        description: '<script>alert("xss")</script><p>Safe content</p>',
      });
      expect(result.description).not.toContain('<script>');
      expect(result.description).toContain('Safe content');
    });

    it('enforces field length limits', () => {
      const result = engine.normalize({
        title: 'A'.repeat(1000),
        sku: 'X'.repeat(200),
      });
      expect(result.title.length).toBeLessThanOrEqual(500);
      expect(result.sku!.length).toBeLessThanOrEqual(64);
    });

    it('validates image URLs', () => {
      const result = engine.normalize({
        title: 'Test',
        images: ['https://img.test/valid.jpg', 'not-a-url', 'ftp://invalid.com/img.jpg'],
      });
      expect(result.images).toHaveLength(1);
      expect(result.images[0].url).toBe('https://img.test/valid.jpg');
    });

    it('parses price from string with comma', () => {
      const result = engine.normalize({ title: 'Test', price: '12,99€' });
      expect(result.price).toBe(12.99);
    });

    it('extracts source_url only if valid', () => {
      const r1 = engine.normalize({ title: 'T', source_url: 'https://shop.com/p' });
      expect(r1.source_url).toBe('https://shop.com/p');
      const r2 = engine.normalize({ title: 'T', source_url: 'not-url' });
      expect(r2.source_url).toBeNull();
    });
  });

  describe('normalizeBatch()', () => {
    it('processes valid products and collects errors', () => {
      const result = engine.normalizeBatch([
        { title: 'Product A', price: 10 },
        null as any, // will error
        { title: 'Product B', price: 20 },
      ]);

      expect(result.stats.success).toBe(2);
      expect(result.stats.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].index).toBe(1);
    });

    it('detects duplicates by content hash', () => {
      const result = engine.normalizeBatch([
        { title: 'Same Product', price: 10 },
        { title: 'Same Product', price: 10 },
        { title: 'Different Product', price: 20 },
      ]);

      expect(result.stats.duplicates).toBe(1);
      expect(result.duplicates[0].index).toBe(1);
      expect(result.duplicates[0].duplicateOf).toBe(0);
      expect(result.products).toHaveLength(2);
    });

    it('computes average completeness', () => {
      const result = engine.normalizeBatch([
        { title: 'Full Product', price: 50, description: 'A long description here.', category: 'Cat', images: ['https://i.co/1.jpg', 'https://i.co/2.jpg', 'https://i.co/3.jpg'], tags: ['a'], seo_title: 'SEO', seo_description: 'SEO Desc', sku: 'SKU1' },
      ]);
      expect(result.stats.avg_completeness).toBe(100);
    });
  });

  describe('custom weights', () => {
    it('uses custom weights for completeness', () => {
      const heavy = new NormalizationEngine('import', { title: 50, description: 50, price: 0, images: 0, category: 0, tags: 0, seoTitle: 0, seoDescription: 0, sku: 0 });
      const r = heavy.normalize({ title: 'Good Title', description: 'A description that is long enough for scoring' });
      expect(r.completeness_score).toBe(100);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════
// SEO Scoring Engine Tests
// ════════════════════════════════════════════════════════════════════════

describe('SeoScoringEngine', () => {
  describe('scoreSeo()', () => {
    it('scores a fully optimized product as A', () => {
      const result = scoreSeo({
        title: 'Chaussures de Running Professionnelles Nike',
        description: 'Ces chaussures de running offrent un confort exceptionnel grâce à leur semelle amortissante en mousse réactive. Idéales pour la course sur route et le trail léger, elles combinent légèreté et stabilité pour des performances optimales.',
        seo_title: 'Chaussures Running Nike Pro - Livraison Gratuite',
        seo_description: 'Découvrez les chaussures de running Nike Pro. Confort exceptionnel, semelle amortissante, idéales pour route et trail. Livraison gratuite dès 50€.',
        images: [
          { url: 'https://img.test/1.jpg', alt: 'Chaussure vue de face' },
          { url: 'https://img.test/2.jpg', alt: 'Chaussure vue de profil' },
          { url: 'https://img.test/3.jpg', alt: 'Semelle détail' },
          { url: 'https://img.test/4.jpg', alt: 'Portée' },
          { url: 'https://img.test/5.jpg', alt: 'Boîte' },
        ],
        tags: ['running', 'nike', 'sport', 'chaussures', 'course'],
        sku: 'NIKE-RUN-001',
        category: 'Chaussures',
        price: 129.99,
        url_slug: 'chaussures-running-nike-pro',
      });

      expect(result.overall_score).toBeGreaterThanOrEqual(85);
      expect(result.grade).toMatch(/^[AB]$/);
      expect(result.status).toBe('optimized');
      expect(result.issues.length).toBeLessThan(3);
    });

    it('scores a minimal product as F', () => {
      const result = scoreSeo({
        title: '',
        description: '',
        images: [],
        tags: [],
      });

      expect(result.overall_score).toBeLessThan(20);
      expect(result.grade).toBe('F');
      expect(result.status).toBe('critical');
      expect(result.issues.length).toBeGreaterThan(3);
    });

    it('detects missing meta tags', () => {
      const result = scoreSeo({
        title: 'Good Product Title Here',
        description: 'A decent description that should be long enough for basic scoring needs.',
        images: [{ url: 'https://img.test/1.jpg', alt: 'product' }],
        tags: ['tag1'],
      });

      const metaIssues = result.issues.filter(i => i.category === 'meta');
      expect(metaIssues.length).toBeGreaterThan(0);
    });

    it('flags images without alt text', () => {
      const result = scoreSeo({
        title: 'Product With Images',
        description: 'Description.',
        images: [{ url: 'https://img.test/1.jpg' }, { url: 'https://img.test/2.jpg' }],
        tags: [],
      });

      const altIssue = result.issues.find(i => i.rule === 'missing_alt');
      expect(altIssue).toBeDefined();
    });

    it('warns about spam in title', () => {
      const result = scoreSeo({
        title: 'BUY NOW!!!! BEST DEAL EVERRRRR',
        description: 'Desc.',
        images: [],
        tags: [],
      });

      const spam = result.issues.find(i => i.rule === 'title_spam');
      expect(spam).toBeDefined();
    });

    it('provides actionable recommendations sorted by impact', () => {
      const result = scoreSeo({
        title: 'X',
        description: '',
        images: [],
        tags: [],
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
      // First recommendation should be critical or high impact
      expect(['critical', 'high']).toContain(result.recommendations[0].impact);
    });
  });

  describe('scoreBatch()', () => {
    it('aggregates batch statistics', () => {
      const { stats } = scoreBatch([
        { title: 'Product A with a Good Long Title', description: 'Long description for product A with enough details to score well in the engine.', images: [{ url: 'https://i.co/1.jpg', alt: 'img' }], tags: ['a'], price: 10, sku: 'A1', category: 'Cat' },
        { title: '', description: '', images: [], tags: [] },
      ]);

      expect(stats.avg_score).toBeGreaterThan(0);
      expect(stats.by_grade).toBeDefined();
      expect(stats.top_issues.length).toBeGreaterThan(0);
    });
  });
});
