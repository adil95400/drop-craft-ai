/**
 * P3: React Hook for Form Validation
 * Provides reactive validation with Zod schemas
 */

import { useState, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { errorsToObject } from '@/lib/validation';

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialValues?: Partial<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface UseFormValidationReturn<T> {
  values: Partial<T>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  
  // Actions
  setValue: (field: keyof T, value: unknown) => void;
  setValues: (values: Partial<T>) => void;
  setError: (field: keyof T, message: string) => void;
  clearError: (field: keyof T) => void;
  clearErrors: () => void;
  setTouched: (field: keyof T) => void;
  
  // Validation
  validateField: (field: keyof T) => boolean;
  validateAll: () => boolean;
  
  // Form handlers
  handleChange: (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: (onSubmit: (data: T) => Promise<void> | void) => (e: React.FormEvent) => Promise<void>;
  
  // Reset
  reset: () => void;
  
  // Helpers
  getFieldProps: (field: keyof T) => {
    value: unknown;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    error: string | undefined;
  };
}

export function useFormValidation<T extends Record<string, unknown>>(
  options: UseFormValidationOptions<T>
): UseFormValidationReturn<T> {
  const { 
    schema, 
    initialValues = {}, 
    validateOnChange = true, 
    validateOnBlur = true 
  } = options;

  const [values, setValuesState] = useState<Partial<T>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouchedState] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = useMemo(() => {
    const result = schema.safeParse(values);
    return result.success;
  }, [values, schema]);

  const setValue = useCallback((field: keyof T, value: unknown) => {
    setValuesState(prev => ({ ...prev, [field]: value }));
    
    if (validateOnChange && touched[field as string]) {
      // Full validation on value change
      const fullResult = schema.safeParse({ ...values, [field]: value });
      if (fullResult.success) {
        setErrors(prev => {
          const next = { ...prev };
          delete next[field as string];
          return next;
        });
      } else if ('error' in fullResult) {
        const fieldError = fullResult.error.errors.find(
          e => e.path[0] === field
        );
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [field]: fieldError.message
          }));
        } else {
          setErrors(prev => {
            const next = { ...prev };
            delete next[field as string];
            return next;
          });
        }
      }
    }
  }, [schema, touched, validateOnChange, values]);

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);

  const setError = useCallback((field: keyof T, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const setTouched = useCallback((field: keyof T) => {
    setTouchedState(prev => ({ ...prev, [field]: true }));
  }, []);

  const validateField = useCallback((field: keyof T): boolean => {
    const fullResult = schema.safeParse(values);
    if (fullResult.success) {
      clearError(field);
      return true;
    }
    
    if ('error' in fullResult) {
      const fieldError = fullResult.error.errors.find(
        e => e.path[0] === field
      );
      if (fieldError) {
        setErrors(prev => ({
          ...prev,
          [field]: fieldError.message
        }));
        return false;
      }
    }
    
    clearError(field);
    return true;
  }, [schema, values, clearError]);

  const validateAll = useCallback((): boolean => {
    const result = schema.safeParse(values);
    
    if (result.success) {
      clearErrors();
      return true;
    }
    
    if ('error' in result) {
      setErrors(errorsToObject(result.error.errors));
      // Mark all error fields as touched
      const touchedFields: Record<string, boolean> = {};
      result.error.errors.forEach(err => {
        touchedFields[err.path.join('.')] = true;
      });
      setTouchedState(prev => ({ ...prev, ...touchedFields }));
    }
    return false;
  }, [schema, values, clearErrors]);

  const handleChange = useCallback((field: keyof T) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : e.target.type === 'number'
        ? parseFloat(e.target.value) || 0
        : e.target.value;
      
      setValue(field, value);
    };
  }, [setValue]);

  const handleBlur = useCallback((field: keyof T) => {
    return () => {
      setTouched(field);
      if (validateOnBlur) {
        validateField(field);
      }
    };
  }, [setTouched, validateField, validateOnBlur]);

  const handleSubmit = useCallback((onSubmit: (data: T) => Promise<void> | void) => {
    return async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!validateAll()) {
        return;
      }
      
      setIsSubmitting(true);
      try {
        const result = schema.parse(values);
        await onSubmit(result);
      } catch (error) {
        if (error instanceof z.ZodError) {
          setErrors(errorsToObject(error.errors));
        }
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    };
  }, [validateAll, schema, values]);

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setTouchedState({});
    setIsSubmitting(false);
  }, [initialValues]);

  const getFieldProps = useCallback((field: keyof T) => {
    return {
      value: values[field] ?? '',
      onChange: handleChange(field),
      onBlur: handleBlur(field),
      error: touched[field as string] ? errors[field as string] : undefined,
    };
  }, [values, handleChange, handleBlur, touched, errors]);

  return {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    setValue,
    setValues,
    setError,
    clearError,
    clearErrors,
    setTouched,
    validateField,
    validateAll,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    getFieldProps,
  };
}

/**
 * Simple validation hook for quick one-off validations
 */
export function useValidation<T>(schema: z.ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateFn = useCallback((data: unknown): data is T => {
    const result = schema.safeParse(data);
    
    if (result.success) {
      setErrors({});
      return true;
    }
    
    if ('error' in result) {
      setErrors(errorsToObject(result.error.errors));
    }
    return false;
  }, [schema]);
  
  const getError = useCallback((field: string) => errors[field], [errors]);
  
  const clear = useCallback(() => setErrors({}), []);
  
  return { validate: validateFn, errors, getError, clear };
}
