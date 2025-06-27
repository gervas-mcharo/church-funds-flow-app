
import { useUserRole } from "@/hooks/useUserRole";
import { useDepartmentOwnership } from "@/hooks/useDepartmentOwnership";

export const useDepartmentPermissions = (departmentId?: string) => {
  const { userRole, isLoading } = useUserRole();
  const { canManageThisDepartment } = useDepartmentOwnership(departmentId);

  const canManagePersonnel = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor' ||
           canManageThisDepartment();
  };

  const canViewDepartment = () => {
    return canManagePersonnel() || 
           userRole === 'head_of_department' ||
           userRole === 'secretary' ||
           userRole === 'department_member';
  };

  const canEditDepartment = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  const canDeleteDepartment = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator';
  };

  const getPersonnelAccessLevel = (targetDepartmentId?: string) => {
    if (canDeleteDepartment()) return 'full';
    if (canManagePersonnel()) return 'manage';
    if (canViewDepartment()) return 'view';
    return 'none';
  };

  return {
    userRole,
    isLoading,
    canManagePersonnel,
    canViewDepartment,
    canEditDepartment,
    canDeleteDepartment,
    getPersonnelAccessLevel,
  };
};
