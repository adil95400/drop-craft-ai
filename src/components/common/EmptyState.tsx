import { Button } from "@/components/ui/button";
import { Package, Plus, Search, AlertCircle } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  type?: "default" | "search" | "error" | "create";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  type = "default"
}: EmptyStateProps) {
  const getDefaultIcon = () => {
    switch (type) {
      case "search":
        return <Search className="h-12 w-12 text-muted-foreground" />;
      case "error":
        return <AlertCircle className="h-12 w-12 text-destructive" />;
      case "create":
        return <Plus className="h-12 w-12 text-muted-foreground" />;
      default:
        return <Package className="h-12 w-12 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6">
      <div className="mb-4">
        {icon || getDefaultIcon()}
      </div>
      
      <h3 className="text-lg font-semibold mb-2">
        {title}
      </h3>
      
      <p className="text-muted-foreground mb-6 max-w-md">
        {description}
      </p>
      
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}