import { useUserRole } from "./useUserRole";
import { useDepartmentFinancialPermissions } from "./useDepartmentFinancialPermissions";
import { useDepartmentAccess } from "./useDepartmentAccess";

export function useMoneyRequestPermissions() {
  const { userRole, isLoading: roleLoading } = useUserRole();
  const { 
    canAccessDepartmentFinances,
    canManageDepartmentFunds,
    isChurchTreasurer,
    isDepartmentTreasurer 
  } = useDepartmentFinancialPermissions();
  const { canAccessDepartment, isLoading: departmentLoading } = useDepartmentAccess();

  // Check if user can create requests for any department
  const canCreateRequestsForAnyDepartment = () => {
    if (!userRole) return false;
    
    return [
      'administrator',
      'finance_administrator', 
      'finance_manager',
      'finance_elder',
      'treasurer',
      'general_secretary',
      'pastor'
    ].includes(userRole);
  };

  // Check if user can create requests for a specific department
  const canCreateRequestForDepartment = (departmentId?: string) => {
    if (!userRole) return false;
    
    // High-level roles can create for any department
    if (canCreateRequestsForAnyDepartment()) return true;
    
    // ANY department member can create requests for their own department
    if (departmentId && canAccessDepartment(departmentId)) {
      return true;
    }
    
    return false;
  };

  // Check if user can view a specific request
  const canViewRequest = (request: {
    requester_id: string;
    requesting_department_id: string;
  }) => {
    if (!userRole) return false;
    
    // Request creator can always view their request
    if (request.requester_id === userRole) return true;
    
    // Finance roles can view all requests
    if (canCreateRequestsForAnyDepartment()) return true;
    
    // Department members can view their department's requests
    return canAccessDepartment(request.requesting_department_id);
  };

  // Check if user can edit a specific request
  const canEditRequest = (request: {
    requester_id: string;
    requesting_department_id: string;
    status: string;
  }) => {
    if (!userRole) return false;
    
    // High-level roles can edit any request
    if ([
      'administrator',
      'finance_administrator',
      'general_secretary',
      'pastor'
    ].includes(userRole)) {
      return true;
    }
    
    // Request creator can edit their own draft requests
    if (request.requester_id === userRole && request.status === 'draft') {
      return true;
    }
    
    return false;
  };

  // Check if user can delete requests
  const canDeleteRequest = () => {
    if (!userRole) return false;
    
    return [
      'administrator',
      'finance_administrator',
      'general_secretary',
      'pastor'
    ].includes(userRole);
  };

  // Check if user can approve requests
  const canApproveRequests = () => {
    if (!userRole) return false;
    
    return [
      'administrator',
      'finance_administrator',
      'finance_elder',
      'general_secretary',
      'pastor',
      'treasurer',
      'head_of_department'
    ].includes(userRole) || isDepartmentTreasurer();
  };

  // Check if user can view all requests (finance view)
  const canViewAllRequests = () => {
    if (!userRole) return false;
    
    return [
      'administrator',
      'finance_administrator',
      'finance_manager',
      'finance_elder',
      'treasurer',
      'general_secretary',
      'pastor'
    ].includes(userRole);
  };

  return {
    canCreateRequestsForAnyDepartment: canCreateRequestsForAnyDepartment(),
    canCreateRequestForDepartment,
    canViewRequest,
    canEditRequest,
    canDeleteRequest: canDeleteRequest(),
    canApproveRequests: canApproveRequests(),
    canViewAllRequests: canViewAllRequests(),
    isLoading: roleLoading || departmentLoading,
  };
}