import { ConversionHub } from '@/components/conversion/ConversionHub';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

const ConversionPage = () => {
  return (
    <ErrorBoundary>
      <ResponsiveContainer>
        <PageHeader
          title="Conversion Analytics"
          description="Track and optimize your conversion rates across all channels"
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
