import { MarketingAutomationHub as Hub } from "@/components/marketing/automation"
import { Helmet } from "react-helmet-async"

const MarketingAutomationHubPage = () => {
  return (
    <>
      <Helmet>
        <title>Marketing Automation | Campagnes Email & SMS</title>
        <meta name="description" content="Gérez vos campagnes email/SMS, automations, tests A/B et délivrabilité depuis un hub centralisé." />
      </Helmet>
      <div className="container mx-auto p-6">
        <Hub />
      </div>
    </>
  )
}

export default MarketingAutomationHubPage
