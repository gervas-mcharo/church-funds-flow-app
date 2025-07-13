import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCurrencySettings } from '@/hooks/useCurrencySettings';

interface AutoApplyResult {
  success: boolean;
  appliedAmount: number;
  remainingAmount: number;
  appliedPledges: Array<{
    pledgeId: string;
    appliedAmount: number;
    pledgePurpose?: string;
  }>;
  error?: string;
}

export const useAutoApplyContributionToPledge = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { formatAmount } = useCurrencySettings();

  return useMutation({
    mutationFn: async ({
      contributionId,
      contributorId,
      fundTypeId,
      contributionAmount
    }: {
      contributionId: string;
      contributorId: string;
      fundTypeId: string;
      contributionAmount: number;
    }): Promise<AutoApplyResult> => {
      try {
        // Find matching active pledges ordered by creation date (FIFO)
        const { data: pledges, error: pledgesError } = await supabase
          .from('pledges')
          .select('id, pledge_amount, total_paid, remaining_balance, purpose, created_at')
          .eq('contributor_id', contributorId)
          .eq('fund_type_id', fundTypeId)
          .in('status', ['active', 'partially_fulfilled'])
          .order('created_at', { ascending: true });

        if (pledgesError) throw pledgesError;

        if (!pledges || pledges.length === 0) {
          return {
            success: true,
            appliedAmount: 0,
            remainingAmount: contributionAmount,
            appliedPledges: []
          };
        }

        let remainingAmount = contributionAmount;
        const appliedPledges: AutoApplyResult['appliedPledges'] = [];

        // Apply contribution to pledges in FIFO order
        for (const pledge of pledges) {
          if (remainingAmount <= 0) break;

          const pledgeRemainingBalance = Number(pledge.remaining_balance) || 
            (Number(pledge.pledge_amount) - Number(pledge.total_paid));

          const amountToApply = Math.min(remainingAmount, pledgeRemainingBalance);

          if (amountToApply > 0) {
            // Apply contribution to this pledge
            const { error: applyError } = await supabase
              .from('pledge_contributions')
              .insert({
                pledge_id: pledge.id,
                contribution_id: contributionId,
                amount_applied: amountToApply,
                notes: 'Automatically applied'
              });

            if (applyError) throw applyError;

            appliedPledges.push({
              pledgeId: pledge.id,
              appliedAmount: amountToApply,
              pledgePurpose: pledge.purpose || 'General Pledge'
            });

            remainingAmount -= amountToApply;
          }
        }

        return {
          success: true,
          appliedAmount: contributionAmount - remainingAmount,
          remainingAmount,
          appliedPledges
        };

      } catch (error) {
        console.error('Error auto-applying contribution to pledge:', error);
        return {
          success: false,
          appliedAmount: 0,
          remainingAmount: contributionAmount,
          appliedPledges: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    },
    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['pledges'] });
      queryClient.invalidateQueries({ queryKey: ['pledge-contributions'] });
      queryClient.invalidateQueries({ queryKey: ['contributions'] });

      if (result.success && result.appliedPledges.length > 0) {
        const appliedCount = result.appliedPledges.length;
        const totalApplied = result.appliedAmount;
        
        let description = `${formatAmount(totalApplied)} applied to ${appliedCount} pledge${appliedCount > 1 ? 's' : ''}`;
        
        if (result.remainingAmount > 0) {
          description += `. ${formatAmount(result.remainingAmount)} remains unallocated`;
        }

        toast({
          title: "Pledge Application Success",
          description,
        });
      }
    },
    onError: (error) => {
      console.error('Error auto-applying contribution:', error);
      toast({
        title: "Error",
        description: "Failed to apply contribution to pledges automatically",
        variant: "destructive"
      });
    }
  });
};