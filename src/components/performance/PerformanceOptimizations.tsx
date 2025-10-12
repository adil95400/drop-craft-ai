import { memo, lazy, Suspense, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy loading wrapper component
export const LazyLoadWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  }>
    {children}
  </Suspense>
);

// Memoized list item to prevent unnecessary re-renders
export const MemoizedListItem = memo(({ item, onAction }: any) => (
  <div className="p-4 border rounded-lg">
    <h3 className="font-semibold">{item.name}</h3>
    <p className="text-sm text-muted-foreground">{item.description}</p>
    <button onClick={() => onAction(item.id)} className="mt-2 text-primary">
      Action
    </button>
  </div>
));

MemoizedListItem.displayName = 'MemoizedListItem';

// Virtual scroll container for large lists
export const VirtualScrollContainer = ({ items, renderItem, itemHeight = 80 }: any) => {
  // This is a simplified version - in production use react-window or react-virtual
  return (
    <div className="overflow-y-auto max-h-[600px]">
      {items.map((item: any, index: number) => (
        <div key={item.id || index} style={{ minHeight: itemHeight }}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
};

// Image lazy loading with intersection observer
export const LazyImage = memo(({ src, alt, className }: any) => {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
    />
  );
});

LazyImage.displayName = 'LazyImage';

// Debounce hook for search inputs
export const useDebounce = (value: any, delay: number = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
