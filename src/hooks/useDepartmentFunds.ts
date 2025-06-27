
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DepartmentFund {
  id: string;
  department_id: string;
  fund_type_id: string;
  assigned_at: string;
  assigned_by: string | null;
  is_active: boolean;
  fund_type?: {
    name: string;
    current_balance: number;
  };
  department?: {
    name: string;
  };
}

export function useDepartmentFunds(departmentId?: string) {
  return useQuery({
    queryKey: ['department-funds', departmentId],
    queryFn: async () => {
      let query = supabase
        .from('department_funds')
        .select(`
          *,
          fund_type:fund_types(name, current_balance),
          department:departments(name)
        `)
        .eq('is_active', true);
      
      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }
      
      query = query.order('assigned_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as DepartmentFund[];
    }
  });
}

export function useAssignFundToDepartment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ departmentId, fundTypeId }: { departmentId: string; fundTypeId: string }) => {
      const { data, error } = await supabase
        .from('department_funds')
        .insert({
          department_id: departmentId,
          fund_type_id: fundTypeId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-funds'] });
      toast({
        title: "Fund assigned to department successfully",
        description: "The fund has been assigned to the department."
      });
    },
    onError: (error) => {
      toast({
        title: "Error assigning fund to department",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useRemoveFundFromDepartment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (departmentFundId: string) => {
      const { error } = await supabase
        .from('department_funds')
        .update({ is_active: false })
        .eq('id', departmentFundId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-funds'] });
      toast({
        title: "Fund removed from department successfully",
        description: "The fund has been removed from the department."
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing fund from department",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
