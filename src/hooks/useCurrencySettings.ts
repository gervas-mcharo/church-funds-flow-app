
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CurrencySettings {
  currency_code: string;
  currency_symbol: string;
  position: 'before' | 'after';
}

export const useCurrencySettings = () => {
  const { data: settings } = useQuery({
    queryKey: ['currency-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('setting_value')
        .eq('setting_key', 'currency')
        .single();

      if (error || !data) {
        // Return default USD settings
        return {
          currency_code: 'USD',
          currency_symbol: '$',
          position: 'before' as const
        };
      }

      return data.setting_value as CurrencySettings;
    }
  });

  const formatAmount = (amount: number, abbreviated: boolean = false) => {
    if (!settings) return `$${amount.toFixed(2)}`;
    
    let formattedAmount: string;
    
    if (abbreviated && Math.abs(amount) >= 1000) {
      if (Math.abs(amount) >= 1000000) {
        formattedAmount = (amount / 1000000).toFixed(1) + 'M';
      } else {
        formattedAmount = (amount / 1000).toFixed(1) + 'K';
      }
    } else {
      formattedAmount = amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }

    return settings.position === 'before' 
      ? `${settings.currency_symbol}${formattedAmount}`
      : `${formattedAmount}${settings.currency_symbol}`;
  };

  return {
    settings,
    formatAmount
  };
};
