import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WhiteLabelSettings {
  id?: string;
  brand_name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string;
  favicon_url: string;
  custom_domain: string;
  custom_css: string;
  email_branding: boolean;
  hide_platform_badge: boolean;
  custom_login_bg: string;
  font_family: string;
}

const DEFAULT_SETTINGS: WhiteLabelSettings = {
  brand_name: '',
  primary_color: '#6366f1',
  secondary_color: '#8b5cf6',
  accent_color: '#f59e0b',
  logo_url: '',
  favicon_url: '',
  custom_domain: '',
  custom_css: '',
  email_branding: true,
  hide_platform_badge: false,
  custom_login_bg: '',
  font_family: 'Inter',
};

export function useWhiteLabelSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<WhiteLabelSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('white_label_settings' as any)
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        const d = data as any;
        setSettings({
          id: d.id,
          brand_name: d.brand_name || '',
          primary_color: d.primary_color || '#6366f1',
          secondary_color: d.secondary_color || '#8b5cf6',
          accent_color: d.accent_color || '#f59e0b',
          logo_url: d.logo_url || '',
          favicon_url: d.favicon_url || '',
          custom_domain: d.custom_domain || '',
          custom_css: d.custom_css || '',
          email_branding: d.email_branding ?? true,
          hide_platform_badge: d.hide_platform_badge ?? false,
          custom_login_bg: d.custom_login_bg || '',
          font_family: d.font_family || 'Inter',
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const save = useCallback(async (newSettings: WhiteLabelSettings) => {
    if (!user) return false;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        brand_name: newSettings.brand_name || null,
        primary_color: newSettings.primary_color,
        secondary_color: newSettings.secondary_color,
        accent_color: newSettings.accent_color,
        logo_url: newSettings.logo_url || null,
        favicon_url: newSettings.favicon_url || null,
        custom_domain: newSettings.custom_domain || null,
        custom_css: newSettings.custom_css || null,
        email_branding: newSettings.email_branding,
        hide_platform_badge: newSettings.hide_platform_badge,
        custom_login_bg: newSettings.custom_login_bg || null,
        font_family: newSettings.font_family,
      };

      const { error } = await supabase
        .from('white_label_settings' as any)
        .upsert(payload as any, { onConflict: 'user_id' });

      if (error) throw error;
      setSettings(newSettings);
      toast.success('Paramètres White-Label sauvegardés');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'Erreur de sauvegarde');
      return false;
    } finally {
      setSaving(false);
    }
  }, [user]);

  const uploadAsset = useCallback(async (file: File, type: 'logo' | 'favicon' | 'login-bg') => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${type}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('white-label')
      .upload(path, file, { upsert: true });

    if (error) {
      toast.error('Erreur upload: ' + error.message);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('white-label')
      .getPublicUrl(path);

    return publicUrl;
  }, [user]);

  return { settings, setSettings, loading, saving, save, uploadAsset };
}
