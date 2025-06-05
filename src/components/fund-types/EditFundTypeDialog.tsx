
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateFundType } from "@/hooks/useUpdateFundType";

interface EditFundTypeDialogProps {
  fundType: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditFundTypeDialog = ({ fundType, open, onOpenChange }: EditFundTypeDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const updateFundType = useUpdateFundType();

  useEffect(() => {
    if (fundType) {
      setName(fundType.name || "");
      setDescription(fundType.description || "");
    }
  }, [fundType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateFundType.mutate({
      id: fundType.id,
      name: name.trim(),
      description: description.trim() || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Fund Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Fund Type Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Building Fund"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this fund type..."
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateFundType.isPending}>
              {updateFundType.isPending ? "Updating..." : "Update Fund Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
