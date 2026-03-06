

# Performance & Bundle Optimization Plan

## Current State

After analyzing the codebase, the main performance bottlenecks are:

1. **framer-motion imported in 322 files** — even though it's in `vendor-heavy` chunk, it gets pulled into the initial load because the dashboard (ChannableDashboard) and many core components import it directly
2. **ChannableLayout eagerly imports** `DiagnosticWidget` and `OnboardingModal` on every protected page load
3. **cdn.tailwindcss.com loaded at runtime** (visible in console logs) — this is a massive script meant only for dev, adds ~300KB+
4. **main.tsx synchronously imports** Sentry, PWAService, consoleInterceptor, and CookieBanner before any rendering
5. **No route prefetching** — navigation between modules triggers full chunk loads with no preloading
6. **Radix UI in a single mega-chunk** (`vendor-ui`) — all Radix components bundled together even if only a few are used on a given page

## Plan

### 1. Remove cdn.tailwindcss.com (Critical — immediate perf win)
Search for any `<script>` tag loading `cdn.tailwindcss.com` in the codebase (likely in index.html or a component). Remove it — Tailwind is already compiled via PostCSS/Vite. This alone could save 300KB+ on every page load.

### 2. Defer main.tsx initialization
Move Sentry, PWAService, and consoleInterceptor to async initialization after first render:
```typescript
// Defer non-critical initialization
requestIdleCallback(() => {
  initSentry();
  PWAService.init();
  installConsoleInterceptor();
});
```
Lazy-load `CookieBanner` instead of importing it at top level.

### 3. Lazy-load ChannableLayout heavy children
In `ChannableLayout.tsx`, lazy-load `DiagnosticWidget` and `OnboardingModal` — these are not needed for initial page render:
```typescript
const DiagnosticWidget = lazy(() => import('@/components/support/DiagnosticWidget'));
const OnboardingModal = lazy(() => import('@/components/onboarding/UnifiedOnboarding'));
```

### 4. Add route prefetching on hover/focus
Create a `usePrefetchRoute` hook that triggers `import()` when sidebar links are hovered, so chunks load before navigation:
```typescript
const prefetchMap = {
  '/products': () => import('@/routes/ProductRoutes'),
  '/orders': () => import('@/routes/OrderRoutes'),
  // etc.
};
```
Integrate into sidebar navigation items with `onMouseEnter`.

### 5. Split vendor-heavy chunk
The current `vendor-heavy` groups framer-motion + i18next + Sentry together. Split them:
- `vendor-animation` — framer-motion (loaded only when animated pages are visited)
- `vendor-i18n` — i18next (defer until first translation needed)  
- `vendor-monitoring` — Sentry (load after first render)

### 6. Optimize framer-motion imports
In the 322 files using framer-motion, many only need `motion.div`. Use the lighter `m` import with `LazyMotion` + `domAnimation` feature bundle to reduce the framer-motion footprint by ~60%:
```typescript
import { LazyMotion, domAnimation, m } from 'framer-motion';
// Wrap app section with <LazyMotion features={domAnimation}>
// Replace <motion.div> with <m.div>
```

### 7. Implement dynamic imports for dashboard widgets
The dashboard loads all widget components eagerly. Wrap each widget card in a lazy boundary so only visible widgets load.

## Expected Impact

| Optimization | Estimated Savings |
|---|---|
| Remove cdn.tailwindcss.com | ~300KB |
| Defer Sentry/PWA init | ~150ms TTI |
| Split vendor-heavy | ~80KB initial |
| LazyMotion | ~40KB per page |
| Route prefetching | Perceived 0ms navigation |
| Lazy layout widgets | ~50KB initial |

**Total estimated reduction**: ~400-500KB initial bundle, ~200ms faster TTI

## Implementation Order
1. Remove cdn.tailwindcss.com (5 min, biggest win)
2. Defer main.tsx initialization (15 min)
3. Lazy-load ChannableLayout widgets (10 min)
4. Split vendor chunks in vite.config.ts (10 min)
5. Add route prefetching hook + sidebar integration (30 min)
6. LazyMotion migration for top-used components (45 min)

