/**
 * @module format
 * @description Locale-aware format utilities for consistent data display.
 * Uses the current i18next language to determine number/date formatting.
 */
import { getIntlLocale } from '@/utils/dateFnsLocale';

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(getIntlLocale()).format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getIntlLocale();
  
  if (format === 'long') {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(dateObj);
  }
  
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
  }).format(dateObj);
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const rtf = new Intl.RelativeTimeFormat(getIntlLocale(), { numeric: 'auto' });

  if (diffSecs < 60) return rtf.format(0, 'second'); // "just now" / "maintenant"
  if (diffMins < 60) return rtf.format(-diffMins, 'minute');
  if (diffHours < 24) return rtf.format(-diffHours, 'hour');
  if (diffDays < 7) return rtf.format(-diffDays, 'day');
  
  return formatDate(dateObj);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
