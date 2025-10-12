import { APIDocumentation } from '@/components/api/APIDocumentation';
import { Helmet } from 'react-helmet-async';

export default function APIDocumentationPage() {
  return (
    <>
      <Helmet>
        <title>Documentation API - API REST E-commerce</title>
        <meta name="description" content="Documentation complète de l'API REST pour gérer vos produits, commandes et clients" />
      </Helmet>
      <div className="container mx-auto p-6">
        <APIDocumentation />
      </div>
    </>
  );
}
