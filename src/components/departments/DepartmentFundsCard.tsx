
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Database } from "lucide-react";
import { useDepartmentFunds, useAssignFundToDepartment, useRemoveFundFromDepartment } from "@/hooks/useDepartmentFunds";
import { useDepartmentFinancialPermissions } from "@/hooks/useDepartmentFinancialPermissions";
import { useState } from "react";
import { AssignFundToDepartmentDialog } from "./AssignFundToDepartmentDialog";

interface DepartmentFundsCardProps {
  departmentId: string;
  departmentName: string;
}

export function DepartmentFundsCard({ departmentId, departmentName }: DepartmentFundsCardProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const { data: departmentFunds, isLoading } = useDepartmentFunds(departmentId);
  const { canAssignFundsToDepartments } = useDepartmentFinancialPermissions(departmentId);
  const removeFundMutation = useRemoveFundFromDepartment();

  const handleRemoveFund = (departmentFundId: string) => {
    removeFundMutation.mutate(departmentFundId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Assigned Funds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading funds...</div>
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
              <Database className="h-5 w-5" />
              Assigned Funds
            </div>
            {canAssignFundsToDepartments() && (
              <Button 
                size="sm" 
                onClick={() => setShowAssignDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Assign Fund
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {departmentFunds && departmentFunds.length > 0 ? (
            <div className="space-y-3">
              {departmentFunds.map((fund) => (
                <div key={fund.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{fund.fund_type?.name}</p>
                      <p className="text-sm text-gray-600">
                        Balance: ${fund.fund_type?.current_balance?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      Assigned Fund
                    </Badge>
                  </div>
                  {canAssignFundsToDepartments() && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveFund(fund.id)}
                      disabled={removeFundMutation.isPending}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Database className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No funds assigned to this department</p>
              <p className="text-sm mt-1">Assign funds to enable department financial management</p>
            </div>
          )}
        </CardContent>
      </Card>

      {showAssignDialog && (
        <AssignFundToDepartmentDialog
          departmentId={departmentId}
          departmentName={departmentName}
          onClose={() => setShowAssignDialog(false)}
        />
      )}
    </>
  );
}
