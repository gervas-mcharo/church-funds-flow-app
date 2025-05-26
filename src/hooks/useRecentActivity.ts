
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contributions')
        .select(`
          id,
          amount,
          contribution_date,
          created_at,
          contributors (name),
          fund_types (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data.map(contribution => ({
        id: contribution.id,
        type: 'contribution' as const,
        description: `${contribution.contributors?.name} contributed $${Number(contribution.amount).toLocaleString()} to ${contribution.fund_types?.name}`,
        amount: Number(contribution.amount),
        time: new Date(contribution.created_at).toLocaleString(),
        contributor: contribution.contributors?.name,
        fundType: contribution.fund_types?.name
      }));
    }
  });
};
