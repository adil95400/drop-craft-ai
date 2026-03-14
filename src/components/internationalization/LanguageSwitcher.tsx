/**
 * LanguageSwitcher - Compact language selector for navbar/header
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const POPULAR_LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const currentLang = POPULAR_LANGUAGES.find(l => l.code === i18n.language) || POPULAR_LANGUAGES[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    document.documentElement.lang = code;
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? 'icon' : 'sm'} className="gap-1.5">
          <span className="text-base">{currentLang.flag}</span>
          {!compact && <span className="text-xs">{currentLang.code.toUpperCase()}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          <Globe className="h-3 w-3 inline mr-1" />Langue
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {POPULAR_LANGUAGES.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={lang.code === i18n.language ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {lang.code === i18n.language && <span className="text-primary text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
