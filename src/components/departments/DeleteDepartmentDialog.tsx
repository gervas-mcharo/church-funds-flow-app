
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Department {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface DeleteDepartmentDialogProps {
  department: Department | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteDepartmentDialog({ department, open, onOpenChange }: DeleteDepartmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast({
        title: "Success",
        description: `${department?.name} has been deleted successfully`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete department",
        variant: "destructive",
      });
      console.error("Error deleting department:", error);
    },
  });

  const handleDelete = () => {
    if (!department) return;
    deleteDepartmentMutation.mutate(department.id);
  };

  if (!department) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Delete Department
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{department.name}</strong>? 
            This action cannot be undone and will remove all associated personnel assignments.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteDepartmentMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteDepartmentMutation.isPending ? "Deleting..." : "Delete Department"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
