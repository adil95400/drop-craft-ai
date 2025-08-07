import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

interface CredentialInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function CredentialInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  className
}: CredentialInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  // Mask the value for display
  const maskedValue = value && !isVisible ? "•".repeat(Math.min(value.length, 20)) : value;

  return (
    <div className={className}>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          value={maskedValue}
          onChange={(e) => {
            // Only update if the value is different from masked value
            if (e.target.value !== maskedValue) {
              onChange(e.target.value);
            }
          }}
          placeholder={placeholder}
          required={required}
          className="pr-10"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={toggleVisibility}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  );
}