import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface AsyncButtonProps {
  children: ReactNode;
  onClick: () => Promise<void> | void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
  loadingText?: string;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  type?: "button" | "submit" | "reset";
}

export function AsyncButton({
  children,
  onClick,
  variant = "default",
  size = "default",
  disabled = false,
  className,
  icon,
  loadingText = "Chargement...",
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  type = "button",
  ...props
}: AsyncButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;
    
    setLoading(true);
    
    try {
      await onClick();
      
      if (successMessage) {
        toast({
          title: "Succès",
          description: successMessage,
        });
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Action failed:', error);
      
      const message = errorMessage || 
        (error instanceof Error ? error.message : 'Une erreur est survenue');
      
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
      
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type={type}
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={loading || disabled}
      className={cn(
        "transition-all duration-200",
        loading && "cursor-not-allowed",
        className
      )}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </Button>
  );
}