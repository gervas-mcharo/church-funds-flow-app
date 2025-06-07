import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, Edit, Trash2, Shield, UserPlus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { CreateUserForm } from "@/components/user-management/CreateUserForm";

type AppRole = Database["public"]["Enums"]["app_role"];

const UserManagement = () => {
  const [editingRoleId, setEditingRoleId] = useState<string>("");
  const [newRole, setNewRole] = useState<AppRole | "">("");
  const [assigningRoleToUserId, setAssigningRoleToUserId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('id', roleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Role updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      setEditingRoleId("");
      setNewRole("");
    },
    onError: (error) => {
      toast({ title: "Error updating role", description: error.message, variant: "destructive" });
    }
  });

  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
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
      setNewRole("");
    },
    onError: (error) => {
      toast({ title: "Error assigning role", description: error.message, variant: "destructive" });
    }
  });

  const handleUpdateRole = () => {
    if (editingRoleId && newRole) {
      updateRoleMutation.mutate({ roleId: editingRoleId, newRole: newRole as AppRole });
    }
  };

  const handleAssignRole = () => {
    if (assigningRoleToUserId && newRole) {
      assignRoleMutation.mutate({ userId: assigningRoleToUserId, role: newRole as AppRole });
    }
  };

  const roleLabels: Record<AppRole, string> = {
    super_administrator: "Super Administrator",
    administrator: "Administrator",
    finance_administrator: "Finance Administrator", 
    pastor: "Pastor",
    general_secretary: "General Secretary",
    finance_elder: "Finance Elder",
    data_entry_clerk: "Data Entry Clerk",
    finance_manager: "Finance Manager",
    head_of_department: "Head of Department",
    secretary: "Secretary",
    treasurer: "Treasurer",
    department_member: "Department Member",
    contributor: "Contributor"
  };

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case 'super_administrator': return 'bg-red-100 text-red-800 border-red-200';
      case 'administrator': return 'bg-red-100 text-red-800';
      case 'finance_administrator': return 'bg-orange-100 text-orange-800';
      case 'pastor': return 'bg-purple-100 text-purple-800';
      case 'general_secretary': return 'bg-indigo-100 text-indigo-800';
      case 'finance_elder': return 'bg-yellow-100 text-yellow-800';
      case 'finance_manager': return 'bg-green-100 text-green-800';
      case 'head_of_department': return 'bg-blue-100 text-blue-800';
      case 'department_member': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRolesByCategory = () => {
    return {
      leadership: ['super_administrator', 'administrator', 'pastor', 'general_secretary'],
      financial: ['finance_administrator', 'finance_manager', 'finance_elder', 'treasurer'],
      departmental: ['head_of_department', 'secretary', 'department_member'],
      operational: ['data_entry_clerk', 'contributor']
    };
  };

  const roleCategories = getRolesByCategory();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts and role assignments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CreateUserForm roleLabels={roleLabels} roleCategories={roleCategories} />

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
                        <TableCell>
                          {editingRoleId === userRole?.id ? (
                            <div className="flex items-center gap-2">
                              <Select value={newRole} onValueChange={(value) => setNewRole(value as AppRole)}>
                                <SelectTrigger className="w-48">
                                  <SelectValue placeholder="Select new role..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(roleLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" onClick={handleUpdateRole} disabled={updateRoleMutation.isPending}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditingRoleId("");
                                setNewRole("");
                              }}>
                                Cancel
                              </Button>
                            </div>
                          ) : assigningRoleToUserId === user.id ? (
                            <div className="flex items-center gap-2">
                              <Select value={newRole} onValueChange={(value) => setNewRole(value as AppRole)}>
                                <SelectTrigger className="w-48">
                                  <SelectValue placeholder="Select role..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(roleLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" onClick={handleAssignRole} disabled={assignRoleMutation.isPending}>
                                Assign
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setAssigningRoleToUserId("");
                                setNewRole("");
                              }}>
                                Cancel
                              </Button>
                            </div>
                          ) : userRole ? (
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
                            {userRole ? (
                              <>
                                {editingRoleId !== userRole.id && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setEditingRoleId(userRole.id);
                                      setNewRole(userRole.role);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => removeRoleMutation.mutate(userRole.id)}
                                  disabled={removeRoleMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAssigningRoleToUserId(user.id);
                                  setNewRole("");
                                }}
                                disabled={assigningRoleToUserId === user.id}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Assign Role
                              </Button>
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
