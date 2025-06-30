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
      // First get department treasurers
      let query = supabase
        .from('department_treasurers')
        .select('*')
        .eq('is_active', true);
      
      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }
      
      query = query.order('assigned_at', { ascending: false });

      const { data: treasurersData, error: treasurersError } = await query;
      if (treasurersError) throw treasurersError;

      if (!treasurersData || treasurersData.length === 0) {
        return [];
      }

      // Get unique user IDs and department IDs
      const userIds = [...new Set(treasurersData.map(t => t.user_id))];
      const departmentIds = [...new Set(treasurersData.map(t => t.department_id))];

      // Fetch profiles for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('id, name')
        .in('id', departmentIds);

      if (departmentsError) throw departmentsError;

      // Create lookup maps
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      const departmentsMap = new Map(departmentsData?.map(d => [d.id, d]) || []);

      // Transform the data to match our interface
      return treasurersData.map(item => {
        const profile = profilesMap.get(item.user_id);
        const department = departmentsMap.get(item.department_id);

        return {
          id: item.id,
          user_id: item.user_id,
          department_id: item.department_id,
          assigned_at: item.assigned_at,
          assigned_by: item.assigned_by,
          is_active: item.is_active,
          user: profile ? {
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email
          } : undefined,
          department: department ? {
            name: department.name
          } : undefined
        };
      }) as DepartmentTreasurer[];
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
