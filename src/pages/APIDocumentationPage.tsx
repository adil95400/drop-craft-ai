import { APIDocumentation } from '@/components/api/APIDocumentation';
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Code } from 'lucide-react';

export default function APIDocumentationPage() {
  return (
    <>
      <Helmet>
        <title>Documentation API - API REST E-commerce</title>
        <meta name="description" content="Documentation complète de l'API REST pour gérer vos produits, commandes et clients" />
      </Helmet>
      <ChannablePageWrapper
        title="Documentation API"
        description="Documentation complète de l'API REST pour gérer vos produits, commandes et clients"
        heroImage="schema"
        badge={{ label: 'API', icon: Code }}
      >
        <APIDocumentation />
      </ChannablePageWrapper>
    </>
  );
}
