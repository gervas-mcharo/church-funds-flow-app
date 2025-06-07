
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type DepartmentPersonnel = Database["public"]["Tables"]["department_personnel"]["Row"] & {
  user: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
};

type AppRole = Database["public"]["Enums"]["app_role"];

export function useDepartmentPersonnel(departmentId?: string) {
  return useQuery({
    queryKey: ['department-personnel', departmentId],
    queryFn: async () => {
      let query = supabase
        .from('department_personnel')
        .select(`
          *,
          user:profiles(first_name, last_name, email)
        `);
      
      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }
      
      query = query.order('assigned_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as DepartmentPersonnel[];
    },
    enabled: !!departmentId
  });
}

export function useAssignPersonnel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      departmentId, 
      userId, 
      role 
    }: { 
      departmentId: string; 
      userId: string; 
      role: AppRole;
    }) => {
      const { data, error } = await supabase
        .from('department_personnel')
        .insert({
          department_id: departmentId,
          user_id: userId,
          role: role
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-personnel'] });
      toast({
        title: "Personnel assigned successfully",
        description: "The user has been assigned to the department."
      });
    },
    onError: (error) => {
      toast({
        title: "Error assigning personnel",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useRemovePersonnel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (personnelId: string) => {
      const { error } = await supabase
        .from('department_personnel')
        .delete()
        .eq('id', personnelId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-personnel'] });
      toast({
        title: "Personnel removed successfully",
        description: "The user has been removed from the department."
      });
    },
    onError: (error) => {
      toast({
        title: "Error removing personnel",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useUserDepartments(userId?: string) {
  return useQuery({
    queryKey: ['user-departments', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('department_personnel')
        .select(`
          *,
          department:departments(id, name)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId
  });
}

export function useCurrentUserDepartments() {
  return useQuery({
    queryKey: ['current-user-departments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('department_personnel')
        .select(`
          *,
          department:departments(id, name)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    }
  });
}
