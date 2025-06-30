import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Lock, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCreateContributor } from "@/hooks/useContributors";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
interface CreateContributorDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "header";
}
export function CreateContributorDialog({
  open,
  onOpenChange,
  variant = "default"
}: CreateContributorDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const {
    mutate: createContributor,
    isPending
  } = useCreateContributor();
  const {
    canCreateContributors
  } = useUserRole();
  const {
    toast
  } = useToast();
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateContributors()) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to create contributors",
        variant: "destructive"
      });
      return;
    }
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required",
        variant: "destructive"
      });
      return;
    }
    createContributor({
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined
    }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Contributor created successfully"
        });
        setFormData({
          name: "",
          email: "",
          phone: ""
        });
        setIsOpen(false);
      },
      onError: error => {
        toast({
          title: "Error",
          description: "Failed to create contributor",
          variant: "destructive"
        });
        console.error("Error creating contributor:", error);
      }
    });
  };
  const renderTrigger = () => {
    if (variant === "header") {
      if (!canCreateContributors()) {
        return <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" disabled className="text-gray-400">
                  <Lock className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Access Restricted</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>;
      }
      return <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)} className="text-gray-600 hover:text-gray-900">
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Contributor</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>;
    }

    // Default full-width button for dashboard
    if (!canCreateContributors()) {
      return <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" disabled className="w-full justify-start gap-3 h-12 opacity-50">
                <Lock className="h-4 w-4" />
                Access Restricted
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>You need additional permissions to create contributors</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>;
    }
    return <Button variant="outline" className="w-full justify-start gap-3 h-12">
        <Users className="h-4 w-4" />
        Add Contributor
      </Button>;
  };
  return <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {renderTrigger()}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Contributor</DialogTitle>
          <DialogDescription>
            Create a new contributor profile. Name is required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} placeholder="Enter contributor name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={e => setFormData({
              ...formData,
              email: e.target.value
            })} placeholder="Enter email address" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone} onChange={e => setFormData({
              ...formData,
              phone: e.target.value
            })} placeholder="Enter phone number" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Contributor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
}
