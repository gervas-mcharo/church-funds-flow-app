
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useRecentActivity = () => {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      // Get recent contributions
      const { data: contributions } = await supabase
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
        .limit(5);

      // Get recent money requests
      const { data: requests } = await supabase
        .from('money_requests')
        .select(`
          id,
          amount,
          purpose,
          status,
          created_at,
          fund_types (name)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      const activities = [];

      // Add contributions
      contributions?.forEach(contribution => {
        activities.push({
          id: contribution.id,
          type: 'contribution' as const,
          description: `${contribution.contributors?.name || 'Anonymous'} contributed to ${contribution.fund_types?.name || 'General Fund'}`,
          amount: Number(contribution.amount),
          time: formatTimeAgo(contribution.created_at),
          status: 'completed' as const
        });
      });

      // Add money requests
      requests?.forEach(request => {
        activities.push({
          id: request.id,
          type: 'request' as const,
          description: `${request.purpose} - ${request.fund_types?.name || 'General Fund'}`,
          amount: Number(request.amount),
          time: formatTimeAgo(request.created_at),
          status: request.status as 'pending' | 'approved' | 'completed'
        });
      });

      // Sort by time (most recent first) and take top 5
      return activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 5);
    }
  });
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Less than an hour ago';
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
}
