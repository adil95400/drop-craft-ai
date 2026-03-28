import { describe, it, expect } from 'vitest';
import {
  ALL_DOCUMENTATION,
  getDocumentationById,
  getDocumentationBySlug,
  searchDocumentation,
  getDocumentationStats,
} from '@/data/documentation';

describe('Documentation Registry', () => {
  it('should have at least 25 modules registered', () => {
    expect(ALL_DOCUMENTATION.length).toBeGreaterThanOrEqual(25);
  });

  it('should have unique IDs for all modules', () => {
    const ids = ALL_DOCUMENTATION.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have unique slugs for all modules', () => {
    const slugs = ALL_DOCUMENTATION.map(d => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('should find module by ID', () => {
    const mod = getDocumentationById('dashboard');
    expect(mod).toBeDefined();
    expect(mod?.title).toBeTruthy();
  });

  it('should find module by slug', () => {
    const mod = getDocumentationBySlug('extension-chrome');
    expect(mod).toBeDefined();
    expect(mod?.id).toBe('extension-chrome');
  });

  it('should return undefined for unknown slug', () => {
    expect(getDocumentationBySlug('nonexistent')).toBeUndefined();
  });

  it('should search documentation', () => {
    const results = searchDocumentation('import');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].relevance).toBeGreaterThan(0);
  });

  it('should return sorted search results', () => {
    const results = searchDocumentation('produit');
    for (let i = 1; i < results.length; i++) {
      expect(results[i].relevance).toBeLessThanOrEqual(results[i - 1].relevance);
    }
  });

  it('should compute documentation stats', () => {
    const stats = getDocumentationStats();
    expect(stats.totalModules).toBeGreaterThanOrEqual(25);
    expect(stats.totalUseCases).toBeGreaterThan(0);
    expect(stats.totalFAQs).toBeGreaterThan(0);
    expect(stats.totalSteps).toBeGreaterThan(0);
  });

  it('every module should have required fields', () => {
    ALL_DOCUMENTATION.forEach(doc => {
      expect(doc.id).toBeTruthy();
      expect(doc.slug).toBeTruthy();
      expect(doc.title).toBeTruthy();
      expect(doc.description).toBeTruthy();
      expect(doc.category).toBeTruthy();
      expect(doc.useCases.length).toBeGreaterThan(0);
      expect(doc.stepByStep.length).toBeGreaterThan(0);
      expect(doc.faqs.length).toBeGreaterThan(0);
      expect(doc.overview.keyFeatures.length).toBeGreaterThan(0);
    });
  });

  it('should include new modules (extension, stripe, pricing, returns)', () => {
    expect(getDocumentationById('extension-chrome')).toBeDefined();
    expect(getDocumentationById('stripe-billing')).toBeDefined();
    expect(getDocumentationById('price-monitoring')).toBeDefined();
    expect(getDocumentationById('returns-automation')).toBeDefined();
  });
});
