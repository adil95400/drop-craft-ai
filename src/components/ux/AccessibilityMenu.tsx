import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Accessibility,
  Type,
  Contrast,
  Eye,
  MousePointer,
  Keyboard,
  Volume2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'xlarge'
  highContrast: boolean
  reducedMotion: boolean
  largePointer: boolean
  keyboardNav: boolean
  screenReaderOptimized: boolean
}

export function AccessibilityMenu() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibility-settings')
    return saved ? JSON.parse(saved) : {
      fontSize: 'normal',
      highContrast: false,
      reducedMotion: false,
      largePointer: false,
      keyboardNav: true,
      screenReaderOptimized: false,
    }
  })

  useEffect(() => {
    localStorage.setItem('accessibility-settings', JSON.stringify(settings))
    applySettings()
  }, [settings])

  const applySettings = () => {
    const root = document.documentElement

    // Font size
    root.classList.remove('text-base', 'text-lg', 'text-xl')
    if (settings.fontSize === 'large') root.classList.add('text-lg')
    if (settings.fontSize === 'xlarge') root.classList.add('text-xl')

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // Large pointer
    if (settings.largePointer) {
      root.classList.add('large-pointer')
    } else {
      root.classList.remove('large-pointer')
    }

    // Keyboard navigation
    if (settings.keyboardNav) {
      root.classList.add('keyboard-nav')
    } else {
      root.classList.remove('keyboard-nav')
    }
  }

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    toast({
      title: 'Paramètre d\'accessibilité mis à jour',
      description: getSettingDescription(key),
    })
  }

  const getSettingDescription = (key: keyof AccessibilitySettings): string => {
    const descriptions: Record<keyof AccessibilitySettings, string> = {
      fontSize: 'Taille du texte modifiée',
      highContrast: settings.highContrast ? 'Contraste élevé activé' : 'Contraste élevé désactivé',
      reducedMotion: settings.reducedMotion ? 'Animations réduites' : 'Animations normales',
      largePointer: settings.largePointer ? 'Curseur agrandi' : 'Curseur normal',
      keyboardNav: settings.keyboardNav ? 'Navigation clavier activée' : 'Navigation clavier désactivée',
      screenReaderOptimized: settings.screenReaderOptimized ? 'Optimisé pour lecteur d\'écran' : 'Mode normal',
    }
    return descriptions[key]
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Menu d'accessibilité"
          className="focus-visible-ring"
        >
          <Accessibility className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Accessibility className="h-4 w-4" />
          Accessibilité
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Font Size */}
        <div className="px-2 py-2">
          <div className="flex items-center gap-2 mb-2">
            <Type className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Taille du texte</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={settings.fontSize === 'normal' ? 'default' : 'outline'}
              onClick={() => updateSetting('fontSize', 'normal')}
              className="flex-1"
            >
              Normal
            </Button>
            <Button
              size="sm"
              variant={settings.fontSize === 'large' ? 'default' : 'outline'}
              onClick={() => updateSetting('fontSize', 'large')}
              className="flex-1"
            >
              Grand
            </Button>
            <Button
              size="sm"
              variant={settings.fontSize === 'xlarge' ? 'default' : 'outline'}
              onClick={() => updateSetting('fontSize', 'xlarge')}
              className="flex-1"
            >
              Très grand
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Toggle Options */}
        <DropdownMenuCheckboxItem
          checked={settings.highContrast}
          onCheckedChange={(checked) => updateSetting('highContrast', checked)}
        >
          <Contrast className="h-4 w-4 mr-2" />
          Contraste élevé
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={settings.reducedMotion}
          onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
        >
          <Eye className="h-4 w-4 mr-2" />
          Réduire les animations
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={settings.largePointer}
          onCheckedChange={(checked) => updateSetting('largePointer', checked)}
        >
          <MousePointer className="h-4 w-4 mr-2" />
          Curseur agrandi
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={settings.keyboardNav}
          onCheckedChange={(checked) => updateSetting('keyboardNav', checked)}
        >
          <Keyboard className="h-4 w-4 mr-2" />
          Navigation clavier
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          checked={settings.screenReaderOptimized}
          onCheckedChange={(checked) => updateSetting('screenReaderOptimized', checked)}
        >
          <Volume2 className="h-4 w-4 mr-2" />
          Lecteur d'écran
        </DropdownMenuCheckboxItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            setSettings({
              fontSize: 'normal',
              highContrast: false,
              reducedMotion: false,
              largePointer: false,
              keyboardNav: true,
              screenReaderOptimized: false,
            })
            toast({
              title: 'Paramètres réinitialisés',
              description: 'Les paramètres d\'accessibilité ont été réinitialisés',
            })
          }}
        >
          Réinitialiser
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}