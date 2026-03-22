import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { WorkflowBuilder } from '@/domains/automation/components/WorkflowBuilder';

export default function WorkflowBuilderPage() {
  const { t: tPages } = useTranslation('pages');
  return (
    <>
      <Helmet>
        <title>Workflow Builder | Drop-Craft AI</title>
        <meta name="description" content="Créez des workflows d'automatisation visuels avec le constructeur drag & drop." />
      </Helmet>
      <ChannablePageWrapper
        title={tPages('workflowBuilder.title')}
        description="Construisez des automatisations visuelles par glisser-déposer"
      >
        <WorkflowBuilder />
      </ChannablePageWrapper>
    </>
  );
}
