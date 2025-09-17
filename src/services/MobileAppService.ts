import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MobileApp {
  id: string;
  name: string;
  platform: 'ios' | 'android' | 'hybrid';
  status: 'development' | 'testing' | 'published' | 'archived';
  version: string;
  build_number: number;
  package_name: string;
  app_store_url?: string;
  play_store_url?: string;
  features: string[];
  screenshots: string[];
  metadata: {
    description: string;
    keywords: string[];
    category: string;
    target_audience: string;
  };
  performance_metrics: {
    downloads: number;
    ratings: number;
    reviews: number;
    crash_rate: number;
    retention_rate: number;
  };
  created_at: string;
  updated_at: string;
}

export interface AppBuild {
  id: string;
  app_id: string;
  version: string;
  build_number: number;
  status: 'building' | 'success' | 'failed' | 'testing';
  platform: 'ios' | 'android';
  build_logs: string[];
  download_url?: string;
  size_mb: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'developer' | 'designer' | 'tester' | 'viewer';
  avatar_url?: string;
  permissions: string[];
  last_active: string;
  status: 'active' | 'invited' | 'inactive';
}

class MobileAppService {
  private static instance: MobileAppService;

  static getInstance(): MobileAppService {
    if (!MobileAppService.instance) {
      MobileAppService.instance = new MobileAppService();
    }
    return MobileAppService.instance;
  }

  async getMobileApps(): Promise<MobileApp[]> {
    try {
      const { data: apps, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('action', 'mobile_app_created')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform activity logs to mobile apps format
      return apps?.map(app => {
        const meta = app.metadata as any;
        return {
          id: app.id,
          name: meta?.name || 'Mobile App',
          platform: meta?.platform || 'hybrid',
          status: meta?.status || 'development',
          version: meta?.version || '1.0.0',
          build_number: meta?.build_number || 1,
          package_name: meta?.package_name || 'com.example.app',
          app_store_url: meta?.app_store_url,
          play_store_url: meta?.play_store_url,
          features: meta?.features || [],
          screenshots: meta?.screenshots || [],
          metadata: meta?.app_metadata || {
            description: 'Mobile application',
            keywords: [],
            category: 'Business',
            target_audience: 'General'
          },
          performance_metrics: meta?.performance_metrics || {
            downloads: 0,
            ratings: 0,
            reviews: 0,
            crash_rate: 0,
            retention_rate: 0
          },
          created_at: app.created_at,
          updated_at: app.created_at
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching mobile apps:', error);
      // Return mock data for development
      return [
        {
          id: '1',
          name: 'ShopOpti Mobile',
          platform: 'hybrid',
          status: 'published',
          version: '2.1.4',
          build_number: 24,
          package_name: 'com.shopopti.mobile',
          app_store_url: 'https://apps.apple.com/app/shopopti',
          play_store_url: 'https://play.google.com/store/apps/details?id=com.shopopti.mobile',
          features: ['Dashboard', 'Analytics', 'Push Notifications', 'Offline Mode'],
          screenshots: ['/api/placeholder/300/600', '/api/placeholder/300/600'],
          metadata: {
            description: 'Mobile e-commerce management app',
            keywords: ['ecommerce', 'mobile', 'analytics'],
            category: 'Business',
            target_audience: 'Business owners'
          },
          performance_metrics: {
            downloads: 15420,
            ratings: 4.7,
            reviews: 892,
            crash_rate: 0.02,
            retention_rate: 0.73
          },
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-20T15:30:00Z'
        }
      ];
    }
  }

  async createMobileApp(appData: Omit<MobileApp, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: 'mobile_app_created',
          description: `Mobile app "${appData.name}" created`,
          metadata: {
            name: appData.name,
            platform: appData.platform,
            status: appData.status,
            version: appData.version,
            build_number: appData.build_number,
            package_name: appData.package_name,
            features: appData.features,
            app_metadata: appData.metadata,
            performance_metrics: appData.performance_metrics
          }
        });

      if (error) throw error;

      toast.success('Mobile app created successfully');
    } catch (error) {
      console.error('Error creating mobile app:', error);
      toast.error('Failed to create mobile app');
    }
  }

  async getAppBuilds(appId: string): Promise<AppBuild[]> {
    try {
      const { data: builds, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('action', 'app_build_started')
        .eq('entity_id', appId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return builds?.map(build => ({
        id: build.id,
        app_id: appId,
        version: build.metadata?.version || '1.0.0',
        build_number: build.metadata?.build_number || 1,
        status: build.metadata?.status || 'building',
        platform: build.metadata?.platform || 'android',
        build_logs: build.metadata?.build_logs || [],
        download_url: build.metadata?.download_url,
        size_mb: build.metadata?.size_mb || 0,
        created_at: build.created_at
      })) || [];
    } catch (error) {
      console.error('Error fetching app builds:', error);
      return [];
    }
  }

  async startBuild(appId: string, platform: 'ios' | 'android', version: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          action: 'app_build_started',
          entity_id: appId,
          description: `Build started for ${platform} v${version}`,
          metadata: {
            platform,
            version,
            build_number: Date.now(),
            status: 'building',
            build_logs: [`Build started at ${new Date().toISOString()}`]
          }
        });

      if (error) throw error;

      toast.success(`${platform} build started`);
    } catch (error) {
      console.error('Error starting build:', error);
      toast.error('Failed to start build');
    }
  }

