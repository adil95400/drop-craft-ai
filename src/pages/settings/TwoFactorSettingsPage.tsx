/**
 * TwoFactorSettingsPage - Page wrapper for 2FA + Session management
 */
import { Helmet } from 'react-helmet-async';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { useTranslation } from 'react-i18next';
import { Shield } from 'lucide-react';
import TwoFactorSettings from '@/components/settings/TwoFactorSettings';

export default function TwoFactorSettingsPage() {
  const { t: tPages } = useTranslation('pages');
  return (
    <>
      <Helmet>
        <title>Sécurité du compte | Drop Craft AI</title>
        <meta name="description" content="Gérez la double authentification et les sessions actives de votre compte" />
      </Helmet>
      <ChannablePageWrapper
        title={tPages('securiteDuCompte.title')}
        description="Double authentification et gestion des sessions"
        heroImage="security"
        badge={{ label: 'Sécurité', icon: Shield }}
      >
        <TwoFactorSettings />
      </ChannablePageWrapper>
    </>
  );
}
