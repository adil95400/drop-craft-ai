import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { CatalogDashboard } from '@/components/catalog/CatalogDashboard'
import { AdvancedProductCatalog } from '@/components/catalog/AdvancedProductCatalog'
import { SupplierManagement } from '@/components/catalog/SupplierManagement'

export default function CatalogPage() {
  return (
    <Routes>
      <Route index element={<CatalogDashboard />} />
      <Route path="products" element={<AdvancedProductCatalog />} />
      <Route path="products-ultra" element={<AdvancedProductCatalog />} />
      <Route path="browse" element={<AdvancedProductCatalog />} />
      <Route path="suppliers" element={<SupplierManagement />} />
      <Route path="suppliers-pro" element={<SupplierManagement />} />
      <Route path="*" element={<Navigate to="/catalog" replace />} />
    </Routes>
  )
}