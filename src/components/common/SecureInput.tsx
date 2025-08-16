import { Input } from "@/components/ui/input";
import { forwardRef } from "react";

// Sanitize input to prevent XSS
const sanitizeValue = (value: string): string => {
  return value
    .replace(/[<>]/g, '') // Remove potentially dangerous characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  maxLength?: number;
}

export const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  ({ onChange, maxLength = 1000, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitizedValue = sanitizeValue(e.target.value);
      
      // Truncate if too long
      const truncatedValue = sanitizedValue.length > maxLength 
        ? sanitizedValue.substring(0, maxLength) 
        : sanitizedValue;
      
      // Update the input value
      e.target.value = truncatedValue;
      
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        onChange={handleChange}
        maxLength={maxLength}
      />
    );
  }
);

SecureInput.displayName = "SecureInput";