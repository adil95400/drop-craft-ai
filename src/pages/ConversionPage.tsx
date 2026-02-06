import { ConversionHub } from '@/components/conversion/ConversionHub';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, TrendingUp } from 'lucide-react';
import { PageBanner } from '@/components/shared/PageBanner';

const ConversionPage = () => {
  return (
    <ErrorBoundary>
      <ResponsiveContainer>
        <PageBanner
          icon={TrendingUp}
          title="Conversion Analytics"
          description="Suivez et optimisez vos taux de conversion sur tous les canaux"
          theme="green"
          actions={
            <>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </>
          }
        />
        <ConversionHub />
      </ResponsiveContainer>
    </ErrorBoundary>
  );
};

export default ConversionPage;
