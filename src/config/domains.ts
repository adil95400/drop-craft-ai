// Domain configuration for multi-environment deployment

export const DOMAINS = {
  production: {
    canonical: 'shopopti.io',
    www: 'www.shopopti.io',
    siteUrl: 'https://shopopti.io',
  },
  staging: {
    canonical: 'drop-craft-ai.lovable.app',
    siteUrl: 'https://drop-craft-ai.lovable.app',
  },
  development: {
    canonical: 'localhost',
    siteUrl: 'http://localhost:5173',
  },
} as const;

// Auth redirect URLs for Supabase configuration
export const AUTH_REDIRECT_URLS = [
  'https://shopopti.io/*',
  'https://www.shopopti.io/*',
  'https://drop-craft-ai.lovable.app/*',
  'http://localhost:5173/*',
  'http://localhost:3000/*',
];

// Get current domain configuration
export function getCurrentDomain() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  if (hostname === 'shopopti.io' || hostname === 'www.shopopti.io') {
    return DOMAINS.production;
  }
  if (hostname.includes('lovable.app')) {
    return DOMAINS.staging;
  }
  return DOMAINS.development;
}

// Get site URL for current environment
export function getSiteUrl() {
  return getCurrentDomain().siteUrl;
}

// Check if we should redirect www to non-www
export function shouldRedirectToCanonical() {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === 'www.shopopti.io';
}
