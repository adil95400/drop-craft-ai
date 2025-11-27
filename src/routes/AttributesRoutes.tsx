/**
 * Routes pour le module de gestion des attributs IA
 */
import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const AttributesManager = lazy(() => import('@/pages/attributes/AttributesManager'));

export function AttributesRoutes() {
  return (
    <Routes>
      <Route path="manager" element={<AttributesManager />} />
    </Routes>
  );
}