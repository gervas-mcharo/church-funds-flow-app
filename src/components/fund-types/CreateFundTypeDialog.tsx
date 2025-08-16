
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCreateFundType } from "@/hooks/useCreateFundType";

interface CreateFundTypeDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "header";
}

export const CreateFundTypeDialog = ({ open, onOpenChange, variant = "default" }: CreateFundTypeDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [internalOpen, setInternalOpen] = useState(false);
  const createFundType = useCreateFundType();

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? (onOpenChange || (() => {})) : setInternalOpen;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const balance = openingBalance ? parseFloat(openingBalance) : 0;

    createFundType.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      opening_balance: balance,
      current_balance: balance,
    }, {
      onSuccess: () => {
        setName("");
        setDescription("");
        setOpeningBalance("");
        setIsOpen(false);
      }
    });
  };

  const renderTrigger = () => {
    if (variant === "header") {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create Fund</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // Default full-width button for dashboard
    return (
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Create Fund
      </Button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {renderTrigger()}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Fund Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Fund Type Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Building Fund"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this fund type..."
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="opening-balance">Opening Balance</Label>
            <Input
              id="opening-balance"
              type="number"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createFundType.isPending}>
              {createFundType.isPending ? "Adding..." : "Add Fund Type"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
