import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSystemStatus = () => {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      // Check if system is initialized by looking for any administrator
      const { data, error } = await supabase.rpc('is_system_initialized');
      
      if (error) {
        console.error('Error checking system status:', error);
        return false;
      }
      
      return data || false;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};