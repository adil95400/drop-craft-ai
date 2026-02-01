/**
 * Secure Form Component
 * Wrapper component that provides CSRF protection for forms
 */

import React, { forwardRef, useEffect, useState } from 'react';
import { getCSRFToken } from '@/lib/csrf-protection';
import { cn } from '@/lib/utils';

interface SecureFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  onSecureSubmit?: (data: FormData, csrfToken: string) => Promise<void>;
  showSecurityBadge?: boolean;
}

export const SecureForm = forwardRef<HTMLFormElement, SecureFormProps>(
  ({ children, className, onSecureSubmit, showSecurityBadge = false, onSubmit, ...props }, ref) => {
    const [csrfToken, setCsrfToken] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
      setCsrfToken(getCSRFToken());
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      
      if (onSecureSubmit) {
        setIsSubmitting(true);
        try {
          const formData = new FormData(e.currentTarget);
          await onSecureSubmit(formData, csrfToken);
        } finally {
          setIsSubmitting(false);
        }
      } else if (onSubmit) {
        onSubmit(e);
      }
    };

    return (
      <form
        ref={ref}
        className={cn('relative', className)}
        onSubmit={handleSubmit}
        {...props}
      >
        {/* Hidden CSRF token field */}
        <input type="hidden" name="_csrf" value={csrfToken} />
        
        {children}
        
        {/* Optional security badge */}
        {showSecurityBadge && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
              <svg
                className="w-3 h-3 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Sécurisé</span>
            </div>
          </div>
        )}
        
        {/* Loading overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
      </form>
    );
  }
);

SecureForm.displayName = 'SecureForm';

/**
 * Secure Input Component - Auto-sanitizes input values
 */
interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  sanitize?: boolean;
}

export const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  ({ sanitize = true, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (sanitize && e.target.value) {
        // Basic sanitization - remove HTML tags
        e.target.value = e.target.value.replace(/<[^>]*>/g, '');
      }
      onChange?.(e);
    };

    return (
      <input
        ref={ref}
        onChange={handleChange}
        autoComplete={props.type === 'password' ? 'current-password' : props.autoComplete}
        {...props}
      />
    );
  }
);

SecureInput.displayName = 'SecureInput';

/**
 * Secure Textarea Component
 */
interface SecureTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  sanitize?: boolean;
  maxLength?: number;
}

export const SecureTextarea = forwardRef<HTMLTextAreaElement, SecureTextareaProps>(
  ({ sanitize = true, maxLength = 10000, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      let value = e.target.value;
      
      if (sanitize) {
        // Basic sanitization
        value = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
      
      if (maxLength && value.length > maxLength) {
        value = value.slice(0, maxLength);
      }
      
      e.target.value = value;
      onChange?.(e);
    };

    return (
      <textarea
        ref={ref}
        onChange={handleChange}
        maxLength={maxLength}
        {...props}
      />
    );
  }
);

SecureTextarea.displayName = 'SecureTextarea';

export default SecureForm;
