import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type MoneyRequest = Database["public"]["Tables"]["money_requests"]["Row"];
type MoneyRequestInsert = Database["public"]["Tables"]["money_requests"]["Insert"];

export interface EnhancedMoneyRequest extends MoneyRequest {
  requesting_department?: {
    id: string;
    name: string;
  };
  requester?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  fund_type?: {
    id: string;
    name: string;
    current_balance: number;
  };
  approval_chain?: Array<{
    id: string;
    approver_role: string;
    step_order: number;
    is_approved?: boolean;
    approval_date?: string;
    comments?: string;
    due_date?: string;
    approver?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  }>;
  attachments?: Array<{
    id: string;
    file_name: string;
    file_size: number;
    content_type: string;
  }>;
  comments?: Array<{
    id: string;
    comment: string;
    user_id: string;
    created_at: string;
    user?: {
      first_name: string;
      last_name: string;
    };
  }>;
  status_history?: Array<{
    id: string;
    old_status?: string;
    new_status: string;
    changed_by?: string;
    reason?: string;
    created_at: string;
  }>;
}

interface MoneyRequestFilters {
  status?: string[];
  department_id?: string;
  priority?: string[];
  amount_range?: { min?: number; max?: number };
  date_range?: { start?: string; end?: string };
  search_term?: string;
  requester_id?: string;
}

export function useEnhancedMoneyRequests(filters?: MoneyRequestFilters) {
  return useQuery({
    queryKey: ['enhanced-money-requests', filters],
    queryFn: async () => {
      let query = supabase
        .from('money_requests')
        .select(`
          *,
          requesting_department:departments!requesting_department_id(id, name),
          requester:profiles!requester_id(id, first_name, last_name, email),
          fund_type:fund_types!fund_type_id(id, name, current_balance),
          approval_chain!money_request_id(
            id,
            approver_role,
            step_order,
            is_approved,
            approval_date,
            comments,
            due_date,
            approver:profiles!approver_id(first_name, last_name, email)
          ),
          attachments:request_attachments!money_request_id(
            id,
            file_name,
            file_size,
            content_type
          ),
          comments:money_request_comments!money_request_id(
            id,
            comment,
            user_id,
            created_at,
            user:profiles!user_id(first_name, last_name)
          ),
          status_history:money_request_status_history!money_request_id(
            id,
            old_status,
            new_status,
            changed_by,
            reason,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status?.length) {
        query = query.in('status', filters.status as any);
      }
      
      if (filters?.department_id) {
        query = query.eq('requesting_department_id', filters.department_id);
      }
      
      if (filters?.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      
      if (filters?.amount_range?.min !== undefined) {
        query = query.gte('amount', filters.amount_range.min);
      }
      
      if (filters?.amount_range?.max !== undefined) {
        query = query.lte('amount', filters.amount_range.max);
      }
      
      if (filters?.date_range?.start) {
        query = query.gte('created_at', filters.date_range.start);
      }
      
      if (filters?.date_range?.end) {
        query = query.lte('created_at', filters.date_range.end);
      }
      
      if (filters?.requester_id) {
        query = query.eq('requester_id', filters.requester_id);
      }
      
      if (filters?.search_term) {
        query = query.or(`purpose.ilike.%${filters.search_term}%,suggested_vendor.ilike.%${filters.search_term}%,associated_project.ilike.%${filters.search_term}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as any;
    }
  });
}

export function useCreateEnhancedMoneyRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (requestData: MoneyRequestInsert & { files?: File[] }) => {
      const { files, ...request } = requestData;
      
      // Create the money request
      const { data: requestResult, error: requestError } = await supabase
        .from('money_requests')
        .insert(request)
        .select()
        .single();

      if (requestError) throw requestError;

      // Upload files if any
      if (files && files.length > 0) {
        for (const file of files) {
          const fileExt = file.name.split('.').pop();
          const filePath = `${requestResult.id}/${crypto.randomUUID()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('request-attachments')
            .upload(filePath, file);

          if (uploadError) {
            console.error('File upload error:', uploadError);
            continue;
          }

          // Create attachment record
          await supabase
            .from('request_attachments')
            .insert({
              money_request_id: requestResult.id,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              content_type: file.type,
              uploaded_by: request.requester_id
            });
        }

        // Update attachment count
        await supabase
          .from('money_requests')
          .update({ attachment_count: files.length })
          .eq('id', requestResult.id);
      }

      return requestResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-money-requests'] });
      queryClient.invalidateQueries({ queryKey: ['money-requests'] });
      toast({
        title: "Money request created successfully",
        description: "Your request has been submitted and is now in the approval workflow."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating request",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useUpdateApprovalDecision() {
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
      queryClient.invalidateQueries({ queryKey: ['enhanced-money-requests'] });
      queryClient.invalidateQueries({ queryKey: ['money-requests'] });
      queryClient.invalidateQueries({ queryKey: ['approval-chain'] });
      toast({
        title: "Approval decision recorded",
        description: "Your decision has been saved and the workflow updated."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating approval",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useAddRequestComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      requestId,
      comment,
      isInternal = false
    }: {
      requestId: string;
      comment: string;
      isInternal?: boolean;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('money_request_comments')
        .insert({
          money_request_id: requestId,
          user_id: user.user.id,
          comment,
          is_internal: isInternal
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-money-requests'] });
      toast({
        title: "Comment added",
        description: "Your comment has been added to the request."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}

export function useRequestStatusHistory(requestId: string) {
  return useQuery({
    queryKey: ['request-status-history', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('money_request_status_history')
        .select(`
          *,
          changed_by_user:profiles!changed_by(first_name, last_name, email)
        `)
        .eq('money_request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!requestId
  });
}