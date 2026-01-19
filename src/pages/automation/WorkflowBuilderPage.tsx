import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Workflow } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { WorkflowBuilderDashboard } from '@/components/workflows';

export default function WorkflowBuilderPage() {
  return (
    <>
      <Helmet>
        <title>Workflow Builder | DropShipper</title>
        <meta name="description" content="Créez et gérez vos workflows d'automatisation" />
      </Helmet>
      
      <ChannablePageWrapper
        title="Workflow Builder"
        subtitle="Automation"
        description="Automatisez vos processus avec des workflows personnalisés"
        heroImage="ai"
        badge={{ label: "Visual Builder", icon: Workflow }}
      >
        <WorkflowBuilderDashboard />
      </ChannablePageWrapper>
    </>
  );
}
