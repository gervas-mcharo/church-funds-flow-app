import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type PendingApproval = {
  request_id: string;
  amount: number;
  purpose: string;
  department_name: string;
  requester_name: string;
  created_at: string;
  approval_level: string;
};

export function usePendingApprovals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pendingApprovals, isLoading, error } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase.rpc("get_user_pending_approvals", {
        user_id: user.id,
      });

      if (error) throw error;
      return data as PendingApproval[];
    },
    enabled: !!user,
  });

  const approveRequest = useMutation({
    mutationFn: async ({ 
      requestId, 
      comments 
    }: { 
      requestId: string; 
      comments?: string; 
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.rpc("advance_approval_chain", {
        p_request_id: requestId,
        p_approver_id: user.id,
        approval_status: "approved",
        p_comments: comments || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["money-requests"] });
      queryClient.invalidateQueries({ queryKey: ["request-approvals"] });
      toast.success("Request approved successfully");
    },
    onError: (error) => {
      console.error("Error approving request:", error);
      toast.error("Failed to approve request");
    },
  });

  const rejectRequest = useMutation({
    mutationFn: async ({ 
      requestId, 
      comments 
    }: { 
      requestId: string; 
      comments: string; 
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.rpc("advance_approval_chain", {
        p_request_id: requestId,
        p_approver_id: user.id,
        approval_status: "rejected",
        p_comments: comments,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["money-requests"] });
      queryClient.invalidateQueries({ queryKey: ["request-approvals"] });
      toast.success("Request rejected");
    },
    onError: (error) => {
      console.error("Error rejecting request:", error);
      toast.error("Failed to reject request");
    },
  });

  const canApprove = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) return false;

      const { data, error } = await supabase.rpc("can_approve_request", {
        user_id: user.id,
        request_id: requestId,
      });

      if (error) throw error;
      return data as boolean;
    },
  });

  return {
    pendingApprovals,
    isLoading,
    error,
    approveRequest,
    rejectRequest,
    canApprove,
    pendingCount: pendingApprovals?.length || 0,
  };
}