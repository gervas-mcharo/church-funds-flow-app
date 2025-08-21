import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useApproverDetails(approverId?: string) {
  return useQuery({
    queryKey: ['approver-details', approverId],
    queryFn: async () => {
      if (!approverId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', approverId)
        .single();
      
      if (error) {
        console.error('Error fetching approver details:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!approverId
  });
}