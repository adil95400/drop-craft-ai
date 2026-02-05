// Application version and build info
// These values are injected at build time via Vite define

export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';
export const GIT_SHA = import.meta.env.VITE_GIT_SHA || 'dev';
export const BUILD_DATE = import.meta.env.VITE_BUILD_DATE || new Date().toISOString();
export const ENVIRONMENT = import.meta.env.VITE_ENVIRONMENT || detectEnvironment();

function detectEnvironment(): 'production' | 'staging' | 'development' {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  if (hostname === 'shopopti.io') {
    return 'production';
  }
  if (hostname === 'www.shopopti.io') {
    return 'production'; // Will redirect to shopopti.io
  }
  if (hostname.includes('lovable.app')) {
    return 'staging';
  }
  return 'development';
}

export const VERSION_INFO = {
  version: APP_VERSION,
  sha: GIT_SHA,
  buildDate: BUILD_DATE,
  environment: ENVIRONMENT,
  fullVersion: `${APP_VERSION}${GIT_SHA !== 'dev' ? `+${GIT_SHA.slice(0, 7)}` : ''}`,
};

// Check if current environment is staging
export const isStaging = () => ENVIRONMENT === 'staging';
export const isProduction = () => ENVIRONMENT === 'production';
export const isDevelopment = () => ENVIRONMENT === 'development';
