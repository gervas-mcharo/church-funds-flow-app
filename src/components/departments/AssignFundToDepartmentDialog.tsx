
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "lucide-react";
import { useFundTypes } from "@/hooks/useFundTypes";
import { useAssignFundToDepartment, useDepartmentFunds } from "@/hooks/useDepartmentFunds";

interface AssignFundToDepartmentDialogProps {
  departmentId: string;
  departmentName: string;
  onClose: () => void;
}

export function AssignFundToDepartmentDialog({ 
  departmentId, 
  departmentName, 
  onClose 
}: AssignFundToDepartmentDialogProps) {
  const [selectedFundTypeId, setSelectedFundTypeId] = useState<string>("");
  
  const { data: fundTypes } = useFundTypes();
  const { data: assignedFunds } = useDepartmentFunds(departmentId);
  const assignFundMutation = useAssignFundToDepartment();

  // Filter out already assigned funds
  const availableFunds = fundTypes?.filter(fund => 
    !assignedFunds?.some(assigned => assigned.fund_type_id === fund.id)
  );

  const handleAssign = async () => {
    if (selectedFundTypeId) {
      await assignFundMutation.mutateAsync({
        departmentId,
        fundTypeId: selectedFundTypeId
      });
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Fund to {departmentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="fund">Select Fund</Label>
            <Select value={selectedFundTypeId} onValueChange={setSelectedFundTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a fund..." />
              </SelectTrigger>
              <SelectContent>
                {availableFunds?.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.name} (${fund.current_balance?.toLocaleString() || '0'})
                  </SelectItem>
                ))}
                {(!availableFunds || availableFunds.length === 0) && (
                  <SelectItem value="" disabled>
                    No available funds to assign
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Fund Assignment:</strong> This fund will be accessible to department 
              treasurers assigned to this department for contributions and financial management.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedFundTypeId || assignFundMutation.isPending || (!availableFunds || availableFunds.length === 0)}
            >
              <Database className="h-4 w-4 mr-2" />
              {assignFundMutation.isPending ? "Assigning..." : "Assign Fund"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
