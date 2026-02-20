/**
 * Routes Orders - Gestion des commandes et fulfillment
 * Consolidé - Suppression des pages dupliquées
 * URL uniformisées: /orders, /orders/fulfillment/*
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

// Orders - Consolidated to OrdersCenterPage
const OrdersCenterPage = lazy(() => import('@/pages/orders/OrdersCenterPage'));
const OrderDetail = lazy(() => import('@/pages/orders/OrderDetail'));
const BulkOrdersPage = lazy(() => import('@/pages/orders/BulkOrdersPage'));
const CreateOrder = lazy(() => import('@/pages/orders/CreateOrder'));

// Fulfillment - Consolidated to single page with tabs
const FulfillmentPage = lazy(() => import('@/pages/fulfillment/FulfillmentPage'));

export function OrderRoutes() {
  return (
    <Routes>
      <Route index element={<OrdersCenterPage />} />
      <Route path=":id" element={<OrderDetail />} />
      <Route path="center" element={<Navigate to="/orders" replace />} />
      <Route path="returns" element={<Navigate to="/orders/fulfillment?tab=returns" replace />} />
      <Route path="tracking" element={<Navigate to="/orders/fulfillment?tab=tracking" replace />} />
      <Route path="notifications" element={<Navigate to="/orders/fulfillment?tab=notifications" replace />} />
      <Route path="bulk" element={<BulkOrdersPage />} />
      <Route path="create" element={<CreateOrder />} />
      
      {/* Fulfillment - Sous-module de Commandes */}
      <Route path="fulfillment" element={<FulfillmentPage />} />
      <Route path="fulfillment/carriers" element={<Navigate to="/orders/fulfillment?tab=carriers" replace />} />
      <Route path="fulfillment/rules" element={<Navigate to="/orders/fulfillment?tab=automation" replace />} />
      
      {/* Redirections legacy */}
      <Route path="shipping" element={<Navigate to="/orders/fulfillment" replace />} />
      <Route path="exécution" element={<Navigate to="/orders/fulfillment" replace />} />
      <Route path="execution" element={<Navigate to="/orders/fulfillment" replace />} />
    </Routes>
  );
}
