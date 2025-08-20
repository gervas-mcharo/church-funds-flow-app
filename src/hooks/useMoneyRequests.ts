import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type MoneyRequest = {
  id: string;
  requesting_department_id: string;
  requester_id: string;
  amount: number;
  purpose: string;
  description?: string;
  suggested_vendor?: string;
  fund_type_id: string;
  status: "draft" | "submitted" | "pending_treasurer" | "pending_hod" | "pending_finance_elder" | "pending_general_secretary" | "pending_pastor" | "approved" | "rejected" | "paid";
  created_at: string;
  updated_at: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
};

export type MoneyRequestWithDetails = MoneyRequest & {
  departments: { name: string };
  fund_types: { name: string };
  profiles: { first_name?: string; last_name?: string; email?: string };
};

export function useMoneyRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests, isLoading, error } = useQuery({
    queryKey: ["money-requests"],
    queryFn: async () => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from("money_requests")
          .select(`
            *,
            departments!fk_money_requests_department(name),
            fund_types!fk_money_requests_fund_type(name),
            profiles!fk_money_requests_requester(first_name, last_name, email)
          `)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase query error:", error);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error("Error fetching money requests:", error);
        throw error;
      }
    },
    enabled: !!user,
    retry: 1,
    staleTime: 30000,
  });

  const createRequest = useMutation({
    mutationFn: async (request: Omit<MoneyRequest, "id" | "created_at" | "updated_at" | "approved_at" | "rejected_at" | "rejection_reason" | "requester_id">) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("money_requests")
        .insert({
          ...request,
          requester_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["money-requests"] });
      toast.success("Money request created successfully");
    },
    onError: (error) => {
      console.error("Error creating money request:", error);
      toast.error("Failed to create money request");
    },
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MoneyRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from("money_requests")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["money-requests"] });
      toast.success("Money request updated successfully");
    },
    onError: (error) => {
      console.error("Error updating money request:", error);
      toast.error("Failed to update money request");
    },
  });

  const deleteRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("money_requests")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["money-requests"] });
      toast.success("Money request deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting money request:", error);
      toast.error("Failed to delete money request");
    },
  });

  const submitRequest = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("money_requests")
        .update({ status: "submitted" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["money-requests"] });
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast.success("Money request submitted for approval");
    },
    onError: (error) => {
      console.error("Error submitting money request:", error);
      toast.error("Failed to submit money request");
    },
  });

  return {
    requests,
    isLoading,
    error,
    createRequest,
    updateRequest,
    deleteRequest,
    submitRequest,
  };
}