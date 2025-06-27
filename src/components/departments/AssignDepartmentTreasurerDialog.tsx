
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign } from "lucide-react";
import { useProfiles } from "@/hooks/useProfiles";
import { useAssignDepartmentTreasurer } from "@/hooks/useDepartmentTreasurers";

interface AssignDepartmentTreasurerDialogProps {
  departmentId: string;
  departmentName: string;
  onClose: () => void;
}

export function AssignDepartmentTreasurerDialog({ 
  departmentId, 
  departmentName, 
  onClose 
}: AssignDepartmentTreasurerDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  const { data: profiles } = useProfiles();
  const assignTreasurerMutation = useAssignDepartmentTreasurer();

  const handleAssign = async () => {
    if (selectedUserId) {
      await assignTreasurerMutation.mutateAsync({
        userId: selectedUserId,
        departmentId
      });
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Department Treasurer to {departmentName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Department Treasurer Role:</strong> This user will have financial access 
              limited to this department's assigned funds and contributions only.
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedUserId || assignTreasurerMutation.isPending}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {assignTreasurerMutation.isPending ? "Assigning..." : "Assign Treasurer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
