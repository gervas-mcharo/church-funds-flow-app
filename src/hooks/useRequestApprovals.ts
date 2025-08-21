import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type RequestApproval = {
  id: string;
  request_id: string;
  approval_level: string;
  approver_id?: string;
  status: string;
  approved_at?: string;
  comments?: string;
  order_sequence: number;
  created_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
};

export function useRequestApprovals(requestId?: string) {
  const { user } = useAuth();

  const { data: approvals, isLoading, error } = useQuery({
    queryKey: ["request-approvals", requestId],
    queryFn: async () => {
      if (!user || !requestId) return [];

      const { data, error } = await supabase
        .from("request_approvals")
        .select(`
          *,
          profiles(first_name, last_name, email)
        `)
        .eq("request_id", requestId)
        .order("order_sequence", { ascending: true });

      if (error) throw error;
      return data as RequestApproval[];
    },
    enabled: !!user && !!requestId,
  });

  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "✅";
      case "rejected":
        return "❌";
      case "pending":
        return "⏳";
      default:
        return "⚪";
    }
  };

  const getApprovalLevelLabel = (level: string) => {
    switch (level) {
      case "department_treasurer":
        return "Department Treasurer";
      case "head_of_department":
        return "Head of Department";
      case "finance_elder":
        return "Finance Elder";
      case "general_secretary":
        return "General Secretary";
      case "pastor":
        return "Pastor";
      default:
        return level;
    }
  };

  const getApproverName = (approval: RequestApproval) => {
    // If we have a profile linked through approver_id, use that
    if (approval.profiles) {
      const { first_name, last_name, email } = approval.profiles;
      if (first_name && last_name) {
        return `${first_name} ${last_name}`;
      }
      return email || "Unknown";
    }
    
    // Fallback for unassigned approvers
    return "Awaiting assignment";
  };

  const getCurrentApprovalStep = () => {
    if (!approvals) return null;
    
    const pending = approvals.find(a => a.status === "pending");
    return pending ? pending.order_sequence : null;
  };

  const isCompleted = () => {
    if (!approvals || approvals.length === 0) return false;
    
    return approvals.every(a => a.status === "approved") || 
           approvals.some(a => a.status === "rejected");
  };

  return {
    approvals,
    isLoading,
    error,
    getApprovalStatusIcon,
    getApprovalLevelLabel,
    getApproverName,
    getCurrentApprovalStep,
    isCompleted,
  };
}