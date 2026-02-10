import React from 'react';
import { Helmet } from 'react-helmet-async';
import { CustomerSegmentationDashboard } from '@/components/customer-segmentation';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Users } from 'lucide-react';

export default function CustomerSegmentationPage() {
  return (
    <>
      <Helmet>
        <title>Segmentation Clients | DropShipper</title>
        <meta name="description" content="Segmentez vos clients pour des campagnes ciblées" />
      </Helmet>
      
      <ChannablePageWrapper
        title="Segmentation Clients"
        description="Analysez et segmentez vos clients avec l'analyse RFM"
        heroImage="marketing"
        badge={{ label: 'Segmentation', icon: Users }}
      >
        <CustomerSegmentationDashboard />
      </ChannablePageWrapper>
    </>
  );
}
