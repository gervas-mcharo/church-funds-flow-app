
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useDeleteContributor } from "@/hooks/useContributors";
import { useToast } from "@/hooks/use-toast";

interface Contributor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface DeleteContributorDialogProps {
  contributor: Contributor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteContributorDialog({ contributor, open, onOpenChange }: DeleteContributorDialogProps) {
  const { mutate: deleteContributor, isPending } = useDeleteContributor();
  const { toast } = useToast();

  const handleDelete = () => {
    if (!contributor) return;

    deleteContributor(contributor.id, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: `${contributor.name} has been deleted successfully`,
        });
        onOpenChange(false);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to delete contributor",
          variant: "destructive",
        });
        console.error("Error deleting contributor:", error);
      },
    });
  };

  if (!contributor) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Delete Contributor
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{contributor.name}</strong>? 
            This action cannot be undone and will remove all associated contribution history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Deleting..." : "Delete Contributor"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
