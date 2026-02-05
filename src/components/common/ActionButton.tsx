import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { productionLogger } from '@/utils/productionLogger';

interface ActionButtonProps {
  children: ReactNode;
  onClick: () => void | Promise<void> | Promise<any>;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
  loadingText?: string;
}

export function ActionButton({
  children,
  onClick,
  variant = "default",
  size = "default",
  loading = false,
  disabled = false,
  className,
  icon,
  loadingText = "Chargement..."
}: ActionButtonProps) {
  const handleClick = async () => {
    if (loading || disabled) return;
    
    try {
      await onClick();
    } catch (error) {
      productionLogger.error('Action failed', error as Error, 'ActionButton');
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={loading || disabled}
      className={cn(
        "transition-all duration-200",
        loading && "cursor-not-allowed",
        className
      )}
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