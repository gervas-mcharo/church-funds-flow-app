
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserMinus, UserPlus, Users } from "lucide-react";
import { useDepartmentPersonnel, useRemovePersonnel } from "@/hooks/useDepartmentPersonnel";
import { useDepartmentPermissions } from "@/hooks/useDepartmentPermissions";
import { useState } from "react";
import { AssignPersonnelDialog } from "./AssignPersonnelDialog";
import { DepartmentTreasurerCard } from "./DepartmentTreasurerCard";
import { DepartmentFundsCard } from "./DepartmentFundsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DepartmentPersonnelCardProps {
  departmentId: string;
  departmentName: string;
}

export function DepartmentPersonnelCard({ departmentId, departmentName }: DepartmentPersonnelCardProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const { data: personnel, isLoading } = useDepartmentPersonnel(departmentId);
  const { canManagePersonnel } = useDepartmentPermissions(departmentId);
  const removePersonnelMutation = useRemovePersonnel();

  const handleRemovePersonnel = (personnelId: string) => {
    removePersonnelMutation.mutate(personnelId);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'head_of_department': return 'bg-purple-100 text-purple-800';
      case 'secretary': return 'bg-blue-100 text-blue-800';
      case 'department_member': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'head_of_department': return 'Head of Department';
      case 'secretary': return 'Secretary';
      case 'department_member': return 'Member';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">Loading personnel...</div>
    );
  }

  return (
    <Tabs defaultValue="personnel" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="personnel">Personnel</TabsTrigger>
        <TabsTrigger value="treasurers">Treasurers</TabsTrigger>
        <TabsTrigger value="funds">Funds</TabsTrigger>
      </TabsList>
      
      <TabsContent value="personnel" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Department Personnel
              </div>
              {canManagePersonnel() && (
                <Button 
                  size="sm" 
                  onClick={() => setShowAssignDialog(true)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Assign Personnel
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {personnel && personnel.length > 0 ? (
              <div className="space-y-3">
                {personnel.map((person) => (
                  <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">
                          {person.user?.first_name} {person.user?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{person.user?.email}</p>
                      </div>
                      <Badge className={getRoleBadgeColor(person.role)}>
                        {getRoleLabel(person.role)}
                      </Badge>
                    </div>
                    {canManagePersonnel() && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemovePersonnel(person.id)}
                        disabled={removePersonnelMutation.isPending}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No personnel assigned to this department</p>
                <p className="text-sm mt-1">Assign personnel to manage department operations</p>
              </div>
            )}
          </CardContent>
        </Card>

        {showAssignDialog && (
          <AssignPersonnelDialog
            departmentId={departmentId}
            departmentName={departmentName}
            onClose={() => setShowAssignDialog(false)}
          />
        )}
      </TabsContent>

      <TabsContent value="treasurers">
        <DepartmentTreasurerCard 
          departmentId={departmentId} 
          departmentName={departmentName} 
        />
      </TabsContent>

      <TabsContent value="funds">
        <DepartmentFundsCard 
          departmentId={departmentId} 
          departmentName={departmentName} 
        />
      </TabsContent>
    </Tabs>
  );
}
