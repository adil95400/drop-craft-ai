// Input validation utilities for security

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  if (!input) return '';
  
  // Remove script tags and dangerous HTML
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Validates and sanitizes URL input
 */
export const validateUrl = (url: string): { isValid: boolean; sanitized: string } => {
  if (!url) return { isValid: false, sanitized: '' };
  
  try {
    // Sanitize the URL
    const sanitized = url.trim().toLowerCase();
    
    // Check for dangerous protocols
    if (sanitized.startsWith('javascript:') || sanitized.startsWith('data:') || sanitized.startsWith('vbscript:')) {
      return { isValid: false, sanitized: '' };
    }
    
    // Ensure it starts with http or https
    let validUrl = sanitized;
    if (!sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
      validUrl = `https://${sanitized}`;
    }
    
    // Validate using URL constructor
    const urlObj = new URL(validUrl);
    
    // Additional checks
    if (!urlObj.hostname || urlObj.hostname === 'localhost') {
      return { isValid: false, sanitized: '' };
    }
    
    return { isValid: true, sanitized: urlObj.toString() };
  } catch {
    return { isValid: false, sanitized: '' };
  }
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates and sanitizes text input
 */
export const sanitizeText = (input: string, maxLength = 1000): string => {
  if (!input) return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML brackets
    .replace(/\0/g, ''); // Remove null bytes
};

/**
 * Validates password strength
 */
export const validatePassword = (password: string): { 
  isValid: boolean; 
  errors: string[] 
} => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Le mot de passe est requis');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }
  
  return { isValid: errors.length === 0, errors };
};

/**
 * Prevents SQL injection by validating input
 */
export const validateSqlSafe = (input: string): boolean => {
  if (!input) return true;
  
  // Check for common SQL injection patterns
  const sqlPatterns = [
    /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|MERGE|SELECT|UPDATE|UNION)\b)/i,
    /(;|--|\/\*|\*\/|xp_|sp_)/i,
    /'[^']*'/,
    /\b(OR|AND)\s+\w+\s*=\s*\w+/i
  ];
  
  return !sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Rate limiting helper for form submissions
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  canAttempt(key: string, maxAttempts = 5, windowMs = 300000): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Filter out old attempts outside the window
    const recentAttempts = attempts.filter(attempt => now - attempt < windowMs);
    
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }
  
  getRemainingCooldown(key: string, windowMs = 300000): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const elapsed = Date.now() - oldestAttempt;
    return Math.max(0, windowMs - elapsed);
  }
}