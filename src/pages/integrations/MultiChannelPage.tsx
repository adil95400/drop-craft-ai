import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiChannelDashboard, ChannelFeedManager } from '@/components/multi-channel';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Layers } from 'lucide-react';

export default function MultiChannelPage() {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <>
      <Helmet>
        <title>Multi-Canal | DropShipper</title>
        <meta name="description" content="Synchronisez vos produits sur plusieurs canaux de vente" />
      </Helmet>
      
      <ChannablePageWrapper
        title="Gestion Multi-Canal"
        description="Synchronisez vos produits et commandes sur tous vos canaux de vente"
        heroImage="integrations"
        badge={{ label: 'Multi-Canal', icon: Layers }}
      >
        <Tabs value={activeView} onValueChange={setActiveView}>
          <TabsList>
            <TabsTrigger value="dashboard">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="feed-manager">Gestionnaire de Feeds</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <MultiChannelDashboard />
          </TabsContent>

          <TabsContent value="feed-manager">
            <ChannelFeedManager />
          </TabsContent>
        </Tabs>
      </ChannablePageWrapper>
    </>
  );
}
