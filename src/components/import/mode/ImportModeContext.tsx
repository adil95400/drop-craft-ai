/**
 * Contexte et Toggle pour le mode Basique/Expert
 * Permet de simplifier l'interface pour les débutants
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Sparkles, Zap, GraduationCap, Rocket } from 'lucide-react';

export type ImportMode = 'basic' | 'expert';

interface ImportModeContextType {
  mode: ImportMode;
  setMode: (mode: ImportMode) => void;
  isExpert: boolean;
  isBasic: boolean;
  toggleMode: () => void;
}

const ImportModeContext = createContext<ImportModeContextType | undefined>(undefined);

interface ImportModeProviderProps {
  children: ReactNode;
}

export function ImportModeProvider({ children }: ImportModeProviderProps) {
  const [mode, setMode] = useState<ImportMode>(() => {
    const saved = localStorage.getItem('shopopti_import_mode');
    return (saved as ImportMode) || 'basic';
  });

  useEffect(() => {
    localStorage.setItem('shopopti_import_mode', mode);
  }, [mode]);

  const toggleMode = () => {
    setMode(prev => (prev === 'basic' ? 'expert' : 'basic'));
  };

  const value: ImportModeContextType = {
    mode,
    setMode,
    isExpert: mode === 'expert',
    isBasic: mode === 'basic',
    toggleMode,
  };

  return (
    <ImportModeContext.Provider value={value}>
      {children}
    </ImportModeContext.Provider>
  );
}

export function useImportMode() {
  const context = useContext(ImportModeContext);
  if (context === undefined) {
    throw new Error('useImportMode must be used within an ImportModeProvider');
  }
  return context;
}

// Composant Toggle pour le mode
interface ImportModeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export function ImportModeToggle({ className, showLabels = true }: ImportModeToggleProps) {
  const { mode, toggleMode, isExpert } = useImportMode();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-lg bg-muted/50 border',
              className
            )}
          >
            <div className="flex items-center gap-2">
              {isExpert ? (
                <Rocket className="w-4 h-4 text-primary" />
              ) : (
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
              )}
              {showLabels && (
                <Label htmlFor="import-mode" className="text-sm font-medium cursor-pointer">
                  {isExpert ? 'Expert' : 'Basique'}
                </Label>
              )}
            </div>
            <Switch
              id="import-mode"
              checked={isExpert}
              onCheckedChange={toggleMode}
            />
            {isExpert && (
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                <Sparkles className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-sm">
            {isExpert
              ? 'Mode Expert : Toutes les fonctionnalités avancées'
              : 'Mode Basique : Interface simplifiée pour débutants'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Composant conditionnel - n'affiche que si mode expert
interface ExpertOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ExpertOnly({ children, fallback = null }: ExpertOnlyProps) {
  const { isExpert } = useImportMode();
  return <>{isExpert ? children : fallback}</>;
}

// Composant conditionnel - n'affiche que si mode basique
interface BasicOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function BasicOnly({ children, fallback = null }: BasicOnlyProps) {
  const { isBasic } = useImportMode();
  return <>{isBasic ? children : fallback}</>;
}
