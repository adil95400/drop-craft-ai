import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Crown,
  User as UserIcon,
  Shield,
  AlertTriangle,
  Activity,
  MoreVertical,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  full_name: string | null;
  is_admin: boolean;
  plan: string;
  created_at: string;
}

export const AdminDashboard = () => {
  const { toast } = useToast();
  const [isChangingRole, setIsChangingRole] = useState(false);

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, is_admin, plan, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  const getRoleIcon = (isAdmin: boolean) => {
    return isAdmin ? (
      <Crown className="h-4 w-4 text-yellow-500" />
    ) : (
      <UserIcon className="h-4 w-4 text-gray-500" />
    );
  };

  const getRoleBadge = (isAdmin: boolean) => {
    return isAdmin ? (
      <Badge variant="destructive">Admin</Badge>
    ) : (
      <Badge variant="secondary">User</Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const variants = {
      standard: "outline",
      pro: "default",
      ultra_pro: "destructive",
    } as const;

    return <Badge variant={variants[plan as keyof typeof variants] || "outline"}>{plan}</Badge>;
  };

  const handleChangeRole = async (userId: string, currentIsAdmin: boolean) => {
    setIsChangingRole(true);
    try {
      const newRole = currentIsAdmin ? "user" : "admin";
      const { error } = await supabase.rpc("admin_change_user_role", {
        target_user_id: userId,
        new_role: newRole,
      });

      if (error) throw error;

      toast({
        title: "Rôle modifié",
        description: `L'utilisateur est maintenant ${newRole}`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChangingRole(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = {
    totalUsers: users?.length || 0,
    adminUsers: users?.filter((u) => u.is_admin).length || 0,
    regularUsers: users?.filter((u) => !u.is_admin).length || 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Administration
          </h2>
          <p className="text-muted-foreground">
            Gérez les utilisateurs et leurs permissions
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Administrateurs
            </CardTitle>
            <Crown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.adminUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilisateurs
            </CardTitle>
            <UserIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.regularUsers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs</CardTitle>
          <CardDescription>
            Liste complète des utilisateurs et leurs rôles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Inscrit le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((userProfile) => (
                <TableRow key={userProfile.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{userProfile.full_name || 'Sans nom'}</div>
                      <div className="text-sm text-muted-foreground">ID: {userProfile.id.slice(0, 8)}...</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(userProfile.is_admin)}
                      {getRoleBadge(userProfile.is_admin)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPlanBadge(userProfile.plan)}
                  </TableCell>
                  <TableCell>
                    {new Date(userProfile.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleChangeRole(
                              userProfile.id,
                              userProfile.is_admin
                            )
                          }
                          disabled={isChangingRole}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          {userProfile.is_admin
                            ? "Rétrograder en User"
                            : "Promouvoir Admin"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
