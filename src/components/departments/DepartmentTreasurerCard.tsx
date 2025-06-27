
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserMinus, UserPlus, DollarSign } from "lucide-react";
import { useDepartmentTreasurers, useRemoveDepartmentTreasurer } from "@/hooks/useDepartmentTreasurers";
import { useDepartmentFinancialPermissions } from "@/hooks/useDepartmentFinancialPermissions";
import { useState } from "react";
import { AssignDepartmentTreasurerDialog } from "./AssignDepartmentTreasurerDialog";

interface DepartmentTreasurerCardProps {
  departmentId: string;
  departmentName: string;
}

export function DepartmentTreasurerCard({ departmentId, departmentName }: DepartmentTreasurerCardProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const { data: treasurers, isLoading } = useDepartmentTreasurers(departmentId);
  const { canAssignDepartmentTreasurers } = useDepartmentFinancialPermissions(departmentId);
  const removeTreasurerMutation = useRemoveDepartmentTreasurer();

  const handleRemoveTreasurer = (treasurerId: string) => {
    removeTreasurerMutation.mutate(treasurerId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Department Treasurers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading treasurers...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Department Treasurers
            </div>
            {canAssignDepartmentTreasurers() && (
              <Button 
                size="sm" 
                onClick={() => setShowAssignDialog(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Assign Treasurer
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {treasurers && treasurers.length > 0 ? (
            <div className="space-y-3">
              {treasurers.map((treasurer) => (
                <div key={treasurer.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">
                        {treasurer.user?.first_name} {treasurer.user?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{treasurer.user?.email}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Department Treasurer
                    </Badge>
                  </div>
                  {canAssignDepartmentTreasurers() && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveTreasurer(treasurer.id)}
                      disabled={removeTreasurerMutation.isPending}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No department treasurers assigned</p>
              <p className="text-sm mt-1">Assign a treasurer to manage this department's finances</p>
            </div>
          )}
        </CardContent>
      </Card>

      {showAssignDialog && (
        <AssignDepartmentTreasurerDialog
          departmentId={departmentId}
          departmentName={departmentName}
          onClose={() => setShowAssignDialog(false)}
        />
      )}
    </>
  );
}
