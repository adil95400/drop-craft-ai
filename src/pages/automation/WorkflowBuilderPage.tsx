import React from 'react';
import { Helmet } from 'react-helmet-async';
import { WorkflowBuilderDashboard } from '@/components/workflows';

export default function WorkflowBuilderPage() {
  return (
    <>
      <Helmet>
        <title>Workflow Builder | DropShipper</title>
        <meta name="description" content="Créez et gérez vos workflows d'automatisation" />
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Builder</h1>
          <p className="text-muted-foreground">
            Automatisez vos processus avec des workflows personnalisés
          </p>
        </div>

        <WorkflowBuilderDashboard />
      </div>
    </>
  );
}
