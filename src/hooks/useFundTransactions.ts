import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FundTransaction {
  id: string;
  fund_type_id: string;
  transaction_date: string;
  transaction_type: 'contribution' | 'approved_request' | 'manual_adjustment' | 'opening_balance';
  reference_type: 'contribution' | 'money_request' | 'manual' | 'opening';
  reference_id: string | null;
  amount: number;
  debit_credit: 'debit' | 'credit';
  balance_before: number;
  balance_after: number;
  description: string;
  created_by: string | null;
  notes: string | null;
  created_at: string;
  fund_types?: { name: string };
  contributors?: { name: string };
}

export const useFundTransactions = (
  fundTypeId?: string,
  startDate?: Date,
  endDate?: Date,
  transactionType?: string
) => {
  return useQuery({
    queryKey: ['fund-transactions', fundTypeId, startDate, endDate, transactionType],
    queryFn: async () => {
      let query = supabase
        .from('fund_transactions')
        .select(`
          *,
          fund_types (name)
        `)
        .order('transaction_date', { ascending: false });

      if (fundTypeId) {
        query = query.eq('fund_type_id', fundTypeId);
      }
      if (startDate) {
        query = query.gte('transaction_date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('transaction_date', endDate.toISOString());
      }
      if (transactionType && transactionType !== 'all') {
        query = query.eq('transaction_type', transactionType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FundTransaction[];
    },
    enabled: !!fundTypeId
  });
};
