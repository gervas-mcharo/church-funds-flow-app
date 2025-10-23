import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, Edit, Trash2, Shield, UserPlus, Lock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { CreateUserForm } from "@/components/user-management/CreateUserForm";
import { EditUserDialog } from "@/components/user-management/EditUserDialog";
import { DeleteUserDialog } from "@/components/user-management/DeleteUserDialog";
import { useUserRole } from "@/hooks/useUserRole";
import { useUpdateProfile, useDeleteUser } from "@/hooks/useProfiles";

type AppRole = Database["public"]["Enums"]["app_role"];

const UserManagement = () => {
  const [assigningRoleToUserId, setAssigningRoleToUserId] = useState<string>("");
  const [assignRole, setAssignRole] = useState<AppRole | "">("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userRole, isLoading: roleLoading, canManageUsers } = useUserRole();

  // Profile management mutations
  const updateProfileMutation = useUpdateProfile();
  const deleteUserMutation = useDeleteUser();

  // Get all users with their roles (if any)
  const { data: usersWithRoles, isLoading: loadingUsers } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles(id, role)
        `)
        .order('first_name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: userRoles, isLoading: loadingRoles } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          profiles!inner(first_name, last_name, email)
        `);
      
      if (error) throw error;
      return data;
    }
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      if (!canManageUsers()) {
        throw new Error("You don't have permission to remove roles");
      }
      
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Role removed successfully" });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
    },
    onError: (error) => {
      toast({ title: "Error removing role", description: error.message, variant: "destructive" });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, newRole }: { roleId: string; newRole: AppRole }) => {
      if (!canManageUsers()) {
        throw new Error("You don't have permission to update roles");
      }
      
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('id', roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
    },
    onError: (error) => {
      throw error;
    }
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      if (!canManageUsers()) {
        throw new Error("You don't have permission to assign roles");
      }
      
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Role assigned successfully" });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      setAssigningRoleToUserId("");
      setAssignRole("");
    },
    onError: (error) => {
      toast({ title: "Error assigning role", description: error.message, variant: "destructive" });
    }
  });

  const handleAssignRoleInline = () => {
    if (!canManageUsers()) {
      toast({ 
        title: "Access Denied", 
        description: "You don't have permission to assign roles", 
        variant: "destructive" 
      });
      return;
    }
    
    if (assigningRoleToUserId && assignRole) {
      assignRoleMutation.mutate({ userId: assigningRoleToUserId, role: assignRole as AppRole });
    }
  };

  const handleUpdateProfile = async (userId: string, data: any) => {
    await updateProfileMutation.mutateAsync({ userId, data });
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUserMutation.mutateAsync(userId);
  };

  const handleRemoveRole = async (roleId: string) => {
    await removeRoleMutation.mutateAsync(roleId);
  };

  const roleLabels: Record<AppRole, string> = {
    administrator: "Administrator",
    finance_administrator: "Finance Administrator", 
    pastor: "Pastor",
    general_secretary: "General Secretary",
    finance_elder: "Finance Elder",
    data_entry_clerk: "Data Entry Clerk",
    finance_manager: "Finance Manager",
    head_of_department: "Head of Department",
    secretary: "Secretary",
    treasurer: "Church Treasurer",
    department_treasurer: "Department Treasurer",
    department_member: "Department Member"
  };

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case 'administrator': return 'bg-red-100 text-red-800';
      case 'finance_administrator': return 'bg-orange-100 text-orange-800';
      case 'pastor': return 'bg-purple-100 text-purple-800';
      case 'general_secretary': return 'bg-indigo-100 text-indigo-800';
      case 'finance_elder': return 'bg-yellow-100 text-yellow-800';
      case 'finance_manager': return 'bg-green-100 text-green-800';
      case 'treasurer': return 'bg-blue-100 text-blue-800';
      case 'department_treasurer': return 'bg-green-100 text-green-800 border-green-200';
      case 'head_of_department': return 'bg-blue-100 text-blue-800';
      case 'department_member': return 'bg-purple-100 text-purple-800';
      case 'secretary': return 'bg-gray-100 text-gray-800';
      case 'data_entry_clerk': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRolesByCategory = (): {
    leadership: AppRole[];
    financial: AppRole[];
    departmental: AppRole[];
    operational: AppRole[];
  } => {
    return {
      leadership: ['administrator', 'pastor', 'general_secretary'] as AppRole[],
      financial: ['finance_administrator', 'finance_manager', 'finance_elder', 'treasurer', 'department_treasurer'] as AppRole[],
      departmental: ['head_of_department', 'secretary', 'department_member'] as AppRole[],
      operational: ['data_entry_clerk'] as AppRole[]
    };
  };

  const roleCategories = getRolesByCategory();

  if (roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">Loading your permissions...</div>
        </div>
      </DashboardLayout>
    );
  }

  const headerContent = (
    <>
      {!canManageUsers() && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-700">
            You have read-only access. Only Administrators can manage user roles.
          </span>
        </div>
      )}
    </>
  );

  return (
    <DashboardLayout 
      title="User Management" 
      description="Manage user accounts and role assignments"
      headerContent={headerContent}
    >
      <div className="space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {canManageUsers() ? (
            <CreateUserForm roleLabels={roleLabels} roleCategories={roleCategories} />
          ) : (
            <Card className="bg-gray-50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-500">
                  <Lock className="h-5 w-5" />
                  Create New User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Lock className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm">
                    Only Administrators can create new users.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Your current role: {userRole ? roleLabels[userRole] : 'No Role'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Users:</span>
                  <span className="font-semibold">{usersWithRoles?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Users with Roles:</span>
                  <span className="font-semibold">{userRoles?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Users without Roles:</span>
                  <span className="font-semibold">{(usersWithRoles?.length || 0) - (userRoles?.length || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersWithRoles?.map((user) => {
                    const userRole = user.user_roles?.[0]; // Get the first role if any
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || "—"}</TableCell>
                        <TableCell>
                          {userRole ? (
                            <Badge className={getRoleBadgeColor(userRole.role)}>
                              {roleLabels[userRole.role]}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              No Role
                            </Badge>
                          )}
                        </TableCell>
                         <TableCell>
                          <div className="flex items-center gap-2">
                            {canManageUsers() ? (
                              <>
                                <EditUserDialog
                                  user={user}
                                  userRole={userRole}
                                  roleLabels={roleLabels}
                                  roleCategories={roleCategories}
                                  onUpdateProfile={handleUpdateProfile}
                                  onUpdateRole={async (roleId: string, role: AppRole) => {
                                    await updateRoleMutation.mutateAsync({ roleId, newRole: role });
                                  }}
                                  onAssignRole={async (userId: string, role: AppRole) => {
                                    await assignRoleMutation.mutateAsync({ userId, role });
                                  }}
                                  onRemoveRole={handleRemoveRole}
                                  isLoading={updateProfileMutation.isPending || updateRoleMutation.isPending || assignRoleMutation.isPending || removeRoleMutation.isPending}
                                />
                                
                                <DeleteUserDialog
                                  user={user}
                                  onDelete={handleDeleteUser}
                                  isLoading={deleteUserMutation.isPending}
                                />
                              </>
                            ) : (
                              <div className="flex items-center gap-1 text-gray-400">
                                <Lock className="h-3 w-3" />
                                <span className="text-xs">View Only</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
