/**
 * Routes pour le module de génération de contenu IA
 */
import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const ContentGenerator = lazy(() => import('@/pages/rewrite/ContentGenerator'));

export function RewriteRoutes() {
  return (
    <Routes>
      <Route path="generator" element={<ContentGenerator />} />
    </Routes>
  );
}