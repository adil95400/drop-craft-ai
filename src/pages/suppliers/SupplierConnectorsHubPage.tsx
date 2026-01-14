import { Helmet } from 'react-helmet-async';
import { SupplierConnectorsHub } from '@/components/suppliers/SupplierConnectorsHub';

export default function SupplierConnectorsHubPage() {
  return (
    <>
      <Helmet>
        <title>Connecteurs Fournisseurs | Shopopti+</title>
        <meta name="description" content="Connectez AliExpress, CJ, BigBuy, Spocket et 15+ fournisseurs en quelques clics." />
      </Helmet>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <SupplierConnectorsHub />
      </div>
    </>
  );
}
