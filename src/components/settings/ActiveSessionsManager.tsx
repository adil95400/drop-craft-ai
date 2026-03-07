/**
 * ActiveSessionsManager - Gestion des sessions actives
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Monitor, Smartphone, Globe, Clock, LogOut, Loader2 } from 'lucide-react';

interface SessionInfo {
  id: string;
  device: string;
  icon: typeof Monitor;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export function ActiveSessionsManager() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);

  const loadSessions = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Build session info from current session
      const ua = navigator.userAgent;
      const isMobile = /Mobile|Android|iPhone/i.test(ua);
      const browser = /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Navigateur';

      const currentSession: SessionInfo = {
        id: 'current',
        device: `${browser} sur ${isMobile ? 'Mobile' : navigator.platform || 'Desktop'}`,
        icon: isMobile ? Smartphone : Monitor,
        location: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Inconnu',
        lastActive: 'Maintenant',
        isCurrent: true,
      };

      setSessions([currentSession]);
    } catch (err: any) {
      toast.error('Erreur lors du chargement des sessions');
    } finally {
      setLoading(false);
    }
  };

  const signOutEverywhere = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      toast.success('Toutes les sessions ont été déconnectées');
      setOpen(false);
      // Will redirect to login via auth state change
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={loadSessions}>
        <Monitor className="h-4 w-4 mr-1" /> Gérer
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sessions Actives</DialogTitle>
            <DialogDescription>
              Gérez les appareils connectés à votre compte
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {sessions.map((session) => (
                <Card key={session.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <session.icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{session.device}</p>
                          {session.isCurrent && (
                            <Badge variant="default" className="text-xs">Session actuelle</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" /> {session.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {session.lastActive}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <div className="pt-4 border-t border-border">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={signOutEverywhere}
                  disabled={loading}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnecter toutes les sessions
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Vous serez déconnecté de tous les appareils
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
