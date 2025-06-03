
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Pledge {
  id: string;
  contributor_id: string;
  fund_type_id: string;
  pledge_amount: number;
  total_paid: number;
  remaining_balance: number;
  status: 'active' | 'upcoming' | 'partially_fulfilled' | 'fulfilled' | 'overdue' | 'cancelled';
  frequency: 'one_time' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  installment_amount?: number;
  number_of_installments?: number;
  start_date: string;
  end_date?: string;
  next_payment_date?: string;
  last_payment_date?: string;
  purpose?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  contributors?: {
    name: string;
    email?: string;
  };
  fund_types?: {
    name: string;
  };
}

export interface CreatePledgeData {
  contributor_id: string;
  fund_type_id: string;
  pledge_amount: number;
  frequency: 'one_time' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  installment_amount?: number;
  number_of_installments?: number;
  start_date: string;
  end_date?: string;
  purpose?: string;
  notes?: string;
}

export const usePledges = (filters?: {
  status?: string;
  contributor_id?: string;
  fund_type_id?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['pledges', filters],
    queryFn: async () => {
      let query = supabase
        .from('pledges')
        .select(`
          *,
          contributors (name, email),
          fund_types (name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.contributor_id) {
        query = query.eq('contributor_id', filters.contributor_id);
      }
      if (filters?.fund_type_id) {
        query = query.eq('fund_type_id', filters.fund_type_id);
      }
      if (filters?.search) {
        query = query.or(`contributors.name.ilike.%${filters.search}%,purpose.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Pledge[];
    }
  });
};

export const usePledgeById = (id: string) => {
  return useQuery({
    queryKey: ['pledge', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pledges')
        .select(`
          *,
          contributors (name, email, phone),
          fund_types (name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Pledge;
    },
    enabled: !!id
  });
};

export const useCreatePledge = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (pledgeData: CreatePledgeData) => {
      const { data, error } = await supabase
        .from('pledges')
        .insert(pledgeData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pledges'] });
      toast({
        title: "Success",
        description: "Pledge created successfully"
      });
    },
    onError: (error) => {
      console.error('Error creating pledge:', error);
      toast({
        title: "Error",
        description: "Failed to create pledge",
        variant: "destructive"
      });
    }
  });
};

export const useUpdatePledge = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreatePledgeData> }) => {
      const { data, error } = await supabase
        .from('pledges')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pledges'] });
      queryClient.invalidateQueries({ queryKey: ['pledge'] });
      toast({
        title: "Success",
        description: "Pledge updated successfully"
      });
    },
    onError: (error) => {
      console.error('Error updating pledge:', error);
      toast({
        title: "Error",
        description: "Failed to update pledge",
        variant: "destructive"
      });
    }
  });
};

export const usePledgeContributions = (pledgeId: string) => {
  return useQuery({
    queryKey: ['pledge-contributions', pledgeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pledge_contributions')
        .select(`
          *,
          contributions (
            amount,
            contribution_date,
            notes
          )
        `)
        .eq('pledge_id', pledgeId)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!pledgeId
  });
};

export const useApplyContributionToPledge = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      pledgeId, 
      contributionId, 
      amountApplied, 
      notes 
    }: { 
      pledgeId: string; 
      contributionId: string; 
      amountApplied: number; 
      notes?: string; 
    }) => {
      const { data, error } = await supabase
        .from('pledge_contributions')
        .insert({
          pledge_id: pledgeId,
          contribution_id: contributionId,
          amount_applied: amountApplied,
          notes
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pledges'] });
      queryClient.invalidateQueries({ queryKey: ['pledge'] });
      queryClient.invalidateQueries({ queryKey: ['pledge-contributions'] });
      toast({
        title: "Success",
        description: "Contribution applied to pledge successfully"
      });
    },
    onError: (error) => {
      console.error('Error applying contribution to pledge:', error);
      toast({
        title: "Error",
        description: "Failed to apply contribution to pledge",
        variant: "destructive"
      });
    }
  });
};

export const usePledgeStats = () => {
  return useQuery({
    queryKey: ['pledge-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pledges')
        .select('status, pledge_amount, total_paid');

      if (error) throw error;

      const stats = {
        totalActivePledges: 0,
        totalPledgedAmount: 0,
        totalPaidAmount: 0,
        fulfillmentRate: 0,
        statusCounts: {
          active: 0,
          upcoming: 0,
          partially_fulfilled: 0,
          fulfilled: 0,
          overdue: 0,
          cancelled: 0
        }
      };

      data.forEach(pledge => {
        if (pledge.status === 'active' || pledge.status === 'partially_fulfilled') {
          stats.totalActivePledges++;
        }
        stats.totalPledgedAmount += Number(pledge.pledge_amount);
        stats.totalPaidAmount += Number(pledge.total_paid);
        stats.statusCounts[pledge.status as keyof typeof stats.statusCounts]++;
      });

      stats.fulfillmentRate = stats.totalPledgedAmount > 0 
        ? (stats.totalPaidAmount / stats.totalPledgedAmount) * 100 
        : 0;

      return stats;
    }
  });
};
