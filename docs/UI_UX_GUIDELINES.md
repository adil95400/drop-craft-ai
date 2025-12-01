# ShopOpti UI/UX Guidelines

## Design Principles

### 1. Consistency First
- Use semantic tokens from `index.css` and `tailwind.config.ts`
- Never use direct colors (e.g., `text-white`, `bg-black`)
- Always use design system tokens (`bg-background`, `text-foreground`, etc.)

### 2. Mobile-First Approach
- Design for mobile first, then scale up
- Use responsive containers and breakpoints
- Test all features on mobile devices

### 3. Loading & Error States
- Always show loading spinners during async operations
- Implement proper error boundaries
- Provide meaningful error messages

### 4. User Feedback
- Use toast notifications for actions
- Show progress indicators for long operations
- Provide success/error feedback immediately

## Component Standards

### Page Structure
```tsx
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { PageHeader } from '@/components/layout/PageHeader';

const MyPage = () => {
  return (
    <ErrorBoundary>
      <ResponsiveContainer>
        <PageHeader
          title="Page Title"
          description="Page description"
          actions={<Button>Action</Button>}
        />
        {/* Page content */}
      </ResponsiveContainer>
    </ErrorBoundary>
  );
};
```

### Loading States
```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner';

if (isLoading) {
  return <LoadingSpinner size="lg" text="Loading data..." />;
}
```

### Empty States
```tsx
import { EmptyState } from '@/components/ui/empty-state';
import { Package } from 'lucide-react';

if (items.length === 0) {
  return (
    <EmptyState
      icon={Package}
      title="No products found"
      description="Start by adding your first product"
      action={{
        label: "Add Product",
        onClick: () => navigate('/products/create')
      }}
    />
  );
}
```

### Error Handling
```tsx
import { ErrorBoundary } from '@/components/ui/error-boundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### Toast Notifications
```tsx
import { toast } from '@/hooks/use-toast';

toast({
  title: 'Success',
  description: 'Product created successfully',
});

toast({
  title: 'Error',
  description: 'Failed to create product',
  variant: 'destructive',
});
```

## Formatting Utilities

### Currency
```tsx
import { formatCurrency } from '@/utils/format';

<span>{formatCurrency(1234.56, 'EUR')}</span>
// Output: 1 234,56 €
```

### Numbers
```tsx
import { formatNumber, formatPercentage } from '@/utils/format';

<span>{formatNumber(1234567)}</span>
// Output: 1 234 567

<span>{formatPercentage(12.345)}</span>
// Output: 12.3%
```

### Dates
```tsx
import { formatDate, formatRelativeTime } from '@/utils/format';

<span>{formatDate(new Date(), 'long')}</span>
// Output: 1 décembre 2025, 17:30

<span>{formatRelativeTime(order.created_at)}</span>
// Output: Il y a 2h
```

## Validation Utilities

```tsx
import { isValidEmail, validateRequired } from '@/utils/validation';

const error = validateRequired(value, 'Product name');
if (error) {
  toast({ title: 'Error', description: error, variant: 'destructive' });
  return;
}
```

## Responsive Design

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Grid Layouts
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</div>
```

### Flex Layouts
```tsx
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
  <div>Title</div>
  <div>Actions</div>
</div>
```

## Color Semantic Tokens

### Primary Colors
- `bg-background` - Main background
- `bg-foreground` - Text on background
- `bg-primary` - Primary brand color
- `bg-primary-foreground` - Text on primary
- `bg-secondary` - Secondary surface
- `bg-accent` - Accent highlights

### Status Colors
- `bg-muted` / `text-muted-foreground` - Disabled/inactive
- `bg-destructive` / `text-destructive` - Errors/delete actions
- Success: Use `text-green-600`
- Warning: Use `text-yellow-600`

## Accessibility

### Keyboard Navigation
- Ensure all interactive elements are keyboard accessible
- Use proper ARIA labels
- Test with tab navigation

### Screen Readers
- Use semantic HTML elements
- Provide alt text for images
- Use descriptive button labels

### Color Contrast
- Maintain WCAG AA compliance
- Test with color blindness simulators
- Don't rely solely on color to convey information

## Performance

### Lazy Loading
- Use React.lazy() for route-based code splitting
- Implement virtualization for long lists
- Lazy load images with native loading="lazy"

### Memoization
- Use React.memo() for expensive components
- Use useMemo() and useCallback() appropriately
- Avoid unnecessary re-renders

## Testing Checklist

- [ ] Mobile responsive on all screen sizes
- [ ] Loading states displayed correctly
- [ ] Error states handled gracefully
- [ ] Empty states shown when appropriate
- [ ] Toast notifications work
- [ ] Keyboard navigation functional
- [ ] Color contrast meets WCAG AA
- [ ] All buttons have clear labels
- [ ] Forms validate properly
- [ ] Data formats consistently
