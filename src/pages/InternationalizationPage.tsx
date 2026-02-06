import { InternationalizationHub } from "@/components/internationalization/InternationalizationHub";
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { PageBanner } from '@/components/shared/PageBanner';
import { Globe } from 'lucide-react';

const InternationalizationPage = () => {
  return (
    <div className="space-y-6">
      <PageBanner
        icon={Globe}
        title="Internationalisation"
        description="Traduisez et adaptez vos contenus pour tous vos marchés"
        theme="indigo"
      />
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.internationalization} />
      <InternationalizationHub />
    </div>
  );
};

export default InternationalizationPage;