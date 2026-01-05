import React from 'react';
import { Helmet } from 'react-helmet-async';
import { CustomerSegmentationDashboard } from '@/components/customer-segmentation';

export default function CustomerSegmentationPage() {
  return (
    <>
      <Helmet>
        <title>Segmentation Clients | DropShipper</title>
        <meta name="description" content="Segmentez vos clients pour des campagnes ciblées" />
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Segmentation Clients</h1>
          <p className="text-muted-foreground">
            Analysez et segmentez vos clients avec l'analyse RFM
          </p>
        </div>

        <CustomerSegmentationDashboard />
      </div>
    </>
  );
}
