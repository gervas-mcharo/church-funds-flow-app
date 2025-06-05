
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit } from "lucide-react";
import { useUpdateContributor } from "@/hooks/useContributors";
import { useToast } from "@/hooks/use-toast";

interface Contributor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface EditContributorDialogProps {
  contributor: Contributor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditContributorDialog({ contributor, open, onOpenChange }: EditContributorDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const { mutate: updateContributor, isPending } = useUpdateContributor();
  const { toast } = useToast();

  useEffect(() => {
    if (contributor) {
      setFormData({
        name: contributor.name || "",
        email: contributor.email || "",
        phone: contributor.phone || "",
      });
    }
  }, [contributor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }

    updateContributor(
      {
        id: contributor.id,
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Contributor updated successfully",
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: "Failed to update contributor",
            variant: "destructive",
          });
          console.error("Error updating contributor:", error);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Contributor</DialogTitle>
          <DialogDescription>
            Update contributor information. Name is required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter contributor name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Contributor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
