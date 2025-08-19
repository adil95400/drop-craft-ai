import { Badge } from "@/components/ui/badge";
import { Crown, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: string;
  className?: string;
  showIcon?: boolean;
}

export function RoleBadge({ role, className, showIcon = true }: RoleBadgeProps) {
  const isAdmin = role === 'admin';
  
  return (
    <Badge 
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium",
        isAdmin 
          ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30" 
          : "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
        className
      )}
      variant="outline"
    >
      {showIcon && (
        isAdmin 
          ? <Crown className="w-3 h-3" />
          : <User className="w-3 h-3" />
      )}
      {isAdmin ? 'Admin' : 'Utilisateur'}
    </Badge>
  );
}