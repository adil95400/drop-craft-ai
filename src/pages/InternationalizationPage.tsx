import { InternationalizationHub } from "@/components/internationalization/InternationalizationHub";
import { AdvancedFeatureGuide, ADVANCED_GUIDES } from '@/components/guide';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const InternationalizationPage = () => {
  const { t: tPages } = useTranslation('pages');
  const { t } = useTranslation('pages');

  return (
    <ChannablePageWrapper
      title={t('internationalisation.title')}
      description={t('internationalisation.description')}
      heroImage="integrations"
      badge={{ label: 'i18n', icon: Globe }}
    >
      <AdvancedFeatureGuide {...ADVANCED_GUIDES.internationalization} />
      <InternationalizationHub />
    </ChannablePageWrapper>
  );
};

export default InternationalizationPage;
