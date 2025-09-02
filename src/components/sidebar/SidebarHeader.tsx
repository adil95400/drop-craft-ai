import React from "react";
import { Search, Command, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarHeader } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SidebarHeaderContentProps {
  collapsed: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  isSearchFocused: boolean;
}

export const SidebarHeaderContent: React.FC<SidebarHeaderContentProps> = ({
  collapsed,
  searchQuery,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  isSearchFocused
}) => {
  return (
    <SidebarHeader 
      className={cn(
        "border-b transition-all duration-300",
        "bg-gradient-to-r from-background/95 to-muted/30 backdrop-blur-lg",
        "border-border/50"
      )}
    >
      <div className="p-4 space-y-4">
        {/* Logo et titre */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-lg p-2 transition-all duration-200",
            "bg-gradient-to-br from-primary to-primary/80",
            "shadow-lg shadow-primary/25"
          )}>
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Shopopti Pro
              </h1>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className="text-xs animate-pulse"
                >
                  Ultra Pro
                </Badge>
                <span className="text-xs text-muted-foreground">v2.1.0</span>
              </div>
            </div>
          )}
        </div>

        {/* Barre de recherche intelligente */}
        {!collapsed && (
          <div className="relative group">
            <div className={cn(
              "relative transition-all duration-200",
              isSearchFocused && "transform scale-102"
            )}>
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                isSearchFocused ? "text-primary" : "text-muted-foreground"
              )} />
              <Input
                id="sidebar-search"
                type="text"
                placeholder="Rechercher... ⌘K"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={onSearchFocus}
                onBlur={onSearchBlur}
                className={cn(
                  "pl-9 pr-12 transition-all duration-200",
                  "border-border/50 bg-background/50 backdrop-blur-sm",
                  "focus:border-primary focus:bg-background",
                  "hover:border-primary/50",
                  isSearchFocused && "ring-2 ring-primary/20"
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs",
                  "bg-muted/80 text-muted-foreground transition-all duration-200",
                  "border border-border/50",
                  isSearchFocused && "bg-primary/10 text-primary border-primary/30"
                )}>
                  <Command className="h-3 w-3" />
                  <span className="font-mono">K</span>
                </div>
              </div>
            </div>
            
            {/* Indicateur de recherche active */}
            {searchQuery && (
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 animate-pulse" />
            )}
          </div>
        )}

        {/* Version compacte pour sidebar collapsed */}
        {collapsed && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full p-2 aspect-square"
            onClick={onSearchFocus}
          >
            <Search className="h-4 w-4" />
          </Button>
        )}
      </div>
    </SidebarHeader>
  );
};