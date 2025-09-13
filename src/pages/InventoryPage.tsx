import React from 'react';
import { Helmet } from 'react-helmet-async';
import { InventoryDashboard } from '@/components/inventory/InventoryDashboard';

export default function InventoryPage() {
  return (
    <>
      <Helmet>
        <title>Gestion des Stocks - Inventaire</title>
        <meta name="description" content="Gérez efficacement vos stocks, suivez les niveaux d'inventaire et optimisez votre chaîne d'approvisionnement" />
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Gestion des Stocks</h1>
          <p className="text-muted-foreground">
            Surveillez et gérez vos niveaux de stock en temps réel
          </p>
        </div>
        
        <InventoryDashboard />
      </div>
    </>
  );
}