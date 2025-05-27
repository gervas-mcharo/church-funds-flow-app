import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { User, UserPlus, Edit, Trash2, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const UserManagement = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const [editingRoleId, setEditingRoleId] = useState<string>("");
  const [newRole, setNewRole] = useState<AppRole | "">("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
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
      setSelectedUserId("");
      setSelectedRole("");
    },
    onError: (error) => {
      toast({ title: "Error assigning role", description: error.message, variant: "destructive" });
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
      setEditingRoleId("");
      setNewRole("");
    },
    onError: (error) => {
      toast({ title: "Error updating role", description: error.message, variant: "destructive" });
    }
  });

  const handleAssignRole = () => {
    if (selectedUserId && selectedRole) {
      assignRoleMutation.mutate({ userId: selectedUserId, role: selectedRole as AppRole });
    }
  };

  const handleUpdateRole = () => {
    if (editingRoleId && newRole) {
      updateRoleMutation.mutate({ roleId: editingRoleId, newRole: newRole as AppRole });
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Assign Role
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="user">Select User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles?.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name} {profile.last_name} ({profile.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="role">Select Role</Label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="space-y-2">
                      <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Leadership</div>
                      {roleCategories.leadership.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role as AppRole]}
                        </SelectItem>
                      ))}
                      
                      <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Financial</div>
                      {roleCategories.financial.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role as AppRole]}
                        </SelectItem>
                      ))}
                      
                      <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Departmental</div>
                      {roleCategories.departmental.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role as AppRole]}
                        </SelectItem>
                      ))}
                      
                      <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">Operational</div>
                      {roleCategories.operational.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role as AppRole]}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                className="w-full" 
                onClick={handleAssignRole}
                disabled={!selectedUserId || !selectedRole || assignRoleMutation.isPending}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Role
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Roles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRoles ? (
                  <div className="text-center py-8">Loading user roles...</div>
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
                      {userRoles?.map((userRole) => (
                        <TableRow key={userRole.id}>
                          <TableCell className="font-medium">
                            {userRole.profiles?.first_name} {userRole.profiles?.last_name}
                          </TableCell>
                          <TableCell>{userRole.profiles?.email}</TableCell>
                          <TableCell>
                            {editingRoleId === userRole.id ? (
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
                            ) : (
                              <Badge className={getRoleBadgeColor(userRole.role)}>
                                {roleLabels[userRole.role]}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
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
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
