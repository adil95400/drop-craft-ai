import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiChannelDashboard, ChannelFeedManager } from '@/components/multi-channel';

export default function MultiChannelPage() {
  const [activeView, setActiveView] = useState('dashboard');

  return (
    <>
      <Helmet>
        <title>Multi-Canal | DropShipper</title>
        <meta name="description" content="Synchronisez vos produits sur plusieurs canaux de vente" />
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion Multi-Canal</h1>
          <p className="text-muted-foreground">
            Synchronisez vos produits et commandes sur tous vos canaux de vente
          </p>
        </div>

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
      </div>
    </>
  );
}
