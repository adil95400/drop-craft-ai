import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Smartphone, Download, Star, Users, TrendingUp, Play, Pause, Settings, Plus } from 'lucide-react';
import { mobileAppService, type MobileApp, type AppBuild } from '@/services/MobileAppService';
import { toast } from 'sonner';

export const MobileAppDashboard = () => {
  const [apps, setApps] = useState<MobileApp[]>([]);
  const [builds, setBuilds] = useState<AppBuild[]>([]);
  const [selectedApp, setSelectedApp] = useState<MobileApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateApp, setShowCreateApp] = useState(false);

  const [newApp, setNewApp] = useState({
    name: '',
    platform: 'hybrid' as const,
    package_name: '',
    description: '',
    category: '',
    features: [] as string[]
  });

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      const data = await mobileAppService.getMobileApps();
      setApps(data);
      
      if (data.length > 0 && !selectedApp) {
        setSelectedApp(data[0]);
        loadBuilds(data[0].id);
      }
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBuilds = async (appId: string) => {
    try {
      const data = await mobileAppService.getAppBuilds(appId);
      setBuilds(data);
    } catch (error) {
      console.error('Error loading builds:', error);
    }
  };

  const handleCreateApp = async () => {
    try {
      await mobileAppService.createMobileApp({
        name: newApp.name,
        platform: newApp.platform,
        status: 'development',
        version: '1.0.0',
        build_number: 1,
        package_name: newApp.package_name,
        features: newApp.features,
        screenshots: [],
        metadata: {
          description: newApp.description,
          keywords: [],
          category: newApp.category,
          target_audience: 'General'
        },
        performance_metrics: {
          downloads: 0,
          ratings: 0,
          reviews: 0,
          crash_rate: 0,
          retention_rate: 0
        }
      });

      setShowCreateApp(false);
      setNewApp({
        name: '',
        platform: 'hybrid',
        package_name: '',
        description: '',
        category: '',
        features: []
      });
      loadApps();
    } catch (error) {
      console.error('Error creating app:', error);
    }
  };

  const handleStartBuild = async (platform: 'ios' | 'android') => {
    if (!selectedApp) return;
    
    try {
      await mobileAppService.startBuild(selectedApp.id, platform, selectedApp.version);
      loadBuilds(selectedApp.id);
    } catch (error) {
      console.error('Error starting build:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'testing': return 'bg-yellow-500';
      case 'development': return 'bg-blue-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getBuildStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'building': return 'bg-yellow-500';
      case 'testing': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading mobile apps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mobile App Development</h1>
          <p className="text-muted-foreground">Build and manage your mobile applications</p>
        </div>
        
        <Dialog open={showCreateApp} onOpenChange={setShowCreateApp}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New App
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Mobile App</DialogTitle>
              <DialogDescription>
                Set up a new mobile application project
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="app-name">App Name</Label>
                <Input
                  id="app-name"
                  value={newApp.name}
                  onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                  placeholder="My Awesome App"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="platform">Platform</Label>
                <Select value={newApp.platform} onValueChange={(value) => setNewApp({ ...newApp, platform: value as 'ios' | 'android' | 'hybrid' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hybrid">Hybrid (iOS + Android)</SelectItem>
                    <SelectItem value="ios">iOS Only</SelectItem>
                    <SelectItem value="android">Android Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="package-name">Package Name</Label>
                <Input
                  id="package-name"
                  value={newApp.package_name}
                  onChange={(e) => setNewApp({ ...newApp, package_name: e.target.value })}
                  placeholder="com.company.appname"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newApp.description}
                  onChange={(e) => setNewApp({ ...newApp, description: e.target.value })}
                  placeholder="Brief description of your app"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newApp.category}
                  onChange={(e) => setNewApp({ ...newApp, category: e.target.value })}
                  placeholder="Business, Productivity, etc."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateApp(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateApp}>Create App</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Mobile Apps</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first mobile app to get started with app development.
            </p>
            <Button onClick={() => setShowCreateApp(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First App
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="builds">Builds</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <Select value={selectedApp?.id} onValueChange={(value) => {
              const app = apps.find(a => a.id === value);
              if (app) {
                setSelectedApp(app);
                loadBuilds(app.id);
              }
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select app" />
              </SelectTrigger>
              <SelectContent>
                {apps.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedApp && (
            <>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedApp.performance_metrics.downloads.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        +12% from last month
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Rating</CardTitle>
                      <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedApp.performance_metrics.ratings}</div>
                      <p className="text-xs text-muted-foreground">
                        {selectedApp.performance_metrics.reviews} reviews
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Retention</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Math.round(selectedApp.performance_metrics.retention_rate * 100)}%</div>
                      <p className="text-xs text-muted-foreground">
                        30-day retention
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Crash Rate</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{(selectedApp.performance_metrics.crash_rate * 100).toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">
                        Last 7 days
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>App Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Platform</span>
                        <Badge variant="outline">{selectedApp.platform.toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status</span>
                        <Badge className={getStatusColor(selectedApp.status)}>
                          {selectedApp.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Version</span>
                        <span className="text-sm">{selectedApp.version}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Build</span>
                        <span className="text-sm">#{selectedApp.build_number}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Package</span>
                        <span className="text-sm font-mono text-xs">{selectedApp.package_name}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button className="w-full" onClick={() => handleStartBuild('android')}>
                        <Play className="h-4 w-4 mr-2" />
                        Build Android
                      </Button>
                      <Button className="w-full" onClick={() => handleStartBuild('ios')}>
                        <Play className="h-4 w-4 mr-2" />
                        Build iOS
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        App Settings
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Features</CardTitle>
                    <CardDescription>Enabled features in your mobile app</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.features.map((feature, index) => (
                        <Badge key={index} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="builds" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Build History</CardTitle>
                    <CardDescription>Recent builds for {selectedApp.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {builds.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No builds yet. Start your first build!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {builds.map((build) => (
                          <div key={build.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Badge className={getBuildStatusColor(build.status)}>
                                  {build.status}
                                </Badge>
                                <span className="font-medium">{build.platform.toUpperCase()}</span>
                                <span className="text-sm text-muted-foreground">v{build.version}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Build #{build.build_number} • {build.size_mb}MB
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {build.download_url && (
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              )}
                              <Button size="sm" variant="ghost">
                                View Logs
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>App Store Rating</span>
                            <span>{selectedApp.performance_metrics.ratings}/5.0</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2 mt-1">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${(selectedApp.performance_metrics.ratings / 5) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>User Retention</span>
                            <span>{Math.round(selectedApp.performance_metrics.retention_rate * 100)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2 mt-1">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${selectedApp.performance_metrics.retention_rate * 100}%` }}
                            ></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm">
                            <span>Crash Rate</span>
                            <span>{(selectedApp.performance_metrics.crash_rate * 100).toFixed(2)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2 mt-1">
                            <div 
                              className="bg-red-500 h-2 rounded-full" 
                              style={{ width: `${selectedApp.performance_metrics.crash_rate * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Store Links</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedApp.app_store_url && (
                        <Button variant="outline" className="w-full" asChild>
                          <a href={selectedApp.app_store_url} target="_blank" rel="noopener noreferrer">
                            View on App Store
                          </a>
                        </Button>
                      )}
                      {selectedApp.play_store_url && (
                        <Button variant="outline" className="w-full" asChild>
                          <a href={selectedApp.play_store_url} target="_blank" rel="noopener noreferrer">
                            View on Google Play
                          </a>
                        </Button>
                      )}
                      {!selectedApp.app_store_url && !selectedApp.play_store_url && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          App not published to stores yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>App Settings</CardTitle>
                    <CardDescription>Configure your mobile app settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">App settings panel coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      )}
    </div>
  );
};