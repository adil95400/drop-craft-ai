/**
 * Tests critiques — Edge functions contract validation
 * Vérifie que les edge functions existent et ont la bonne structure
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const CRITICAL_FUNCTIONS = [
  'billing-details',
  'get-invoices',
  'renewal-alerts',
  'manage-referrals',
  'stripe-webhooks',
];

describe('Edge Functions Structure', () => {
  CRITICAL_FUNCTIONS.forEach(fnName => {
    it(`should have ${fnName}/index.ts`, () => {
      const fnPath = join(process.cwd(), 'supabase', 'functions', fnName, 'index.ts');
      expect(existsSync(fnPath), `Missing edge function: ${fnName}`).toBe(true);
    });
  });

  it('should have CORS headers in billing-details', () => {
    const content = readFileSync(
      join(process.cwd(), 'supabase', 'functions', 'billing-details', 'index.ts'),
      'utf-8'
    );
    expect(content).toContain('Access-Control-Allow-Origin');
    expect(content).toContain('OPTIONS');
  });

  it('should have CORS headers in get-invoices', () => {
    const content = readFileSync(
      join(process.cwd(), 'supabase', 'functions', 'get-invoices', 'index.ts'),
      'utf-8'
    );
    expect(content).toContain('Access-Control-Allow-Origin');
    expect(content).toContain('Authorization');
  });

  it('should verify auth in billing-details', () => {
    const content = readFileSync(
      join(process.cwd(), 'supabase', 'functions', 'billing-details', 'index.ts'),
      'utf-8'
    );
    expect(content).toContain('Authorization');
    expect(content).toContain('getUser');
  });
});
