/**
 * CatalogRoutes - Routes du groupe Catalogue
 * Hub d'exécution produit avec 7 modules
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy loading des pages Catalogue
const ToProcessPage = lazy(() => import('@/pages/catalog/ToProcessPage'));
const VariantsPage = lazy(() => import('@/pages/catalog/VariantsPage'));
const MediaPage = lazy(() => import('@/pages/catalog/MediaPage'));
const AttributesPage = lazy(() => import('@/pages/catalog/AttributesPage'));
const CategoriesBrandsPage = lazy(() => import('@/pages/catalog/CategoriesBrandsPage'));
const CatalogHealthPage = lazy(() => import('@/pages/catalog/CatalogHealthPage'));
const ImageDeduplicationPage = lazy(() => import('@/pages/catalog/ImageDeduplicationPage'));

// Composant de chargement
const CatalogLoadingSkeleton = () => (
  <div className="space-y-4 p-6">
    <Skeleton className="h-8 w-[250px]" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-[400px] rounded-xl" />
  </div>
);

export function CatalogRoutes() {
  return (
    <Suspense fallback={<CatalogLoadingSkeleton />}>
      <Routes>
        {/* Redirection par défaut vers À traiter */}
        <Route index element={<Navigate to="/catalog/to-process" replace />} />
        
        {/* Modules du Catalogue */}
        <Route path="to-process" element={<ToProcessPage />} />
        <Route path="variants" element={<VariantsPage />} />
        <Route path="media" element={<MediaPage />} />
        <Route path="attributes" element={<AttributesPage />} />
        <Route path="categories-brands" element={<CategoriesBrandsPage />} />
        <Route path="health" element={<CatalogHealthPage />} />
        <Route path="image-dedup" element={<ImageDeduplicationPage />} />
        <Route path="image-deduplication" element={<ImageDeduplicationPage />} />
        
        {/* Redirections legacy */}
        <Route path="*" element={<Navigate to="/catalog/to-process" replace />} />
      </Routes>
    </Suspense>
  );
}

export default CatalogRoutes;
