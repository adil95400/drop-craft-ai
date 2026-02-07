import { InternationalizationHub } from "@/components/internationalization/InternationalizationHub";
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Globe } from 'lucide-react';

const InternationalizationPage = () => {
  return (
    <ChannablePageWrapper
      title="Internationalisation"
      description="Traduisez et adaptez vos contenus pour tous vos marchés"
      heroImage="integrations"
      badge={{ label: 'i18n', icon: Globe }}
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.internationalization} />
      <InternationalizationHub />
    </ChannablePageWrapper>
  );
};

export default InternationalizationPage;
