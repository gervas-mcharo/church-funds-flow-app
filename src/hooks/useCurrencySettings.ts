
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CurrencySettings {
  currency_code: string;
  currency_symbol: string;
  position: 'before' | 'after';
}

export const CURRENCIES = {
  USD: { name: 'US Dollar', symbol: '$' },
  EUR: { name: 'Euro', symbol: '€' },
  GBP: { name: 'British Pound', symbol: '£' },
  CAD: { name: 'Canadian Dollar', symbol: 'CA$' },
  AUD: { name: 'Australian Dollar', symbol: 'AU$' },
  JPY: { name: 'Japanese Yen', symbol: '¥' },
  CHF: { name: 'Swiss Franc', symbol: 'CHF' },
  CNY: { name: 'Chinese Yuan', symbol: '¥' },
  INR: { name: 'Indian Rupee', symbol: '₹' },
  BRL: { name: 'Brazilian Real', symbol: 'R$' },
  ZAR: { name: 'South African Rand', symbol: 'R' },
  KES: { name: 'Kenyan Shilling', symbol: 'KSh' },
  NGN: { name: 'Nigerian Naira', symbol: '₦' },
  GHS: { name: 'Ghanaian Cedi', symbol: '₵' },
  XOF: { name: 'West African CFA Franc', symbol: 'CFA' },
  XAF: { name: 'Central African CFA Franc', symbol: 'FCFA' },
  ETB: { name: 'Ethiopian Birr', symbol: 'Br' },
  UGX: { name: 'Ugandan Shilling', symbol: 'USh' },
  TZS: { name: 'Tanzanian Shilling', symbol: 'TSh' },
  RWF: { name: 'Rwandan Franc', symbol: 'FRw' }
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export const useCurrencySettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get custom currencies
  const { data: customCurrencies = {}, isLoading: customLoading } = useQuery({
    queryKey: ['custom-currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_currencies')
        .select('currency_code, currency_name, currency_symbol');

      if (error) throw error;

      const customCurrencyMap: Record<string, { name: string; symbol: string }> = {};
      data.forEach(curr => {
        customCurrencyMap[curr.currency_code] = {
          name: curr.currency_name,
          symbol: curr.currency_symbol
        };
      });
      return customCurrencyMap;
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
        return data.setting_value as CurrencySettings;
      } catch {
        return {
          currency_code: 'USD',
          currency_symbol: '$',
          position: 'before' as const
        };
      }
    }
  });

  // Add custom currency mutation
  const addCustomCurrency = useMutation({
    mutationFn: async (data: { code: string; info: { name: string; symbol: string } }) => {
      const { error } = await supabase
        .from('custom_currencies')
        .insert({
          currency_code: data.code,
          currency_name: data.info.name,
          currency_symbol: data.info.symbol
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-currencies'] });
    }
  });

  // Remove custom currency mutation
  const removeCustomCurrency = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase
        .from('custom_currencies')
        .delete()
        .eq('currency_code', code);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-currencies'] });
    }
  });

  // Set currency mutation
  const setCurrencyMutation = useMutation({
    mutationFn: async (newCurrency: CurrencyCode) => {
      const currencyInfo = availableCurrencies[newCurrency];
      if (!currencyInfo) throw new Error('Invalid currency');

      const newSettings: CurrencySettings = {
        currency_code: newCurrency,
        currency_symbol: currencyInfo.symbol,
        position: 'before'
      };

      const { error } = await supabase
        .from('organization_settings')
        .upsert({
          setting_key: 'currency',
          setting_value: newSettings
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currency-settings'] });
    }
  });

  const isLoading = settingsLoading || customLoading;
  const availableCurrencies = { ...CURRENCIES, ...customCurrencies };
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
    customCurrencies,
    addCustomCurrency: addCustomCurrency.mutateAsync,
    removeCustomCurrency: removeCustomCurrency.mutateAsync,
    isLoading
  };
};
