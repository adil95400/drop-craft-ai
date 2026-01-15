import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Palette, Sun, Moon, Monitor, Languages } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { useUserPreferences } from "@/stores/globalStore";

const themes = [
  { value: 'light', label: 'Clair', icon: Sun, color: 'bg-yellow-100 border-yellow-300' },
  { value: 'dark', label: 'Sombre', icon: Moon, color: 'bg-slate-800 border-slate-600' },
  { value: 'system', label: 'Système', icon: Monitor, color: 'bg-gradient-to-r from-yellow-100 to-slate-800' },
];

const languages = [
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

export function AppearanceTab() {
  const { t } = useTranslation(['settings']);
  const { setTheme } = useTheme();
  const {
    theme: storeTheme,
    language: storeLanguage,
    sidebarCollapsed,
    notifications: storeNotifications,
    updateTheme,
    updateLanguage,
    updateNotifications,
    toggleSidebar
  } = useUserPreferences();

  const [compactMode, setCompactMode] = useState(sidebarCollapsed);
  const [animations, setAnimations] = useState(true);
  const [sounds, setSounds] = useState(storeNotifications.desktop);

  useEffect(() => {
    setCompactMode(sidebarCollapsed);
    setSounds(storeNotifications.desktop);
  }, [sidebarCollapsed, storeNotifications.desktop]);

  const handleThemeChange = (newTheme: string) => {
    updateTheme(newTheme as any);
    setTheme(newTheme);
  };

  const handleLanguageChange = (newLanguage: string) => {
    updateLanguage(newLanguage as any);
    i18n.changeLanguage(newLanguage);
    const lang = languages.find(l => l.value === newLanguage);
    toast.success(`Langue changée: ${lang?.label}`);
  };

  const handleSave = () => {
    updateNotifications({ desktop: sounds });
    if (compactMode !== sidebarCollapsed) {
      toggleSidebar();
    }
    toast.success('Préférences d\'apparence sauvegardées');
  };

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="h-4 w-4 text-primary" />
            </div>
            Apparence
          </CardTitle>
          <CardDescription>Personnalisez l'interface selon vos préférences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Cards */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Thème</Label>
            <div className="grid grid-cols-3 gap-3">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${
                    storeTheme === value 
                      ? 'border-primary bg-primary/10 shadow-lg' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                      storeTheme === value ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      <Icon className={`h-6 w-6 ${storeTheme === value ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <span className={`text-sm font-medium ${storeTheme === value ? 'text-primary' : ''}`}>
                      {label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Language Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Langue
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {languages.map(({ value, label, flag }) => (
                <button
                  key={value}
                  onClick={() => handleLanguageChange(value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    storeLanguage === value 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-xl">{flag}</span>
                    <span className={`text-sm font-medium ${storeLanguage === value ? 'text-primary' : ''}`}>
                      {label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card className="border-border bg-card shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Paramètres d'affichage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
              <div>
                <div className="font-medium">Mode compact</div>
                <div className="text-sm text-muted-foreground">Réduire l'espacement de l'interface</div>
              </div>
              <Switch 
                checked={compactMode}
                onCheckedChange={setCompactMode}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
              <div>
                <div className="font-medium">Animations</div>
                <div className="text-sm text-muted-foreground">Activer les transitions animées</div>
              </div>
              <Switch 
                checked={animations}
                onCheckedChange={setAnimations}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
              <div>
                <div className="font-medium">Sons système</div>
                <div className="text-sm text-muted-foreground">Sons pour les notifications</div>
              </div>
              <Switch 
                checked={sounds}
                onCheckedChange={setSounds}
              />
            </div>
          </div>

          <Button onClick={handleSave} className="w-full sm:w-auto">
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder l'Apparence
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
