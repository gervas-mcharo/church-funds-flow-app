
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { useProfiles } from "@/hooks/useProfiles";
import { useAssignPersonnel } from "@/hooks/useDepartmentPersonnel";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AssignPersonnelDialogProps {
  departmentId: string;
  departmentName: string;
  onClose: () => void;
}

const departmentRoles: AppRole[] = ['head_of_department', 'secretary', 'treasurer', 'member'];

const roleLabels = {
  head_of_department: "Head of Department",
  secretary: "Secretary",
  treasurer: "Treasurer", 
  member: "Member"
};

export function AssignPersonnelDialog({ departmentId, departmentName, onClose }: AssignPersonnelDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<AppRole | "">("");
  
  const { data: profiles } = useProfiles();
  const assignPersonnelMutation = useAssignPersonnel();

  const handleAssign = async () => {
    if (selectedUserId && selectedRole) {
      await assignPersonnelMutation.mutateAsync({
        departmentId,
        userId: selectedUserId,
        role: selectedRole as AppRole
      });
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Personnel to {departmentName}</DialogTitle>
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

          <div>
            <Label htmlFor="role">Department Role</Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role..." />
              </SelectTrigger>
              <SelectContent>
                {departmentRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssign}
              disabled={!selectedUserId || !selectedRole || assignPersonnelMutation.isPending}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {assignPersonnelMutation.isPending ? "Assigning..." : "Assign Personnel"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