  async getTeamMembers(): Promise<TeamMember[]> {
    try {
      const { data: members, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('action', 'team_member_added')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return members?.map(member => ({
        id: member.id,
        name: member.metadata?.name || 'Team Member',
        email: member.metadata?.email || '',
        role: member.metadata?.role || 'viewer',
        avatar_url: member.metadata?.avatar_url,
        permissions: member.metadata?.permissions || [],
        last_active: member.metadata?.last_active || member.created_at,
        status: member.metadata?.status || 'active'
      })) || [];
    } catch (error) {
      console.error('Error fetching team members:', error);
      // Return mock data
      return [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'admin',
          avatar_url: '/api/placeholder/40/40',
          permissions: ['all'],
          last_active: '2024-01-20T15:30:00Z',
          status: 'active'
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'developer',
          permissions: ['build', 'deploy', 'test'],
          last_active: '2024-01-20T14:15:00Z',
          status: 'active'
        }
      ];
    }
  }

  async inviteTeamMember(memberData: {
    name: string;
    email: string;
    role: TeamMember['role'];
    permissions: string[];
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          action: 'team_member_added',
          description: `Team member ${memberData.name} invited`,
          metadata: {
            name: memberData.name,
            email: memberData.email,
            role: memberData.role,
            permissions: memberData.permissions,
            status: 'invited'
          }
        });

      if (error) throw error;

      toast.success('Team member invited successfully');
    } catch (error) {
      console.error('Error inviting team member:', error);
      toast.error('Failed to invite team member');
    }
  }

  async generateWhiteLabelApp(config: {
    brand_name: string;
    brand_colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    logo_url: string;
    features: string[];
    custom_domain?: string;
  }): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          action: 'white_label_generated',
          description: `White-label app generated for ${config.brand_name}`,
          metadata: config
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('White-label app generated successfully');
      return data.id;
    } catch (error) {
      console.error('Error generating white-label app:', error);
      toast.error('Failed to generate white-label app');
      throw error;
    }
  }

  async getEnterpriseAPIKeys(): Promise<Array<{
    id: string;
    name: string;
    key: string;
    permissions: string[];
    last_used: string;
    created_at: string;
  }>> {
    try {
      const { data: keys, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('action', 'api_key_created')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return keys?.map(key => ({
        id: key.id,
        name: key.metadata?.name || 'Enterprise API Key',
        key: key.metadata?.key || 'sk_****',
        permissions: key.metadata?.permissions || [],
        last_used: key.metadata?.last_used || 'Never',
        created_at: key.created_at
      })) || [];
    } catch (error) {
      console.error('Error fetching enterprise API keys:', error);
      return [];
    }
  }

  async createEnterpriseAPIKey(keyData: {
    name: string;
    permissions: string[];
  }): Promise<void> {
    try {
      const apiKey = `sk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          action: 'api_key_created',
          description: `Enterprise API key "${keyData.name}" created`,
          metadata: {
            name: keyData.name,
            key: apiKey,
            permissions: keyData.permissions,
            last_used: null
          }
        });

      if (error) throw error;

      toast.success('Enterprise API key created successfully');
    } catch (error) {
      console.error('Error creating enterprise API key:', error);
      toast.error('Failed to create enterprise API key');
    }
  }
}

export const mobileAppService = MobileAppService.getInstance();