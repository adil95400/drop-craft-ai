import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, User, Bell, Shield, CreditCard } from 'lucide-react';

export default function Settings() {
  const settingsCategories = [
    {
      id: 'profile',
      title: 'Profile Settings',
      description: 'Manage your account information',
      icon: User
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure your notification preferences',
      icon: Bell
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Manage your security settings',
      icon: Shield
    },
    {
      id: 'billing',
      title: 'Billing & Subscription',
      description: 'Manage your subscription and payment methods',
      icon: CreditCard
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your profile information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="Enter your first name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Enter your last name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" placeholder="Enter your company name" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsCategories.slice(1).map((category) => (
          <Card key={category.id} className="hover:shadow-card transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <category.icon className="h-5 w-5 text-primary" />
                {category.title}
              </CardTitle>
              <CardDescription>
                {category.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Configure
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Manage your API keys and webhook endpoints
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input id="webhookUrl" placeholder="https://your-domain.com/webhook" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input id="apiKey" type="password" placeholder="Your API key" />
          </div>
          <Button variant="outline">Generate New API Key</Button>
        </CardContent>
      </Card>
    </div>
  );
}