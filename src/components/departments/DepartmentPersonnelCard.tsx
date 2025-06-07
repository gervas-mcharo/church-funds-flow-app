
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, UserMinus } from "lucide-react";
import { useDepartmentPersonnel, useRemovePersonnel } from "@/hooks/useDepartmentPersonnel";
import { AssignPersonnelDialog } from "./AssignPersonnelDialog";
import { useState } from "react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface DepartmentPersonnelCardProps {
  departmentId: string;
  departmentName: string;
}

const roleLabels = {
  head_of_department: "Head of Department",
  secretary: "Secretary", 
  treasurer: "Treasurer",
  department_member: "Department Member",
  pastor: "Pastor",
  general_secretary: "General Secretary",
  finance_elder: "Finance Elder",
  assistant_pastor: "Assistant Pastor",
  elder: "Elder",
  deacon: "Deacon",
  deaconess: "Deaconess",
  youth_leader: "Youth Leader",
  choir_director: "Choir Director",
  sunday_school_teacher: "Sunday School Teacher",
  usher: "Usher",
  security: "Security",
  media_team: "Media Team",
  maintenance: "Maintenance",
  visitor: "Visitor",
  administrator: "Administrator",
  data_entry_clerk: "Data Entry Clerk",
  finance_manager: "Finance Manager",
  super_administrator: "Super Administrator",
  finance_administrator: "Finance Administrator",
  contributor: "Contributor"
};

const roleColors = {
  head_of_department: "bg-purple-100 text-purple-800",
  secretary: "bg-blue-100 text-blue-800",
  treasurer: "bg-green-100 text-green-800",
  department_member: "bg-gray-100 text-gray-800",
  pastor: "bg-red-100 text-red-800",
  general_secretary: "bg-indigo-100 text-indigo-800",
  finance_elder: "bg-yellow-100 text-yellow-800",
  assistant_pastor: "bg-pink-100 text-pink-800",
  elder: "bg-orange-100 text-orange-800",
  deacon: "bg-teal-100 text-teal-800",
  deaconess: "bg-cyan-100 text-cyan-800",
  youth_leader: "bg-lime-100 text-lime-800",
  choir_director: "bg-violet-100 text-violet-800",
  sunday_school_teacher: "bg-amber-100 text-amber-800",
  usher: "bg-emerald-100 text-emerald-800",
  security: "bg-slate-100 text-slate-800",
  media_team: "bg-sky-100 text-sky-800",
  maintenance: "bg-stone-100 text-stone-800",
  visitor: "bg-neutral-100 text-neutral-800",
  administrator: "bg-red-100 text-red-800",
  data_entry_clerk: "bg-blue-100 text-blue-800",
  finance_manager: "bg-green-100 text-green-800",
  super_administrator: "bg-purple-100 text-purple-800",
  finance_administrator: "bg-yellow-100 text-yellow-800",
  contributor: "bg-gray-100 text-gray-800"
};

export function DepartmentPersonnelCard({ departmentId, departmentName }: DepartmentPersonnelCardProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const { data: personnel, isLoading } = useDepartmentPersonnel(departmentId);
  const removePersonnelMutation = useRemovePersonnel();

  const handleRemovePersonnel = (personnelId: string) => {
    if (confirm("Are you sure you want to remove this person from the department?")) {
      removePersonnelMutation.mutate(personnelId);
    }
  };

  const groupedPersonnel = personnel?.reduce((acc, person) => {
    if (!acc[person.role]) {
      acc[person.role] = [];
    }
    acc[person.role].push(person);
    return acc;
  }, {} as Record<AppRole, typeof personnel>) || {};

  if (isLoading) {
    return <div>Loading personnel...</div>;
  }

  return (
    <>
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {departmentName} Personnel
            </div>
            <Button
              size="sm"
              onClick={() => setShowAssignDialog(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Personnel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedPersonnel).length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No personnel assigned to this department.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedPersonnel).map(([role, people]) => (
                <div key={role} className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700 uppercase tracking-wide">
                    {roleLabels[role as AppRole]}
                  </h4>
                  <div className="space-y-2">
                    {people?.map((person) => (
                      <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">
                              {person.user?.first_name} {person.user?.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{person.user?.email}</p>
                          </div>
                          <Badge className={roleColors[person.role as AppRole]}>
                            {roleLabels[person.role as AppRole]}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePersonnel(person.id)}
                          disabled={removePersonnelMutation.isPending}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
    </>
  );
}
