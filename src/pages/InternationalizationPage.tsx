import { InternationalizationHub } from "@/components/internationalization/InternationalizationHub";
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';

const InternationalizationPage = () => {
  return (
    <div className="space-y-6">
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.internationalization} />
      <InternationalizationHub />
    </div>
  );
};

export default InternationalizationPage;