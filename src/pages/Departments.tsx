
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Building2, Plus, Users, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DepartmentPersonnelCard } from "@/components/departments/DepartmentPersonnelCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DeleteDepartmentDialog } from "@/components/departments/DeleteDepartmentDialog";
import { DepartmentAccessGuard } from "@/components/departments/DepartmentAccessGuard";
import { PermissionStatusBadge } from "@/components/contributors/PermissionStatusBadge";
import { useDepartmentPermissions } from "@/hooks/useDepartmentPermissions";

interface Department {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const Departments = () => {
  const [newDepartment, setNewDepartment] = useState({ name: "", description: "" });
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { 
    canCreateDepartments, 
    canEditDepartments, 
    canDeleteDepartments,
    getDepartmentAccessLevel,
    userRole,
    isLoading: permissionsLoading 
  } = useDepartmentPermissions();

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Department[];
    }
  });

  const createDepartmentMutation = useMutation({
    mutationFn: async (department: { name: string; description: string }) => {
      const { data, error } = await supabase
        .from('departments')
        .insert({
          name: department.name,
          description: department.description || null,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setNewDepartment({ name: "", description: "" });
      setShowCreateDialog(false);
      toast({ title: "Department created successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error creating department", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async (department: Department) => {
      const { data, error } = await supabase
        .from('departments')
        .update({
          name: department.name,
          description: department.description,
          is_active: department.is_active
        })
        .eq('id', department.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setEditingDepartment(null);
      setShowEditDialog(false);
      toast({ title: "Department updated successfully" });
    },
    onError: (error) => {
      toast({ 
        title: "Error updating department", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleCreateDepartment = () => {
    if (!canCreateDepartments()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create departments",
        variant: "destructive"
      });
      return;
    }

    if (newDepartment.name.trim()) {
      createDepartmentMutation.mutate(newDepartment);
    }
  };

  const handleUpdateDepartment = () => {
    if (!canEditDepartments()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit departments",
        variant: "destructive"
      });
      return;
    }

    if (editingDepartment) {
      updateDepartmentMutation.mutate(editingDepartment);
    }
  };

  const handleDeleteDepartment = (department: Department) => {
    if (!canDeleteDepartments()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to delete departments",
        variant: "destructive"
      });
      return;
    }
    setDepartmentToDelete(department);
  };

  const togglePersonnelPanel = (departmentId: string) => {
    setSelectedDepartmentId(selectedDepartmentId === departmentId ? null : departmentId);
  };

  if (isLoading || permissionsLoading) {
    return (
      <DashboardLayout>
        <div>Loading departments...</div>
      </DashboardLayout>
    );
  }

  const headerContent = (
    <div className="flex items-center gap-4">
      <PermissionStatusBadge 
        accessLevel={getDepartmentAccessLevel()} 
        userRole={userRole || undefined}
      />
      {canCreateDepartments() && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter department name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter department description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateDepartment}
                  disabled={!newDepartment.name.trim() || createDepartmentMutation.isPending}
                >
                  {createDepartmentMutation.isPending ? "Creating..." : "Create Department"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  return (
    <DashboardLayout 
      title="Departments" 
      description="Manage organizational departments and personnel"
      headerContent={headerContent}
    >
      <DepartmentAccessGuard requirePermission="view">
        <div className="space-y-6">
          {/* Single Column Layout */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">All Departments</h2>
            <div className="space-y-4">
              {departments?.map((department) => (
                <div key={department.id} className="space-y-0">
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          {department.name}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={department.is_active ? "default" : "secondary"}>
                            {department.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {canEditDepartments() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingDepartment(department);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteDepartments() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDepartment(department)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {department.description && (
                        <p className="text-gray-600 mb-4">{department.description}</p>
                      )}
                      <Collapsible 
                        open={selectedDepartmentId === department.id}
                        onOpenChange={() => togglePersonnelPanel(department.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-between"
                          >
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              Manage Personnel
                            </div>
                            {selectedDepartmentId === department.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4">
                          <DepartmentAccessGuard 
                            requirePermission="view" 
                            departmentId={department.id}
                            fallbackMessage="You don't have permission to view personnel for this department"
                          >
                            <DepartmentPersonnelCard 
                              departmentId={department.id}
                              departmentName={department.name}
                            />
                          </DepartmentAccessGuard>
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Department Dialog */}
          {canEditDepartments() && (
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Department</DialogTitle>
                </DialogHeader>
                {editingDepartment && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-name">Department Name</Label>
                      <Input
                        id="edit-name"
                        value={editingDepartment.name}
                        onChange={(e) => setEditingDepartment(prev => 
                          prev ? { ...prev, name: e.target.value } : null
                        )}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editingDepartment.description || ""}
                        onChange={(e) => setEditingDepartment(prev => 
                          prev ? { ...prev, description: e.target.value } : null
                        )}
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is-active"
                        checked={editingDepartment.is_active}
                        onCheckedChange={(checked) => setEditingDepartment(prev => 
                          prev ? { ...prev, is_active: checked } : null
                        )}
                      />
                      <Label htmlFor="is-active">Active</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpdateDepartment}
                        disabled={updateDepartmentMutation.isPending}
                      >
                        {updateDepartmentMutation.isPending ? "Updating..." : "Update Department"}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}

          {/* Delete Department Dialog */}
          <DeleteDepartmentDialog
            department={departmentToDelete}
            open={!!departmentToDelete}
            onOpenChange={(open) => !open && setDepartmentToDelete(null)}
          />
        </div>
      </DepartmentAccessGuard>
    </DashboardLayout>
  );
};

export default Departments;
