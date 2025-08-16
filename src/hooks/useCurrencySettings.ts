
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CurrencySettings {
  currency_code: string;
  currency_symbol: string;
  position: 'before' | 'after';
}

interface Currency {
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
  sort_order: number;
}

export const useCurrencySettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all currencies from database
  const { data: currencies = [], isLoading: currenciesLoading } = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_currencies')
        .select('currency_code, currency_name, currency_symbol, sort_order')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Currency[];
    }
  });

  // Get current organization currency settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['currency-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('setting_value')
        .eq('setting_key', 'currency')
        .single();

      if (error || !data) {
        return {
          currency_code: 'USD',
          currency_symbol: '$',
          position: 'before' as const
        };
      }

      try {
        return data.setting_value as unknown as CurrencySettings;
      } catch {
        return {
          currency_code: 'USD',
          currency_symbol: '$',
          position: 'before' as const
        };
      }
    }
  });

  // Add currency mutation
  const addCurrency = useMutation({
    mutationFn: async (data: { code: string; info: { name: string; symbol: string } }) => {
      // Get highest sort_order and add 1
      const { data: maxOrderData } = await supabase
        .from('custom_currencies')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextSortOrder = (maxOrderData?.[0]?.sort_order || 0) + 1;

      const { error } = await supabase
        .from('custom_currencies')
        .insert({
          currency_code: data.code,
          currency_name: data.info.name,
          currency_symbol: data.info.symbol,
          sort_order: nextSortOrder
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
    }
  });

  // Remove currency mutation
  const removeCurrency = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase
        .from('custom_currencies')
        .delete()
        .eq('currency_code', code);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
    }
  });

  // Set currency mutation
  const setCurrencyMutation = useMutation({
    mutationFn: async (newCurrency: string) => {
      const currencyInfo = availableCurrencies.find(c => c.currency_code === newCurrency);
      if (!currencyInfo) throw new Error('Invalid currency');

      const newSettings: CurrencySettings = {
        currency_code: newCurrency,
        currency_symbol: currencyInfo.currency_symbol,
        position: 'before'
      };

      const { error } = await supabase
        .from('organization_settings')
        .upsert({
          setting_key: 'currency',
          setting_value: newSettings as any
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency-settings'] });
    }
  });

  const isLoading = settingsLoading || currenciesLoading;
  const availableCurrencies = currencies;
  const currency = settings?.currency_code || 'USD';
  const currencySymbol = settings?.currency_symbol || '$';

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
    currency,
    currencySymbol,
    setCurrency: setCurrencyMutation.mutateAsync,
    formatAmount,
    availableCurrencies,
    currencies,
    addCurrency: addCurrency.mutateAsync,
    removeCurrency: removeCurrency.mutateAsync,
    isLoading
  };
};
