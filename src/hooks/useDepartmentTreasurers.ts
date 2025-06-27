
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface DepartmentTreasurer {
  id: string;
  user_id: string;
  department_id: string;
  assigned_at: string;
  assigned_by: string | null;
  is_active: boolean;
  user?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  department?: {
    name: string;
  };
}

export function useDepartmentTreasurers(departmentId?: string) {
  return useQuery({
    queryKey: ['department-treasurers', departmentId],
    queryFn: async () => {
      let query = supabase
        .from('department_treasurers')
        .select(`
          *,
          profiles!user_id(first_name, last_name, email),
          departments!department_id(name)
        `)
        .eq('is_active', true);
      
      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }
      
      query = query.order('assigned_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      
      // Transform the data to match our interface
      return data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        department_id: item.department_id,
        assigned_at: item.assigned_at,
        assigned_by: item.assigned_by,
        is_active: item.is_active,
        user: item.profiles ? {
          first_name: item.profiles.first_name,
          last_name: item.profiles.last_name,
          email: item.profiles.email
        } : undefined,
        department: item.departments ? {
          name: item.departments.name
        } : undefined
      })) as DepartmentTreasurer[];
    }
  });
}

export function useUserTreasurerDepartments() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-treasurer-departments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .rpc('get_user_treasurer_departments', { _user_id: user.id });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id
  });
}

export function useAssignDepartmentTreasurer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, departmentId }: { userId: string; departmentId: string }) => {
      const { data, error } = await supabase
        .from('department_treasurers')
        .insert({
          user_id: userId,
          department_id: departmentId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-treasurers'] });
      queryClient.invalidateQueries({ queryKey: ['user-treasurer-departments'] });
      toast({
        title: "Department treasurer assigned successfully",
        description: "The user has been assigned as treasurer for the department."
      });
    },
    onError: (error) => {
      toast({
        title: "Error assigning department treasurer",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useRemoveDepartmentTreasurer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (treasurerId: string) => {
      const { error } = await supabase
        .from('department_treasurers')
        .update({ is_active: false })
        .eq('id', treasurerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-treasurers'] });
      queryClient.invalidateQueries({ queryKey: ['user-treasurer-departments'] });
      toast({
        title: "Department treasurer removed successfully",
        description: "The user has been removed as treasurer for the department."
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing department treasurer",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
