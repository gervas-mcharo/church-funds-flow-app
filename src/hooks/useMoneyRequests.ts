
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type MoneyRequest = Database["public"]["Tables"]["money_requests"]["Row"];
type MoneyRequestInsert = Database["public"]["Tables"]["money_requests"]["Insert"];
type ApprovalChain = Database["public"]["Tables"]["approval_chain"]["Row"];

export function useMoneyRequests() {
  return useQuery({
    queryKey: ['money-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('money_requests')
        .select(`
          *,
          requesting_department:departments(name),
          requester:profiles(first_name, last_name, email),
          approval_chain(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });
}

export function useCreateMoneyRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (request: MoneyRequestInsert) => {
      const { data, error } = await supabase
        .from('money_requests')
        .insert(request)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['money-requests'] });
      toast({
        title: "Money request submitted successfully",
        description: "Your request has been submitted and is now in the approval workflow."
      });
    },
    onError: (error) => {
      toast({
        title: "Error submitting request",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useApprovalChain(requestId: string) {
  return useQuery({
    queryKey: ['approval-chain', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approval_chain')
        .select(`
          *,
          approver:profiles(first_name, last_name, email)
        `)
        .eq('money_request_id', requestId)
        .order('step_order');

      if (error) throw error;
      return data;
    },
    enabled: !!requestId
  });
}

export function useUpdateApproval() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      approvalId, 
      isApproved, 
      comments 
    }: { 
      approvalId: string; 
      isApproved: boolean; 
      comments?: string;
    }) => {
      const { error } = await supabase
        .from('approval_chain')
        .update({
          is_approved: isApproved,
          approval_date: new Date().toISOString(),
          comments,
          approver_id: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', approvalId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['money-requests'] });
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'approval-chain'
      });
      toast({
        title: "Approval decision recorded",
        description: "The approval decision has been saved successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating approval",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

