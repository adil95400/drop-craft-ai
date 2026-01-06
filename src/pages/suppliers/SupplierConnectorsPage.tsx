/**
 * Supplier Connectors Page
 * Main page for managing supplier connections and imports
 */
import { Helmet } from 'react-helmet-async';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupplierConnectorHub, SupplierImportPanel } from '@/components/suppliers';
import { Plug, Download, Settings } from 'lucide-react';

export default function SupplierConnectorsPage() {
  return (
    <>
      <Helmet>
        <title>Connecteurs Fournisseurs | Shopopti</title>
        <meta 
          name="description" 
          content="Connectez et gérez vos fournisseurs dropshipping: AliExpress, CJ Dropshipping, BigBuy et plus." 
        />
      </Helmet>
      
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Plug className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Connecteurs Fournisseurs</h1>
            <p className="text-muted-foreground">
              Connectez AliExpress, CJ Dropshipping, BigBuy et importez vos produits
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="connectors" className="space-y-6">
          <TabsList>
            <TabsTrigger value="connectors" className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              Connecteurs
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connectors">
            <SupplierConnectorHub />
          </TabsContent>

          <TabsContent value="import">
            <SupplierImportPanel />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
