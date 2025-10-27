import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Optimized image component with lazy loading, WebP support, and blur placeholder
 * Features:
 * - Lazy loading with Intersection Observer
 * - WebP format with fallback
 * - Blur placeholder while loading
 * - Error handling with fallback image
 * - Responsive sizing
 */
export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  objectFit = 'cover',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate WebP source if possible
  const getWebPSrc = (originalSrc: string): string => {
    // If already WebP or SVG, return as is
    if (originalSrc.endsWith('.webp') || originalSrc.endsWith('.svg')) {
      return originalSrc;
    }
    
    // For external URLs, check if CDN supports WebP conversion
    if (originalSrc.startsWith('http')) {
      // Example: Cloudinary, Imgix support format conversion via URL params
      if (originalSrc.includes('cloudinary.com')) {
        return originalSrc.replace(/\.(jpg|jpeg|png)/, '.webp');
      }
    }
    
    return originalSrc;
  };

  // Fallback image for errors
  const fallbackSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23999" x="50" y="50" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';

  const imageSrc = hasError ? fallbackSrc : src;
  const webpSrc = hasError ? fallbackSrc : getWebPSrc(src);

  return (
    <picture
      ref={imgRef}
      className={cn('block overflow-hidden', className)}
      style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
    >
      {/* WebP source for modern browsers */}
      {!hasError && isInView && (
        <source srcSet={webpSrc} type="image/webp" />
      )}
      
      {/* Fallback image */}
      <img
        src={isInView ? imageSrc : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          'w-full h-full',
          `object-${objectFit}`
        )}
        style={{
          // Blur placeholder while loading
          filter: isLoaded ? 'none' : 'blur(10px)',
          transform: isLoaded ? 'scale(1)' : 'scale(1.1)',
        }}
      />
      
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-muted animate-pulse"
          aria-hidden="true"
        />
      )}
    </picture>
  );
}
