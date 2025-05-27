import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Folder, Plus, Edit, Trash2, Users } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const Departments = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: departments, isLoading: loadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

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

  const { data: departmentPersonnel, isLoading: loadingDepartmentPersonnel } = useQuery({
    queryKey: ['department-personnel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('department_personnel')
        .select(`
          *,
          departments!inner(name),
          profiles!inner(first_name, last_name, email)
        `);
      
      if (error) throw error;
      return data;
    }
  });

  const createDepartmentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('departments')
        .insert({ name, description, is_active: true });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Department created successfully" });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setName("");
      setDescription("");
    },
    onError: (error: any) => {
      toast({ title: "Error creating department", description: error.message, variant: "destructive" });
    }
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async (departmentId: string) => {
      const { error } = await supabase
        .from('departments')
        .update({ name, description })
        .eq('id', departmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Department updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setSelectedDepartment("");
      setName("");
      setDescription("");
    },
    onError: (error: any) => {
      toast({ title: "Error updating department", description: error.message, variant: "destructive" });
    }
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (departmentId: string) => {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Department deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting department", description: error.message, variant: "destructive" });
    }
  });

  const assignPersonnelMutation = useMutation({
    mutationFn: async ({ departmentId, userId, role }: { departmentId: string; userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('department_personnel')
        .insert({ department_id: departmentId, user_id: userId, role });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Personnel assigned successfully" });
      queryClient.invalidateQueries({ queryKey: ['department-personnel'] });
      setSelectedDepartment("");
      setSelectedUser("");
      setSelectedRole("");
    },
    onError: (error: any) => {
      toast({ title: "Error assigning personnel", description: error.message, variant: "destructive" });
    }
  });

  const removePersonnelMutation = useMutation({
    mutationFn: async (personnelId: string) => {
      const { error } = await supabase
        .from('department_personnel')
        .delete()
        .eq('id', personnelId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Personnel removed successfully" });
      queryClient.invalidateQueries({ queryKey: ['department-personnel'] });
    },
    onError: (error: any) => {
      toast({ title: "Error removing personnel", description: error.message, variant: "destructive" });
    }
  });

  const handleAssignPersonnel = () => {
    if (selectedDepartment && selectedUser && selectedRole) {
      assignPersonnelMutation.mutate({ 
        departmentId: selectedDepartment, 
        userId: selectedUser, 
        role: selectedRole as AppRole 
      });
    }
  };

  const roleLabels: Record<AppRole, string> = {
    administrator: "Administrator",
    data_entry_clerk: "Data Entry Clerk", 
    finance_manager: "Finance Manager",
    head_of_department: "Head of Department",
    secretary: "Secretary",
    treasurer: "Treasurer",
    department_member: "Department Member"
  };

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case 'head_of_department': return 'bg-blue-100 text-blue-800';
      case 'secretary': return 'bg-green-100 text-green-800';
      case 'treasurer': return 'bg-yellow-100 text-yellow-800';
      case 'department_member': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Departments Management</h1>
          <p className="text-gray-600 mt-1">Manage church departments and ministries</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                Add New Department
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Department Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter department name" 
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter department description"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => createDepartmentMutation.mutate()}
                disabled={createDepartmentMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assign Personnel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose department..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="user">User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles?.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.first_name} {profile.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="head_of_department">Head of Department</SelectItem>
                    <SelectItem value="secretary">Secretary</SelectItem>
                    <SelectItem value="treasurer">Treasurer</SelectItem>
                    <SelectItem value="department_member">Department Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full" 
                onClick={handleAssignPersonnel}
                disabled={!selectedDepartment || !selectedUser || !selectedRole || assignPersonnelMutation.isPending}
              >
                <Users className="h-4 w-4 mr-2" />
                Assign Personnel
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDepartments ? (
              <div className="text-center py-8">Loading departments...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departments?.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="font-medium">{department.name}</TableCell>
                      <TableCell>{department.description}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedDepartment(department.id);
                            setName(department.name);
                            setDescription(department.description);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteDepartmentMutation.mutate(department.id)}
                          disabled={deleteDepartmentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Department Personnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingDepartmentPersonnel ? (
              <div className="text-center py-8">Loading department personnel...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentPersonnel?.map((personnel) => (
                    <TableRow key={personnel.id}>
                      <TableCell className="font-medium">
                        {personnel.profiles?.first_name} {personnel.profiles?.last_name}
                      </TableCell>
                      <TableCell>{personnel.profiles?.email}</TableCell>
                      <TableCell>{personnel.departments?.name}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(personnel.role)}>
                          {roleLabels[personnel.role as keyof typeof roleLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => removePersonnelMutation.mutate(personnel.id)}
                          disabled={removePersonnelMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Departments;
