import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Plus, Mail, Trash2, Shield, Eye, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Team {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
}

export function TeamManager() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers(selectedTeam.id);
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTeams(data || []);
    } catch (error: any) {
      console.error('Error loading teams:', error);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('team_members')
        .select('*')
        .eq('team_id', teamId);

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      console.error('Error loading team members:', error);
    }
  };

  const createTeam = async () => {
    if (!newTeamName) return;

    setLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const { data: team, error: teamError } = await (supabase as any)
        .from('teams')
        .insert({
          name: newTeamName,
          owner_id: user.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add owner as team member
      const { error: memberError } = await (supabase as any)
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      toast({
        title: "✅ Équipe créée",
        description: `L'équipe "${newTeamName}" a été créée`
      });

      setNewTeamName('');
      loadTeams();
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async () => {
    if (!selectedTeam || !inviteEmail) return;

    setLoading(true);
    try {
      // In a real app, this would send an email invitation
      toast({
        title: "📧 Invitation envoyée",
        description: `Une invitation a été envoyée à ${inviteEmail}`
      });

      setInviteEmail('');
    } catch (error: any) {
      toast({
        title: "❌ Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Shield className="h-4 w-4 text-warning" />;
      case 'admin':
        return <Settings className="h-4 w-4 text-info" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-muted-foreground" />;
      default:
        return <Users className="h-4 w-4 text-success" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion d'Équipe
          </CardTitle>
          <CardDescription>
            Collaborez avec votre équipe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nom de l'équipe"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
            />
            <Button onClick={createTeam} disabled={loading || !newTeamName}>
              <Plus className="mr-2 h-4 w-4" />
              Créer
            </Button>
          </div>

          <div className="grid gap-2">
            {teams.map((team) => (
              <div
                key={team.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTeam?.id === team.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedTeam(team)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{team.name}</h4>
                    <p className="text-sm text-muted-foreground">{team.description}</p>
                  </div>
                  <Badge variant="outline">{members.length} membres</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTeam && (
        <Card>
          <CardHeader>
            <CardTitle>Membres de {selectedTeam.name}</CardTitle>
            <CardDescription>Gérez les membres de votre équipe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Email du membre"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Button onClick={inviteMember} disabled={loading || !inviteEmail}>
                <Mail className="mr-2 h-4 w-4" />
                Inviter
              </Button>
            </div>

            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {member.user_id.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.user_id}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getRoleIcon(member.role)}
                        <span className="capitalize">{member.role}</span>
                      </div>
                    </div>
                  </div>
                  {member.role !== 'owner' && (
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
