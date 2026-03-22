import { Helmet } from 'react-helmet-async'
import { Calendar } from 'lucide-react'
import { MarketingCalendar } from '@/components/marketing/MarketingCalendar'
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper'
import { useTranslation } from 'react-i18next';

export default function MarketingCalendarPage() {
  const { t: tPages } = useTranslation('pages');
  return (
    <>
      <Helmet>
        <title>Calendrier Marketing - Planification des Campagnes</title>
        <meta name="description" content="Planifiez et organisez vos campagnes marketing avec notre calendrier interactif avancé." />
      </Helmet>

      <ChannablePageWrapper
        title={tPages('calendrierMarketing.title')}
        subtitle={tPages('marketing.title')}
        description="Planifiez et organisez vos campagnes marketing avec notre calendrier interactif"
        heroImage="marketing"
        badge={{ label: "Planning", icon: Calendar }}
      >
        <MarketingCalendar />
      </ChannablePageWrapper>
    </>
  )
}