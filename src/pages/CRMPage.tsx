import { Helmet } from 'react-helmet-async';
import { CRMDashboard } from '@/components/crm/CRMDashboard';

export default function CRMPage() {
  return (
    <>
      <Helmet>
        <title>CRM - Gestion de la Relation Client</title>
        <meta name="description" content="Gérez vos prospects, clients et opportunités commerciales" />
      </Helmet>

      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">CRM - Relation Client</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos prospects, suivez vos opportunités et analysez vos performances commerciales
          </p>
        </div>

        <CRMDashboard />
      </div>
    </>
  );
}
