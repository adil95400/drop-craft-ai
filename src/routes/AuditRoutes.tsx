/**
 * Routes pour le module d'audit intelligent des produits
 */
import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const AuditDashboard = lazy(() => import('@/pages/audit/AuditDashboard'));
const AuditProductsList = lazy(() => import('@/pages/audit/AuditProductsList'));
const BatchAudit = lazy(() => import('@/pages/audit/BatchAudit'));

export function AuditRoutes() {
  return (
    <Routes>
      <Route index element={<AuditDashboard />} />
      <Route path="products" element={<AuditProductsList />} />
      <Route path="batch" element={<BatchAudit />} />
    </Routes>
  );
}