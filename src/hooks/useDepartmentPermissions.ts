
import { useUserRole } from "@/hooks/useUserRole";
import { useDepartmentOwnership } from "@/hooks/useDepartmentOwnership";

export const useDepartmentPermissions = (departmentId?: string) => {
  const { userRole, isLoading } = useUserRole();
  const { canManageThisDepartment: canManageThisDept } = useDepartmentOwnership(departmentId);

  // Department CRUD permissions
  const canCreateDepartments = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  const canEditDepartments = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  const canDeleteDepartments = () => {
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  const canViewDepartments = () => {
    // All authenticated users can view departments
    return !!userRole;
  };

  // Personnel management permissions for specific departments
  const canAssignPersonnel = (targetDepartmentId?: string) => {
    if (!targetDepartmentId) return false;
    
    // Global personnel management roles
    if (userRole === 'super_administrator' || 
        userRole === 'administrator' || 
        userRole === 'general_secretary' || 
        userRole === 'pastor') {
      return true;
    }
    
    // Department heads can only manage their own department
    if (userRole === 'head_of_department' && targetDepartmentId === departmentId) {
      return canManageThisDept(userRole);
    }
    
    return false;
  };

  const canRemovePersonnel = (targetDepartmentId?: string) => {
    return canAssignPersonnel(targetDepartmentId);
  };

  const canViewPersonnel = () => {
    // All authenticated users can view personnel
    return !!userRole;
  };

  // Get access level for UI components
  const getDepartmentAccessLevel = () => {
    if (canCreateDepartments()) return 'full';
    if (canEditDepartments()) return 'manage';
    if (canViewDepartments()) return 'view';
    return 'none';
  };

  const getPersonnelAccessLevel = (targetDepartmentId?: string) => {
    if (canAssignPersonnel(targetDepartmentId)) return 'full';
    if (canRemovePersonnel(targetDepartmentId)) return 'manage';
    if (canViewPersonnel()) return 'view';
    return 'none';
  };

  return {
    userRole,
    isLoading,
    canCreateDepartments,
    canEditDepartments,
    canDeleteDepartments,
    canViewDepartments,
    canAssignPersonnel,
    canRemovePersonnel,
    canViewPersonnel,
    getDepartmentAccessLevel,
    getPersonnelAccessLevel,
  };
};
