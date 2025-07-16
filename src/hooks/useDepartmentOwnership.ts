
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useDepartmentOwnership(departmentId?: string) {
  const { user } = useAuth();

  const { data: isHeadOfDepartment, isLoading } = useQuery({
    queryKey: ['department-ownership', departmentId, user?.id],
    queryFn: async () => {
      if (!user?.id || !departmentId) return false;
      
      const { data, error } = await supabase
        .from('department_personnel')
        .select('role')
        .eq('department_id', departmentId)
        .eq('user_id', user.id)
        .eq('role', 'head_of_department')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking department ownership:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user?.id && !!departmentId
  });

  const canManageThisDepartment = (userRole: string | null) => {
    // Admins can manage any department
    if (userRole === 'administrator') {
      return true;
    }
    
    // General secretaries and pastors can manage any department
    if (userRole === 'general_secretary' || userRole === 'pastor') {
      return true;
    }
    
    // Head of department can only manage their own department
    if (userRole === 'head_of_department') {
      return isHeadOfDepartment;
    }
    
    return false;
  };

  return {
    isHeadOfDepartment,
    canManageThisDepartment,
    isLoading
  };
}
