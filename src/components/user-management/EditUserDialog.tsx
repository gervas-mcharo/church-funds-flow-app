import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator, SelectLabel } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Edit, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

interface EditUserDialogProps {
  user: Profile;
  userRole?: { id: string; role: AppRole } | null;
  roleLabels: Record<AppRole, string>;
  roleCategories: {
    leadership: AppRole[];
    financial: AppRole[];
    departmental: AppRole[];
    operational: AppRole[];
  };
  onUpdateProfile: (userId: string, data: { first_name: string; last_name: string; email: string; phone?: string }) => Promise<void>;
  onUpdateRole?: (roleId: string, newRole: AppRole) => Promise<void>;
  onAssignRole?: (userId: string, role: AppRole) => Promise<void>;
  onRemoveRole?: (roleId: string) => Promise<void>;
  isLoading: boolean;
}

export function EditUserDialog({ 
  user, 
  userRole, 
  roleLabels, 
  roleCategories, 
  onUpdateProfile, 
  onUpdateRole, 
  onAssignRole, 
  onRemoveRole, 
  isLoading 
}: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const { toast } = useToast();

  const initialRole = userRole?.role || "";

  useEffect(() => {
    if (open) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setSelectedRole(initialRole);
    }
  }, [open, user, initialRole]);

  const getRoleChangeMessage = () => {
    if (!initialRole && selectedRole) {
      return `Assigning role: ${roleLabels[selectedRole as AppRole]}`;
    }
    if (initialRole && !selectedRole) {
      return `Removing role: ${roleLabels[initialRole as AppRole]}`;
    }
    if (initialRole && selectedRole && initialRole !== selectedRole) {
      return `Changing role from ${roleLabels[initialRole as AppRole]} to ${roleLabels[selectedRole as AppRole]}`;
    }
    return "";
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      toast({
        title: "Validation Error",
        description: "First name, last name, and email are required",
        variant: "destructive"
      });
      return;
    }

    try {
      // Update profile
      await onUpdateProfile(user.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined
      });

      // Handle role changes
      const roleChanged = selectedRole !== initialRole;
      if (roleChanged) {
        if (!initialRole && selectedRole) {
          // Assign new role
          await onAssignRole?.(user.id, selectedRole as AppRole);
        } else if (initialRole && !selectedRole) {
          // Remove role
          await onRemoveRole?.(userRole!.id);
        } else if (initialRole && selectedRole) {
          // Update existing role
          await onUpdateRole?.(userRole!.id, selectedRole as AppRole);
        }
      }

      setOpen(false);
      toast({
        title: "Success",
        description: roleChanged ? "User profile and role updated successfully" : "User profile updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user profile information and role assignment
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Profile Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Profile Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">First Name *</Label>
                <Input
                  id="edit-firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Last Name *</Label>
                <Input
                  id="edit-lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <Separator />

          {/* Role Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Role Assignment</h3>
            <div>
              <Label htmlFor="edit-role">User Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Role</SelectItem>
                  <SelectSeparator />
                  
                  {/* Leadership Roles */}
                  <SelectLabel>Leadership</SelectLabel>
                  {roleCategories.leadership.map(role => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                  
                  <SelectSeparator />
                  
                  {/* Financial Roles */}
                  <SelectLabel>Financial</SelectLabel>
                  {roleCategories.financial.map(role => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                  
                  <SelectSeparator />
                  
                  {/* Departmental Roles */}
                  <SelectLabel>Departmental</SelectLabel>
                  {roleCategories.departmental.map(role => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                  
                  <SelectSeparator />
                  
                  {/* Operational Roles */}
                  <SelectLabel>Operational</SelectLabel>
                  {roleCategories.operational.map(role => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedRole !== initialRole && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {getRoleChangeMessage()}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || !firstName.trim() || !lastName.trim() || !email.trim()}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}