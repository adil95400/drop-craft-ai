import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Sun, Moon } from 'lucide-react';

export function ThemeScheduleSettings() {
  const { autoThemeSchedule, setAutoThemeSchedule, theme } = useUserPreferencesStore();

  if (theme !== 'auto') {
    return null;
  }

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-500" />
          Planning du mode automatique
        </CardTitle>
        <CardDescription>
          Personnalisez les heures de transition entre le mode clair et sombre
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="light-start" className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            Début du mode clair
          </Label>
          <Input
            id="light-start"
            type="time"
            value={autoThemeSchedule.lightModeStart}
            onChange={(e) =>
              setAutoThemeSchedule({
                ...autoThemeSchedule,
                lightModeStart: e.target.value,
              })
            }
            className="max-w-[200px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dark-start" className="flex items-center gap-2">
            <Moon className="w-4 h-4 text-blue-400" />
            Début du mode sombre
          </Label>
          <Input
            id="dark-start"
            type="time"
            value={autoThemeSchedule.darkModeStart}
            onChange={(e) =>
              setAutoThemeSchedule({
                ...autoThemeSchedule,
                darkModeStart: e.target.value,
              })
            }
            className="max-w-[200px]"
          />
        </div>

        <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
          <p>
            Le thème changera automatiquement à <strong>{autoThemeSchedule.lightModeStart}</strong> (mode clair) 
            et <strong>{autoThemeSchedule.darkModeStart}</strong> (mode sombre)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
