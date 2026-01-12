/**
 * Routes Customers - Gestion des clients
 * URL uniformisées: /customers au lieu de /dashboard/customers
 */
import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

const CustomersPage = lazy(() => import('@/pages/CustomersPage'));
const CustomerSegmentationPage = lazy(() => import('@/pages/customers/CustomerSegmentationPage'));
const CreateCustomer = lazy(() => import('@/pages/customers/CreateCustomer'));

export function CustomerRoutes() {
  return (
    <Routes>
      <Route index element={<CustomersPage />} />
      <Route path="segmentation" element={<CustomerSegmentationPage />} />
      <Route path="create" element={<CreateCustomer />} />
    </Routes>
  );
}
