import { ConversionHub } from '@/components/conversion/ConversionHub';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, TrendingUp } from 'lucide-react';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';

const ConversionPage = () => {
  return (
    <ErrorBoundary>
      <ChannablePageWrapper
        title="Conversion Analytics"
        description="Suivez et optimisez vos taux de conversion sur tous les canaux"
        heroImage="analytics"
        badge={{ label: 'Conversion', icon: TrendingUp }}
        actions={
          <>
            <Button variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button size="sm"><Download className="h-4 w-4 mr-2" />Export</Button>
          </>
        }
      >
        <ConversionHub />
      </ChannablePageWrapper>
    </ErrorBoundary>
  );
};

export default ConversionPage;
