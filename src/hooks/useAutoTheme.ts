import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';

export function useAutoTheme() {
  const { theme: preferredTheme, autoThemeSchedule } = useUserPreferencesStore();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (preferredTheme !== 'auto') return;

    const checkAndUpdateTheme = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const [lightHour, lightMinute] = autoThemeSchedule.lightModeStart.split(':').map(Number);
      const [darkHour, darkMinute] = autoThemeSchedule.darkModeStart.split(':').map(Number);
      
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const lightMinutes = lightHour * 60 + lightMinute;
      const darkMinutes = darkHour * 60 + darkMinute;

      let shouldBeDark: boolean;
      
      if (lightMinutes < darkMinutes) {
        // Normal case: light during day, dark at night
        shouldBeDark = currentMinutes < lightMinutes || currentMinutes >= darkMinutes;
      } else {
        // Edge case: schedule crosses midnight
        shouldBeDark = currentMinutes >= darkMinutes && currentMinutes < lightMinutes;
      }

      setTheme(shouldBeDark ? 'dark' : 'light');
    };

    // Check immediately
    checkAndUpdateTheme();

    // Check every minute
    const interval = setInterval(checkAndUpdateTheme, 60000);

    return () => clearInterval(interval);
  }, [preferredTheme, autoThemeSchedule, setTheme]);
}
