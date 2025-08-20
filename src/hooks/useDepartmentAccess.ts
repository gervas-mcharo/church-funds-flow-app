import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useDepartmentAccess() {
  const { user } = useAuth();

  const { data: userDepartments, isLoading } = useQuery({
    queryKey: ['user-department-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('department_personnel')
        .select(`
          department_id,
          role,
          department:departments(id, name, is_active)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Check if user is a member of a specific department
  const canAccessDepartment = (departmentId?: string) => {
    if (!departmentId || !userDepartments) return false;
    
    return userDepartments.some(
      (dept) => dept.department_id === departmentId && dept.department?.is_active
    );
  };

  // Get all departments user belongs to
  const getUserDepartments = () => {
    if (!userDepartments) return [];
    
    return userDepartments
      .filter((dept) => dept.department?.is_active)
      .map((dept) => ({
        id: dept.department_id,
        name: dept.department?.name || 'Unknown Department',
        role: dept.role
      }));
  };

  // Get specific department role
  const getDepartmentRole = (departmentId?: string) => {
    if (!departmentId || !userDepartments) return null;
    
    const dept = userDepartments.find(
      (dept) => dept.department_id === departmentId && dept.department?.is_active
    );
    
    return dept?.role || null;
  };

  return {
    userDepartments: getUserDepartments(),
    canAccessDepartment,
    getDepartmentRole,
    isLoading,
  };
}