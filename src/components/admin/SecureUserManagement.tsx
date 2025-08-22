import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { secureAdminService } from '@/services/secureAdminService';
import { Shield, Users, AlertTriangle, UserCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface User {
  id: string;
  full_name: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export const SecureUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();
    loadUsers();
  }, []);

  const checkAdminStatus = async () => {
    const adminStatus = await secureAdminService.isCurrentUserAdmin();
    setIsAdmin(adminStatus);
    if (!adminStatus) {
      toast({
        title: "Access Denied",
        description: "You don't have admin permissions to view this page",
        variant: "destructive"
      });
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    const result = await secureAdminService.getAllUsers();
    
    if (result.success) {
      setUsers(result.data);
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    setChangingRole(userId);
    
    const result = await secureAdminService.changeUserRole(userId, newRole);
    
    if (result.success) {
      toast({
        title: "Success",
        description: result.message,
        variant: "default"
      });
      
      // Log the admin action
      await secureAdminService.logAdminAction(
        'user_role_change',
        `Changed user role to ${newRole}`,
        { target_user_id: userId, new_role: newRole }
      );
      
      // Reload users to reflect changes
      loadUsers();
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive"
      });
    }
    
    setChangingRole(null);
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to access this page. Admin privileges required.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Secure User Management</h2>
          <p className="text-muted-foreground">Manage user roles with enhanced security</p>
        </div>
      </div>

      <Alert>
        <UserCheck className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> All role changes are logged and monitored. 
          You cannot change your own role for security reasons.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Users
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions securely
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-medium">{user.full_name || 'Unnamed User'}</h4>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    {user.role === 'user' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRoleChange(user.id, 'admin')}
                        disabled={changingRole === user.id}
                      >
                        {changingRole === user.id ? 'Promoting...' : 'Make Admin'}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRoleChange(user.id, 'user')}
                        disabled={changingRole === user.id}
                      >
                        {changingRole === user.id ? 'Demoting...' : 'Remove Admin'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {users.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};