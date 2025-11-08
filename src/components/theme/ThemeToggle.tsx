import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "ghost" | "outline";
  collapsed?: boolean;
}

export function ThemeToggle({ 
  className, 
  size = "icon", 
  variant = "ghost",
  collapsed = false 
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = theme === "dark";

  // Éviter les problèmes d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  if (collapsed) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={toggleTheme}
        className={cn(
          "relative transition-all duration-300 hover:scale-110",
          className
        )}
        title={isDark ? "Mode clair" : "Mode sombre"}
      >
        <div className="relative w-5 h-5">
          <Sun className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-500",
            isDark 
              ? "rotate-90 scale-0 opacity-0" 
              : "rotate-0 scale-100 opacity-100 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
          )} />
          <Moon className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-500",
            isDark 
              ? "rotate-0 scale-100 opacity-100 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" 
              : "-rotate-90 scale-0 opacity-0"
          )} />
        </div>
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:scale-[1.02] group",
        "w-full justify-start gap-3 px-3 py-2",
        isDark && "hover:bg-blue-950/20",
        !isDark && "hover:bg-amber-50",
        className
      )}
    >
      <div className="relative w-5 h-5 flex-shrink-0">
        <Sun className={cn(
          "absolute inset-0 h-5 w-5 transition-all duration-500",
          isDark 
            ? "rotate-90 scale-0 opacity-0" 
            : "rotate-0 scale-100 opacity-100 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
        )} />
        <Moon className={cn(
          "absolute inset-0 h-5 w-5 transition-all duration-500",
          isDark 
            ? "rotate-0 scale-100 opacity-100 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" 
            : "-rotate-90 scale-0 opacity-0"
        )} />
      </div>
      
      <span className="flex-1 text-left text-sm font-medium transition-all duration-300">
        {isDark ? "Mode clair" : "Mode sombre"}
      </span>

      {/* Badge indicateur */}
      <div className={cn(
        "text-xs px-1.5 py-0.5 rounded-md transition-all duration-300",
        isDark 
          ? "bg-blue-950/30 text-blue-400 border border-blue-800/30" 
          : "bg-amber-100 text-amber-700 border border-amber-300"
      )}>
        {isDark ? "🌙" : "☀️"}
      </div>

      {/* Effet de brillance au hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </Button>
  );
}
