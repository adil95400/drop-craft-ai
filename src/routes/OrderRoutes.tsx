/**
 * Routes Orders - Gestion des commandes
 * URL uniformisées: /orders au lieu de /dashboard/orders
 */
/**
 * Routes Orders - Gestion des commandes et fulfillment
 * URL uniformisées: /orders, /orders/fulfillment/*
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react';

const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const OrderDetail = lazy(() => import('@/pages/orders/OrderDetail'));
const OrdersCenterPage = lazy(() => import('@/pages/OrdersCenterPage'));
const ReturnsManagementPage = lazy(() => import('@/pages/orders/ReturnsManagementPage'));
const TrackingDashboardPage = lazy(() => import('@/pages/orders/TrackingDashboardPage'));
const CustomerNotificationsPage = lazy(() => import('@/pages/orders/CustomerNotificationsPage'));
const BulkOrdersPage = lazy(() => import('@/pages/orders/BulkOrdersPage'));
const CreateOrder = lazy(() => import('@/pages/orders/CreateOrder'));

// Fulfillment pages (sous-module de orders)
const FulfillmentPage = lazy(() => import('@/pages/fulfillment/FulfillmentPage'));
const CarriersManagementPage = lazy(() => import('@/pages/CarriersManagementPage'));
const FulfillmentRulesPage = lazy(() => import('@/pages/FulfillmentRulesPage'));

export function OrderRoutes() {
  return (
    <Routes>
      <Route index element={<OrdersPage />} />
      <Route path=":id" element={<OrderDetail />} />
      <Route path="center" element={<OrdersCenterPage />} />
      <Route path="returns" element={<ReturnsManagementPage />} />
      <Route path="tracking" element={<TrackingDashboardPage />} />
      <Route path="notifications" element={<CustomerNotificationsPage />} />
      <Route path="bulk" element={<BulkOrdersPage />} />
      <Route path="create" element={<CreateOrder />} />
      
      {/* Fulfillment - Sous-module de Commandes */}
      <Route path="fulfillment" element={<FulfillmentPage />} />
      <Route path="fulfillment/carriers" element={<CarriersManagementPage />} />
      <Route path="fulfillment/rules" element={<FulfillmentRulesPage />} />
      
      {/* Redirection legacy */}
      <Route path="shipping" element={<Navigate to="/orders/fulfillment" replace />} />
    </Routes>
  );
}
