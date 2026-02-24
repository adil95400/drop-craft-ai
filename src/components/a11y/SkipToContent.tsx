/**
 * SkipToContent — Accessibility skip link for keyboard users (WCAG 2.1 AA)
 */
import { useTranslation } from 'react-i18next';

export function SkipToContent() {
  const { t } = useTranslation('common');
  
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {t('skipToContent')}
    </a>
  )
}