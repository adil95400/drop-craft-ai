/**
 * Secure Form Hook
 * Provides CSRF protection and XSS sanitization for forms
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { z } from 'zod';
import { getCSRFToken, validateCSRFToken, rotateCSRFToken } from '@/lib/csrf-protection';
import { sanitizeText, sanitizeEmail, sanitizeURL, sanitizePhone, containsXSSVector } from '@/lib/xss-protection';

interface UseSecureFormOptions<T> {
  schema?: z.ZodSchema<T>;
  onSubmit: (data: T, csrfToken: string) => Promise<void>;
  sanitizers?: Partial<Record<keyof T, (value: string) => string>>;
  validateOnChange?: boolean;
  rotateTokenOnSubmit?: boolean;
}

interface SecureFormState<T> {
  values: Partial<T>;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isValid: boolean;
  csrfToken: string;
  securityWarnings: string[];
}

/**
 * Hook for creating secure forms with CSRF and XSS protection
 */
export function useSecureForm<T extends Record<string, unknown>>({
  schema,
  onSubmit,
  sanitizers = {},
  validateOnChange = true,
  rotateTokenOnSubmit = true,
}: UseSecureFormOptions<T>) {
  const [state, setState] = useState<SecureFormState<T>>({
    values: {},
    errors: {},
    isSubmitting: false,
    isValid: false,
    csrfToken: '',
    securityWarnings: [],
  });

  const formRef = useRef<HTMLFormElement>(null);

  // Initialize CSRF token
  useEffect(() => {
    setState(prev => ({
      ...prev,
      csrfToken: getCSRFToken(),
    }));
  }, []);

  // Default sanitizers based on field name patterns
  const getSanitizer = useCallback((fieldName: string) => {
    if (sanitizers[fieldName as keyof T]) {
      return sanitizers[fieldName as keyof T];
    }
    
    const lowerName = fieldName.toLowerCase();
    
    if (lowerName.includes('email')) return sanitizeEmail;
    if (lowerName.includes('url') || lowerName.includes('link')) return sanitizeURL;
    if (lowerName.includes('phone') || lowerName.includes('tel')) return sanitizePhone;
    
    return sanitizeText;
  }, [sanitizers]);

  // Check for XSS vectors
  const checkSecurity = useCallback((values: Partial<T>): string[] => {
    const warnings: string[] = [];
    
    Object.entries(values).forEach(([key, value]) => {
      if (typeof value === 'string' && containsXSSVector(value)) {
        warnings.push(`Potential security issue detected in field "${key}"`);
      }
    });
    
    return warnings;
  }, []);

  // Set a single field value with sanitization
  const setFieldValue = useCallback((field: keyof T, rawValue: unknown) => {
    const sanitizer = getSanitizer(field as string);
    const value = typeof rawValue === 'string' ? sanitizer(rawValue) : rawValue;
    
    setState(prev => {
      const newValues = { ...prev.values, [field]: value };
      const securityWarnings = checkSecurity(newValues);
      
      let errors = prev.errors;
      
      if (validateOnChange && schema) {
        const result = schema.safeParse(newValues);
        if (!result.success && 'error' in result) {
          const fieldErrors = result.error.issues
            .filter(issue => issue.path[0] === field)
            .map(issue => issue.message);
          
          if (fieldErrors.length > 0) {
            errors = { ...prev.errors, [field]: fieldErrors[0] };
          } else {
            const { [field]: _, ...rest } = prev.errors as Record<keyof T, string>;
            errors = rest as Partial<Record<keyof T, string>>;
          }
        } else {
          const { [field]: _, ...rest } = prev.errors as Record<keyof T, string>;
          errors = rest as Partial<Record<keyof T, string>>;
        }
      }
      
      return {
        ...prev,
        values: newValues,
        errors,
        securityWarnings,
        isValid: Object.keys(errors).length === 0 && securityWarnings.length === 0,
      };
    });
  }, [getSanitizer, checkSecurity, validateOnChange, schema]);

  // Set multiple field values
  const setValues = useCallback((values: Partial<T>) => {
    Object.entries(values).forEach(([key, value]) => {
      setFieldValue(key as keyof T, value);
    });
  }, [setFieldValue]);

  // Validate all fields
  const validate = useCallback((): boolean => {
    if (!schema) return true;
    
    const result = schema.safeParse(state.values);
    
    if (!result.success && 'error' in result) {
      const errors: Partial<Record<keyof T, string>> = {};
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as keyof T;
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      });
      
      setState(prev => ({
        ...prev,
        errors,
        isValid: false,
      }));
      
      return false;
    }
    
    setState(prev => ({
      ...prev,
      errors: {},
      isValid: true,
    }));
    
    return true;
  }, [schema, state.values]);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Validate CSRF token
    if (!validateCSRFToken(state.csrfToken)) {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, _form: 'Session expirée. Veuillez rafraîchir la page.' } as Partial<Record<keyof T, string>>,
      }));
      return;
    }
    
    // Check for security warnings
    if (state.securityWarnings.length > 0) {
      console.warn('Security warnings detected:', state.securityWarnings);
      return;
    }
    
    // Validate schema
    if (!validate()) {
      return;
    }
    
    setState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      await onSubmit(state.values as T, state.csrfToken);
      
      // Rotate token after successful submission
      if (rotateTokenOnSubmit) {
        const newToken = rotateCSRFToken();
        setState(prev => ({
          ...prev,
          csrfToken: newToken,
          isSubmitting: false,
        }));
      } else {
        setState(prev => ({ ...prev, isSubmitting: false }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: {
          ...prev.errors,
          _form: error instanceof Error ? error.message : 'Une erreur est survenue',
        } as Partial<Record<keyof T, string>>,
      }));
    }
  }, [state.csrfToken, state.securityWarnings, state.values, validate, onSubmit, rotateTokenOnSubmit]);

  // Reset form
  const reset = useCallback(() => {
    setState({
      values: {},
      errors: {},
      isSubmitting: false,
      isValid: false,
      csrfToken: getCSRFToken(),
      securityWarnings: [],
    });
  }, []);

  // Clear specific field error
  const clearError = useCallback((field: keyof T) => {
    setState(prev => {
      const { [field]: _, ...rest } = prev.errors as Record<keyof T, string>;
      return { ...prev, errors: rest as Partial<Record<keyof T, string>> };
    });
  }, []);

  // Get field props for input elements
  const getFieldProps = useCallback((field: keyof T) => ({
    name: field as string,
    value: (state.values[field] as string) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFieldValue(field, e.target.value);
    },
    onBlur: () => {
      if (schema) {
        validate();
      }
    },
    'aria-invalid': !!state.errors[field],
    'aria-describedby': state.errors[field] ? `${field as string}-error` : undefined,
  }), [state.values, state.errors, setFieldValue, validate, schema]);

  return {
    // State
    values: state.values,
    errors: state.errors,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    csrfToken: state.csrfToken,
    securityWarnings: state.securityWarnings,
    
    // Actions
    setFieldValue,
    setValues,
    validate,
    handleSubmit,
    reset,
    clearError,
    getFieldProps,
    
    // Refs
    formRef,
  };
}

/**
 * Hook for CSRF token management only
 */
export function useCSRFToken() {
  const [token, setToken] = useState<string>('');
  
  useEffect(() => {
    setToken(getCSRFToken());
  }, []);
  
  const refresh = useCallback(() => {
    const newToken = rotateCSRFToken();
    setToken(newToken);
    return newToken;
  }, []);
  
  const validate = useCallback((tokenToValidate: string) => {
    return validateCSRFToken(tokenToValidate);
  }, []);
  
  return { token, refresh, validate };
}

export default useSecureForm;
