import { useUserRole } from "@/hooks/useUserRole";
import { useDepartmentOwnership } from "@/hooks/useDepartmentOwnership";

export const useDepartmentFinancialPermissions = (departmentId?: string) => {
  const { userRole, isLoading } = useUserRole();
  const { canManageThisDepartment } = useDepartmentOwnership(departmentId);

  // Church-wide treasurer permissions
  const isChurchTreasurer = () => {
    return userRole === 'church_treasurer';
  };

  // Department-specific treasurer permissions
  const isDepartmentTreasurer = (targetDepartmentId?: string) => {
    if (userRole !== 'department_treasurer') return false;
    if (!targetDepartmentId || !departmentId) return false;
    return canManageThisDepartment(userRole) && departmentId === targetDepartmentId;
  };

  // Financial access for department funds
  const canAccessDepartmentFinances = (targetDepartmentId?: string) => {
    // Church treasurers can access all department finances
    if (isChurchTreasurer()) return true;
    
    // Department treasurers can only access their own department's finances
    if (isDepartmentTreasurer(targetDepartmentId)) return true;
    
    // Other financial roles with church-wide access
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  // Fund management permissions
  const canManageDepartmentFunds = (targetDepartmentId?: string) => {
    if (isChurchTreasurer()) return true;
    if (isDepartmentTreasurer(targetDepartmentId)) return true;
    
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  // Contribution management for departments
  const canManageDepartmentContributions = (targetDepartmentId?: string) => {
    if (isChurchTreasurer()) return true;
    if (isDepartmentTreasurer(targetDepartmentId)) return true;
    
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'finance_manager' || 
           userRole === 'finance_elder' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  // Money request approvals at department level
  const canApproveDepartmentRequests = (targetDepartmentId?: string) => {
    if (isChurchTreasurer()) return true;
    if (isDepartmentTreasurer(targetDepartmentId)) return true;
    
    return userRole === 'super_administrator' || 
           userRole === 'administrator' || 
           userRole === 'finance_administrator' || 
           userRole === 'general_secretary' || 
           userRole === 'pastor';
  };

  return {
    userRole,
    isLoading,
    isChurchTreasurer,
    isDepartmentTreasurer,
    canAccessDepartmentFinances,
    canManageDepartmentFunds,
    canManageDepartmentContributions,
    canApproveDepartmentRequests,
  };
};
