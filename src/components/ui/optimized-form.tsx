'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info, Eye, EyeOff, LucideIcon } from 'lucide-react';

interface FormFieldProps {
  name: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  icon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  name,
  label,
  description,
  error,
  required,
  icon: Icon,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className="flex items-center gap-2 text-sm font-medium">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-destructive flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </motion.p>
        ) : description ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground flex items-center gap-1"
          >
            <Info className="h-3 w-3" />
            {description}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// Enhanced Input with validation states
interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  success?: boolean;
  showPasswordToggle?: boolean;
  status?: 'success' | 'warning' | 'error';
}

export function EnhancedInput({
  label,
  description,
  hint,
  error,
  icon,
  success,
  showPasswordToggle,
  status,
  type = 'text',
  required,
  className,
  ...props
}: EnhancedInputProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;
  
  const isSuccess = success || status === 'success';
  const isWarning = status === 'warning';
  const isError = error || status === 'error';
  const displayHint = hint || description;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <Input
          type={inputType}
          className={cn(
            'transition-all duration-200',
            isError && 'border-destructive focus-visible:ring-destructive',
            isSuccess && 'border-emerald-500 focus-visible:ring-emerald-500',
            isWarning && 'border-amber-500 focus-visible:ring-amber-500',
            showPasswordToggle && 'pr-10',
            className
          )}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        {isSuccess && !isError && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500"
          >
            <CheckCircle2 className="h-4 w-4" />
          </motion.div>
        )}
        {isWarning && !isError && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500"
          >
            <AlertCircle className="h-4 w-4" />
          </motion.div>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {displayHint && !error && (
        <p className="text-xs text-muted-foreground">{displayHint}</p>
      )}
    </div>
  );
}

// Enhanced Textarea
interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  description?: string;
  error?: string;
  icon?: LucideIcon;
  maxLength?: number;
  showCount?: boolean;
}

export function EnhancedTextarea({
  label,
  description,
  error,
  icon,
  maxLength,
  showCount = true,
  required,
  className,
  value,
  ...props
}: EnhancedTextareaProps) {
  const charCount = String(value || '').length;

  return (
    <FormField
      name={props.name || props.id || ''}
      label={label}
      description={description}
      error={error}
      required={required}
      icon={icon}
    >
      <div className="relative">
        <Textarea
          value={value}
          maxLength={maxLength}
          className={cn(
            'transition-all duration-200 resize-none',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          {...props}
        />
        {showCount && maxLength && (
          <div className="absolute right-3 bottom-3 text-xs text-muted-foreground">
            <span className={cn(charCount > maxLength * 0.9 && 'text-amber-500', charCount >= maxLength && 'text-destructive')}>
              {charCount}
            </span>
            /{maxLength}
          </div>
        )}
      </div>
    </FormField>
  );
}

// Enhanced Select
interface EnhancedSelectProps {
  label: string;
  description?: string;
  error?: string;
  icon?: React.ReactNode;
  required?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: Array<{ value: string; label: string; description?: string; icon?: string }>;
  disabled?: boolean;
  className?: string;
}

export function EnhancedSelect({
  label,
  description,
  error,
  icon,
  required,
  value,
  onValueChange,
  placeholder = 'Sélectionner...',
  options,
  disabled,
  className,
}: EnhancedSelectProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2 text-sm font-medium">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={cn(
          'transition-all duration-200',
          error && 'border-destructive focus:ring-destructive',
          className
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex flex-col">
                <span>{option.label}</span>
                {option.description && (
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// Form Section with title
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  badge?: string;
}

export function FormSection({ title, description, children, className, badge }: FormSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-4', className)}
    >
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {badge && <Badge variant="secondary">{badge}</Badge>}
      </div>
      {description && (
        <p className="text-sm text-muted-foreground -mt-2">{description}</p>
      )}
      <div className="space-y-4 p-4 rounded-lg border bg-muted/20">
        {children}
      </div>
    </motion.div>
  );
}

// Form Grid for layout
interface FormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function FormGrid({ children, columns = 2, className }: FormGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}

// Toggle Switch with better styling
interface EnhancedSwitchProps {
  label: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function EnhancedSwitch({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  className,
}: EnhancedSwitchProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/20', className)}>
      <div className="space-y-0.5">
        <Label className="text-sm font-medium cursor-pointer">{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}
