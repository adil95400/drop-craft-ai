import React from 'react';
import { 
  Accessibility, 
  Eye, 
  Zap, 
  Type, 
  Keyboard, 
  RotateCcw,
  Moon,
  Sun,
  Volume2,
  VolumeX
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useTheme } from 'next-themes';
import { announce } from '@/utils/a11y';
import { cn } from '@/lib/utils';

interface AccessibilityMenuProps {
  className?: string;
}

export function AccessibilityMenu({ className }: AccessibilityMenuProps) {
  const {
    settings,
    toggleHighContrast,
    toggleReduceMotion,
    toggleLargeText,
    updateSetting,
    resetSettings,
  } = useAccessibility();
  
  const { theme, setTheme } = useTheme();

  const menuItems = [
    {
      icon: Eye,
      label: 'Contraste élevé',
      description: 'Améliore la lisibilité',
      checked: settings.highContrast,
      onToggle: toggleHighContrast,
    },
    {
      icon: Zap,
      label: 'Réduire les animations',
      description: 'Moins de mouvements',
      checked: settings.reduceMotion,
      onToggle: toggleReduceMotion,
    },
    {
      icon: Type,
      label: 'Texte agrandi',
      description: 'Police plus grande',
      checked: settings.largeText,
      onToggle: toggleLargeText,
    },
    {
      icon: Keyboard,
      label: 'Navigation clavier',
      description: 'Focus visible amélioré',
      checked: settings.focusVisible,
      onToggle: () => updateSetting('focusVisible', !settings.focusVisible),
    },
    {
      icon: settings.screenReaderMode ? Volume2 : VolumeX,
      label: 'Mode lecteur d\'écran',
      description: 'Optimisé pour NVDA/JAWS',
      checked: settings.screenReaderMode,
      onToggle: () => updateSetting('screenReaderMode', !settings.screenReaderMode),
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn('relative', className)}
          aria-label="Options d'accessibilité"
        >
          <Accessibility className="h-5 w-5" />
          {(settings.highContrast || settings.reduceMotion || settings.largeText) && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-popover">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Accessibility className="h-4 w-4" />
          Accessibilité
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Theme toggle */}
        <DropdownMenuItem 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => {
            setTheme(theme === 'dark' ? 'light' : 'dark');
            announce(`Thème ${theme === 'dark' ? 'clair' : 'sombre'} activé`);
          }}
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <div>
              <p className="text-sm font-medium">Thème {theme === 'dark' ? 'sombre' : 'clair'}</p>
              <p className="text-xs text-muted-foreground">Basculer le mode d'affichage</p>
            </div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {menuItems.map((item, index) => (
          <DropdownMenuItem 
            key={index}
            className="flex items-center justify-between cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              item.onToggle();
              announce(`${item.label} ${!item.checked ? 'activé' : 'désactivé'}`);
            }}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <Switch 
              checked={item.checked} 
              onCheckedChange={item.onToggle}
              aria-label={item.label}
            />
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="flex items-center gap-3 text-muted-foreground cursor-pointer"
          onClick={resetSettings}
        >
          <RotateCcw className="h-4 w-4" />
          <span>Réinitialiser les paramètres</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
