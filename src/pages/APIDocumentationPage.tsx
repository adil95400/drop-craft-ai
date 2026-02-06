import { APIDocumentation } from '@/components/api/APIDocumentation';
import { Helmet } from 'react-helmet-async';
import { PageBanner } from '@/components/shared/PageBanner';
import { Code } from 'lucide-react';

export default function APIDocumentationPage() {
  return (
    <>
      <Helmet>
        <title>Documentation API - API REST E-commerce</title>
        <meta name="description" content="Documentation complète de l'API REST pour gérer vos produits, commandes et clients" />
      </Helmet>
      <div className="container mx-auto p-6 space-y-6">
        <PageBanner
          icon={Code}
          title="Documentation API"
          description="Documentation complète de l'API REST pour gérer vos produits, commandes et clients"
          theme="indigo"
        />
        <APIDocumentation />
      </div>
    </>
  );
}
