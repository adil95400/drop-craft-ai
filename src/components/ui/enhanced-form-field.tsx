/**
 * Enhanced Form Field avec validation en temps réel et animations
 */

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface EnhancedFormFieldProps {
  label: string
  name: string
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "textarea"
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  error?: string
  success?: boolean
  loading?: boolean
  required?: boolean
  disabled?: boolean
  icon?: React.ReactNode
  hint?: string
  maxLength?: number
  rows?: number
  className?: string
  inputClassName?: string
  autoComplete?: string
  validateOnChange?: boolean
}

export function EnhancedFormField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  success,
  loading,
  required,
  disabled,
  icon,
  hint,
  maxLength,
  rows = 3,
  className,
  inputClassName,
  autoComplete,
  validateOnChange,
}: EnhancedFormFieldProps) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [hasInteracted, setHasInteracted] = React.useState(false)

  const showError = error && hasInteracted
  const showSuccess = success && hasInteracted && !error
  const showIcon = showError || showSuccess || loading

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value)
    if (!hasInteracted) setHasInteracted(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    setHasInteracted(true)
    onBlur?.()
  }

  const inputProps = {
    id: name,
    name,
    placeholder,
    value,
    onChange: handleChange,
    onFocus: () => setIsFocused(true),
    onBlur: handleBlur,
    disabled: disabled || loading,
    maxLength,
    autoComplete,
    className: cn(
      "transition-all duration-200",
      icon && "pl-10",
      showIcon && "pr-10",
      showError && "border-destructive focus-visible:ring-destructive/20",
      showSuccess && "border-green-500 focus-visible:ring-green-500/20",
      isFocused && !showError && !showSuccess && "ring-2 ring-primary/20",
      inputClassName
    ),
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label 
          htmlFor={name}
          className={cn(
            "text-sm font-medium transition-colors",
            showError && "text-destructive",
            showSuccess && "text-green-600 dark:text-green-500"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        
        {maxLength && (
          <span className="text-xs text-muted-foreground">
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      <div className="relative">
        {/* Icon gauche */}
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}

        {/* Input ou Textarea */}
        {type === "textarea" ? (
          <Textarea {...inputProps} rows={rows} />
        ) : (
          <Input {...inputProps} type={type} />
        )}

        {/* Status icon droite avec animation */}
        <AnimatePresence mode="wait">
          {showIcon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {showError && !loading && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              {showSuccess && !loading && (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hint ou Error message avec animation */}
      <AnimatePresence mode="wait">
        {showError ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-destructive flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-muted-foreground"
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/**
 * Form group pour organiser les champs
 */
export function FormFieldGroup({
  children,
  columns = 1,
  className,
}: {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-3",
        columns === 4 && "sm:grid-cols-4",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Form section avec titre
 */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}
