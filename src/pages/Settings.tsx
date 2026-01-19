import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from 'react-i18next';
import { ChannablePageWrapper } from '@/components/channable/ChannablePageWrapper';
import { 
  Settings as SettingsIcon,
  User, 
  Bell, 
  Key, 
  Palette, 
  Shield, 
  CreditCard, 
  Database,
  LogOut,
  Save,
  ExternalLink,
  Coins
} from "lucide-react";

// Import refactored tab components
import {
  ProfileTab,
  NotificationsTab,
  SecurityTab,
  ApiTab,
  BillingTab,
  AppearanceTab,
  CurrenciesTab
} from "@/components/settings";

const Settings = () => {
  const { user, profile, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(['settings', 'common', 'navigation']);
  const [activeTab, setActiveTab] = useState("profile");

  const [profileData, setProfileData] = useState({
    name: profile?.full_name || user?.email?.split('@')[0] || "Utilisateur",
    email: user?.email || "",
    phone: profile?.phone || "",
    company: profile?.company || "",
    website: profile?.website || "",
    bio: profile?.bio || ""
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: true,
    newFeatures: true,
    orderUpdates: true
  });

  // Sync profile data when profile changes
  useEffect(() => {
    if (profile) {
      setProfileData({
        name: profile.full_name || user?.email?.split('@')[0] || "Utilisateur",
        email: user?.email || "",
        phone: profile.phone || "",
        company: profile.company || "",
        website: profile.website || "",
        bio: profile.bio || ""
      });
    }
  }, [profile, user]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        full_name: profileData.name,
        phone: profileData.phone,
        company: profileData.company,
        website: profileData.website,
        bio: profileData.bio
      });
      toast.success('Profil sauvegardé avec succès');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde du profil');
    }
  };

  const handleSaveNotifications = () => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 800)), 
      {
        loading: 'Sauvegarde des préférences...',
        success: 'Préférences de notification sauvegardées',
        error: 'Erreur lors de la sauvegarde'
      }
    );
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      navigate('/');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User, mobileLabel: 'Profil' },
    { id: 'notifications', label: t('settings:tabs.notifications'), icon: Bell, mobileLabel: 'Notifs' },
    { id: 'security', label: t('settings:tabs.security'), icon: Shield, mobileLabel: 'Sécurité' },
    { id: 'billing', label: 'Facturation', icon: CreditCard, mobileLabel: 'Billing' },
    { id: 'currencies', label: 'Devises', icon: Coins, mobileLabel: 'Devises' },
    { id: 'api', label: 'API', icon: Key, mobileLabel: 'API' },
    { id: 'appearance', label: t('settings:tabs.appearance'), icon: Palette, mobileLabel: 'Thème' },
  ];

  return (
    <ChannablePageWrapper
      title={t('settings:title')}
      subtitle="Configuration"
      description={t('settings:description')}
      heroImage="settings"
      badge={{ label: 'Paramètres', icon: SettingsIcon }}
      actions={
        <>
          <Button 
            variant="outline" 
            onClick={handleLogout} 
            size="sm" 
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">{t('navigation:logout')}</span>
            <span className="xs:hidden">Quit</span>
          </Button>
          <Button 
            variant="default" 
            onClick={handleSaveProfile} 
            size="sm"
          >
            <Save className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Sauvegarder</span>
            <span className="xs:hidden">Save</span>
          </Button>
        </>
      }
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar Navigation */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="p-4 hidden lg:block">
              <CardTitle className="flex items-center gap-2 text-sm">
                <SettingsIcon className="h-4 w-4 text-primary" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile horizontal scroll tabs */}
              <div className="lg:hidden overflow-x-auto scrollbar-hide">
                <TabsList className="inline-flex w-auto min-w-full h-auto bg-transparent p-2 gap-1">
                  {tabs.map(({ id, icon: Icon, mobileLabel }) => (
                    <TabsTrigger 
                      key={id}
                      value={id} 
                      className="flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {mobileLabel}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              {/* Desktop vertical tabs */}
              <TabsList className="hidden lg:flex flex-col w-full h-auto bg-transparent p-2 gap-1">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <TabsTrigger 
                    key={id}
                    value={id} 
                    className="justify-start w-full text-sm rounded-lg px-3 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {/* Lien vers Intégrations */}
              <div className="border-t border-border mt-2 pt-2 px-2 pb-2 hidden lg:block">
                <Button 
                  variant="ghost" 
                  className="justify-start w-full text-sm px-3 py-2.5 text-muted-foreground hover:text-foreground"
                  onClick={() => navigate('/integrations')}
                >
                  <Database className="mr-2 h-4 w-4" />
                  {t('settings:tabs.integrations')}
                  <ExternalLink className="ml-auto h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <TabsContent value="profile" className="mt-0 space-y-0">
              <ProfileTab 
                profileData={profileData}
                setProfileData={setProfileData}
                onSave={handleSaveProfile}
              />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <NotificationsTab 
                notifications={notifications}
                setNotifications={setNotifications}
                onSave={handleSaveNotifications}
              />
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <SecurityTab />
            </TabsContent>

            <TabsContent value="billing" className="mt-0">
              <BillingTab />
            </TabsContent>

            <TabsContent value="currencies" className="mt-0">
              <CurrenciesTab />
            </TabsContent>

            <TabsContent value="api" className="mt-0">
              <ApiTab />
            </TabsContent>

            <TabsContent value="appearance" className="mt-0">
              <AppearanceTab />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </ChannablePageWrapper>
  );
};

export default Settings;
