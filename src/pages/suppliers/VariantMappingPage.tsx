/**
 * Variant Mapping Page
 * Page complète pour la gestion des mappings de variantes
 */
import { Helmet } from 'react-helmet-async';
import { VariantMappingDashboard } from '@/components/variant-mapping';
import { Layers } from 'lucide-react';

export default function VariantMappingPage() {
  return (
    <>
      <Helmet>
        <title>Variant Mapping | Shopopti</title>
        <meta 
          name="description" 
          content="Gérez les mappings de variantes entre vos fournisseurs et votre catalogue. Tailles, couleurs, options personnalisées." 
        />
      </Helmet>
      
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Variant Mapping</h1>
            <p className="text-muted-foreground">
              Mappez les variantes fournisseurs vers votre catalogue
            </p>
          </div>
        </div>

        {/* Dashboard */}
        <VariantMappingDashboard />
      </div>
    </>
  );
}
