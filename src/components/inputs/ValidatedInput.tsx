import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircleIcon, XCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationRule {
  test: (value: string) => boolean;
  message: string;
}

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  validationRules?: ValidationRule[];
  showValidation?: boolean;
  helperText?: string;
}

export const ValidatedInput = ({
  label,
  validationRules = [],
  showValidation = false,
  helperText,
  className,
  ...props
}: ValidatedInputProps) => {
  const [value, setValue] = useState(props.value || '');
  const [touched, setTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    props.onChange?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    props.onBlur?.(e);
  };

  // Run validation rules
  const validationResults = validationRules.map(rule => ({
    ...rule,
    isValid: rule.test(value as string)
  }));

  const isValid = validationResults.every(result => result.isValid);
  const hasErrors = touched && validationResults.some(result => !result.isValid);

  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className="flex items-center gap-2">
        {label}
        {props.required && <span className="text-destructive">*</span>}
        {showValidation && touched && (
          isValid ? (
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
          ) : (
            <XCircleIcon className="h-4 w-4 text-destructive" />
          )
        )}
      </Label>
      
      {helperText && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
      
      <Input
        {...props}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          hasErrors && "border-destructive focus-visible:ring-destructive",
          className
        )}
      />
      
      {showValidation && touched && hasErrors && (
        <div className="space-y-1">
          {validationResults
            .filter(result => !result.isValid)
            .map((result, index) => (
              <Alert key={index} variant="destructive" className="py-2">
                <XCircleIcon className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {result.message}
                </AlertDescription>
              </Alert>
            ))}
        </div>
      )}
    </div>
  );
};