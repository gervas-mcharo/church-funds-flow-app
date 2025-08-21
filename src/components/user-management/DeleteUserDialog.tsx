import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface DeleteUserDialogProps {
  user: Profile;
  onDelete: (userId: string) => Promise<void>;
  isLoading: boolean;
}

export function DeleteUserDialog({ user, onDelete, isLoading }: DeleteUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const { toast } = useToast();

  const expectedConfirmText = `DELETE ${user.email}`;
  const isConfirmValid = confirmText === expectedConfirmText;

  const handleDelete = async () => {
    if (!isConfirmValid) {
      toast({
        title: "Confirmation Required",
        description: "Please type the confirmation text exactly as shown",
        variant: "destructive"
      });
      return;
    }

    try {
      await onDelete(user.id);
      setOpen(false);
      setConfirmText("");
      toast({
        title: "Success",
        description: "User has been permanently deleted"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) setConfirmText("");
    }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete User Account
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">
                ⚠️ This action cannot be undone!
              </p>
              <p className="text-sm text-muted-foreground">
                This will permanently delete:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>User profile and authentication account</li>
                <li>All assigned roles and permissions</li>
                <li>Department assignments and relationships</li>
                <li>Historical activity records</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm">
              <strong>User to delete:</strong>
            </p>
            <div className="rounded border p-3 bg-gray-50">
              <p className="font-medium">{user.first_name} {user.last_name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              {user.phone && <p className="text-sm text-gray-600">{user.phone}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm">
              To confirm deletion, type: <code className="bg-gray-100 px-1 rounded">{expectedConfirmText}</code>
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type confirmation text here"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading || !isConfirmValid}
            >
              {isLoading ? "Deleting..." : "Delete User"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}