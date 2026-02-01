/**
 * XSS Protected Content Components
 * Safe components for rendering user-generated content
 */

import React, { useMemo } from 'react';
import { sanitizeHTML, sanitizeRichHTML, stripHTML, encodeHTMLEntities } from '@/lib/xss-protection';
import { cn } from '@/lib/utils';

interface SafeHTMLProps {
  html: string;
  className?: string;
  allowRichContent?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Safely render HTML content with XSS protection
 */
export const SafeHTML: React.FC<SafeHTMLProps> = ({
  html,
  className,
  allowRichContent = false,
  as: Component = 'div',
}) => {
  const sanitizedHTML = useMemo(() => {
    if (!html) return '';
    return allowRichContent ? sanitizeRichHTML(html) : sanitizeHTML(html);
  }, [html, allowRichContent]);

  return (
    <Component
      className={cn('prose prose-sm max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
};

interface SafeTextProps {
  text: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  maxLength?: number;
}

/**
 * Safely render text content (no HTML)
 */
export const SafeText: React.FC<SafeTextProps> = ({
  text,
  className,
  as: Component = 'span',
  maxLength,
}) => {
  const safeText = useMemo(() => {
    if (!text) return '';
    let cleaned = stripHTML(text);
    if (maxLength && cleaned.length > maxLength) {
      cleaned = cleaned.slice(0, maxLength) + '...';
    }
    return cleaned;
  }, [text, maxLength]);

  return <Component className={className}>{safeText}</Component>;
};

interface SafeLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}

/**
 * Safe link component with URL validation
 */
export const SafeLink: React.FC<SafeLinkProps> = ({
  href,
  children,
  className,
  external = false,
}) => {
  const safeHref = useMemo(() => {
    if (!href) return '#';
    
    const lower = href.toLowerCase().trim();
    
    // Block dangerous protocols
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:')
    ) {
      return '#';
    }
    
    return href;
  }, [href]);

  const linkProps = external
    ? {
        target: '_blank',
        rel: 'noopener noreferrer nofollow',
      }
    : {};

  return (
    <a href={safeHref} className={className} {...linkProps}>
      {children}
    </a>
  );
};

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}

/**
 * Safe image component with URL validation
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className,
  fallback = '/placeholder.svg',
}) => {
  const safeSrc = useMemo(() => {
    if (!src) return fallback;
    
    const lower = src.toLowerCase().trim();
    
    // Only allow http, https, data (for base64 images), and relative paths
    if (
      lower.startsWith('http://') ||
      lower.startsWith('https://') ||
      lower.startsWith('data:image/') ||
      lower.startsWith('/')
    ) {
      return src;
    }
    
    return fallback;
  }, [src, fallback]);

  const safeAlt = useMemo(() => stripHTML(alt || ''), [alt]);

  return (
    <img
      src={safeSrc}
      alt={safeAlt}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallback;
      }}
      loading="lazy"
    />
  );
};

interface PreformattedCodeProps {
  code: string;
  language?: string;
  className?: string;
}

/**
 * Safely display code content
 */
export const PreformattedCode: React.FC<PreformattedCodeProps> = ({
  code,
  language,
  className,
}) => {
  const encodedCode = useMemo(() => encodeHTMLEntities(code || ''), [code]);

  return (
    <pre className={cn('bg-muted p-4 rounded-lg overflow-x-auto', className)}>
      <code className={language ? `language-${language}` : undefined}>
        {encodedCode}
      </code>
    </pre>
  );
};

interface UserContentWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper for user-generated content sections
 * Adds visual indicator and isolation
 */
export const UserContentWrapper: React.FC<UserContentWrapperProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative border-l-2 border-muted-foreground/20 pl-4',
        'before:content-[""] before:absolute before:top-0 before:left-0',
        className
      )}
      role="region"
      aria-label="Contenu utilisateur"
    >
      {children}
    </div>
  );
};

export default SafeHTML;
