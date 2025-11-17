import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FundReconciliation {
  fund_id: string;
  fund_name: string;
  current_balance: number;
  ledger_balance: number;
  variance: number;
  is_reconciled: boolean;
}

export const useFundLedgerReconciliation = () => {
  return useQuery({
    queryKey: ['fund-ledger-reconciliation'],
    queryFn: async () => {
      // Fetch active fund types
      const { data: funds, error: fundsError } = await supabase
        .from('fund_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (fundsError) throw fundsError;
      if (!funds) return [];

      // For each fund, get the last transaction balance
      const reconciliation = await Promise.all(
        funds.map(async (fund) => {
          const { data: lastTransaction } = await supabase
            .from('fund_transactions')
            .select('balance_after')
            .eq('fund_type_id', fund.id)
            .order('transaction_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          const ledgerBalance = lastTransaction?.balance_after ?? Number(fund.opening_balance || 0);
          const currentBalance = Number(fund.current_balance || 0);
          const variance = currentBalance - ledgerBalance;

          return {
            fund_id: fund.id,
            fund_name: fund.name,
            current_balance: currentBalance,
            ledger_balance: ledgerBalance,
            variance: variance,
            is_reconciled: Math.abs(variance) < 0.01
          };
        })
      );

      return reconciliation;
    }
  });
};
