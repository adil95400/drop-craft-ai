import { Helmet } from 'react-helmet-async'
import { MarketingCalendar } from '@/components/marketing/MarketingCalendar'

export default function MarketingCalendarPage() {
  return (
    <>
      <Helmet>
        <title>Calendrier Marketing - Planification des Campagnes</title>
        <meta name="description" content="Planifiez et organisez vos campagnes marketing avec notre calendrier interactif avancé." />
      </Helmet>

      <div className="container mx-auto p-6">
        <MarketingCalendar />
      </div>
    </>
  )
}