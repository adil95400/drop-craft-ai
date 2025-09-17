import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, UserPlus, Mail, Shield, Clock, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { mobileAppService, type TeamMember } from '@/services/MobileAppService';
import { toast } from 'sonner';

const rolePermissions = {
  admin: ['all'],
  developer: ['build', 'deploy', 'test', 'view_code', 'view_analytics'],
  designer: ['design', 'assets', 'preview', 'view_analytics'],
  tester: ['test', 'bug_report', 'view_builds'],
  viewer: ['view_analytics', 'view_builds']
};

const permissionLabels = {
  all: 'All Permissions',
  build: 'Build Apps',
  deploy: 'Deploy to Stores',
  test: 'Run Tests',
  view_code: 'View Source Code',
  view_analytics: 'View Analytics',
  design: 'Edit Designs',
  assets: 'Manage Assets',
  preview: 'Preview Builds',
  bug_report: 'Report Bugs'
};

export const TeamCollaboration = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const [inviteData, setInviteData] = useState({
    name: '',
    email: '',
    role: 'viewer' as TeamMember['role'],
    permissions: [] as string[]
  });

  useEffect(() => {
    loadTeamMembers();
  }, []);

  useEffect(() => {
    // Update permissions when role changes
    setInviteData(prev => ({
      ...prev,
      permissions: rolePermissions[prev.role] || []
    }));
  }, [inviteData.role]);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const data = await mobileAppService.getTeamMembers();
      setMembers(data);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    try {
      await mobileAppService.inviteTeamMember(inviteData);
      setShowInvite(false);
      setInviteData({
        name: '',
        email: '',
        role: 'viewer',
        permissions: []
      });
      loadTeamMembers();
    } catch (error) {
      console.error('Error inviting member:', error);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'developer': return 'bg-blue-500';
      case 'designer': return 'bg-purple-500';
      case 'tester': return 'bg-yellow-500';
      case 'viewer': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'invited': return 'text-yellow-500';
      case 'inactive': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle;
      case 'invited': return Mail;
      case 'inactive': return AlertCircle;
      default: return AlertCircle;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Collaboration</h1>
          <p className="text-muted-foreground">Manage your team members and permissions</p>
        </div>
        
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Add a new member to your team with specific roles and permissions
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="member-name">Full Name</Label>
                <Input
                  id="member-name"
                  value={inviteData.name}
                  onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="member-email">Email</Label>
                <Input
                  id="member-email"
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="member-role">Role</Label>
                <Select value={inviteData.role} onValueChange={(value: TeamMember['role']) => setInviteData({ ...inviteData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="designer">Designer</SelectItem>
                    <SelectItem value="tester">Tester</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Permissions</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {Object.entries(permissionLabels).map(([permission, label]) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Checkbox
                        id={permission}
                        checked={inviteData.permissions.includes(permission)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setInviteData({
                              ...inviteData,
                              permissions: [...inviteData.permissions, permission]
                            });
                          } else {
                            setInviteData({
                              ...inviteData,
                              permissions: inviteData.permissions.filter(p => p !== permission)
                            });
                          }
                        }}
                        disabled={inviteData.role === 'admin'}
                      />
                      <Label htmlFor={permission} className="text-sm">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
                {inviteData.role === 'admin' && (
                  <p className="text-xs text-muted-foreground">
                    Admin role automatically includes all permissions
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteMember}>Send Invite</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">
              {members.filter(m => m.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invites</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter(m => m.status === 'invited').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter(m => m.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Full access
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Developers</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter(m => m.role === 'developer').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Build & deploy
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            Manage your team members, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Team Members</h3>
              <p className="text-muted-foreground mb-4">
                Start collaborating by inviting your first team member.
              </p>
              <Button onClick={() => setShowInvite(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite First Member
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => {
                const StatusIcon = getStatusIcon(member.status);
                return (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold">{member.name}</h4>
                          <StatusIcon className={`h-4 w-4 ${getStatusColor(member.status)}`} />
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={getRoleColor(member.role)}>
                            {member.role}
                          </Badge>
                          {member.status === 'active' && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              Last active: {new Date(member.last_active).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {member.status === 'invited' && (
                        <Button size="sm" variant="outline">
                          Resend Invite
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Overview of permissions for each team role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(rolePermissions).map(([role, permissions]) => (
              <div key={role} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge className={getRoleColor(role)}>
                    {role}
                  </Badge>
                </div>
                <div className="space-y-1">
                  {permissions.map((permission) => (
                    <div key={permission} className="text-sm text-muted-foreground">
                      • {permissionLabels[permission as keyof typeof permissionLabels]}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};