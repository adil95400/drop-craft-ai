/**
 * Routes pour le module d'audit intelligent des produits
 */
import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const AuditDashboard = lazy(() => import('@/pages/audit/AuditDashboard'));
const AuditProductsList = lazy(() => import('@/pages/audit/AuditProductsList'));
const BatchAudit = lazy(() => import('@/pages/audit/BatchAudit'));
const AuditScoringPage = lazy(() => import('@/pages/audit/AuditScoringPage'));
const AuditSEOPage = lazy(() => import('@/pages/audit/AuditSEOPage'));
const AuditFeedPage = lazy(() => import('@/pages/audit/AuditFeedPage'));

export function AuditRoutes() {
  return (
    <Routes>
      <Route index element={<AuditDashboard />} />
      <Route path="products" element={<AuditProductsList />} />
      <Route path="batch" element={<BatchAudit />} />
      <Route path="scoring" element={<AuditScoringPage />} />
      <Route path="seo" element={<AuditSEOPage />} />
      <Route path="feed" element={<AuditFeedPage />} />
    </Routes>
  );
}