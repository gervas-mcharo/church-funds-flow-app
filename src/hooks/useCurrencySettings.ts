import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Available currencies with their symbols and names
export const CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  CAD: { symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { symbol: 'A$', name: 'Australian Dollar' },
  JPY: { symbol: '¥', name: 'Japanese Yen' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc' },
  CNY: { symbol: '¥', name: 'Chinese Yuan' },
  INR: { symbol: '₹', name: 'Indian Rupee' },
  RUB: { symbol: '₽', name: 'Russian Ruble' },
  NGN: { symbol: '₦', name: 'Nigerian Naira' },
  ZAR: { symbol: 'R', name: 'South African Rand' },
  KES: { symbol: 'KSh', name: 'Kenyan Shilling' },
  GHS: { symbol: '₵', name: 'Ghanaian Cedi' }
} as const;

export type CurrencyCode = keyof typeof CURRENCIES | string;

export interface CustomCurrency {
  symbol: string;
  name: string;
}

// Default organization ID for simplicity (in a real app, this would come from user context)
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';

export function useCurrencySettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch current currency setting
  const { data: currentCurrency = 'USD' } = useQuery({
    queryKey: ['organization-currency'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('setting_value')
        .eq('organization_id', DEFAULT_ORG_ID)
        .eq('setting_key', 'default_currency')
        .maybeSingle();

      if (error) {
        console.error('Error fetching currency setting:', error);
        return 'USD';
      }

      return data?.setting_value ? String(data.setting_value).replace(/"/g, '') : 'USD';
    }
  });

  // Fetch custom currencies
  const { data: customCurrenciesData = [] } = useQuery({
    queryKey: ['custom-currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_currencies')
        .select('*')
        .eq('organization_id', DEFAULT_ORG_ID);

      if (error) {
        console.error('Error fetching custom currencies:', error);
        return [];
      }

      return data || [];
    }
  });

  // Convert custom currencies array to object format
  const customCurrencies = customCurrenciesData.reduce((acc, curr) => {
    acc[curr.currency_code] = {
      symbol: curr.currency_symbol,
      name: curr.currency_name
    };
    return acc;
  }, {} as Record<string, CustomCurrency>);

  // Mutation to update currency setting
  const updateCurrencyMutation = useMutation({
    mutationFn: async (newCurrency: CurrencyCode) => {
      const { error } = await supabase
        .from('organization_settings')
        .upsert({
          organization_id: DEFAULT_ORG_ID,
          setting_key: 'default_currency',
          setting_value: JSON.stringify(newCurrency),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return newCurrency;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-currency'] });
    },
    onError: (error) => {
      console.error('Error updating currency:', error);
      toast({
        title: "Error",
        description: "Failed to update currency setting",
        variant: "destructive"
      });
    }
  });

  // Mutation to add custom currency
  const addCustomCurrencyMutation = useMutation({
    mutationFn: async ({ code, currency }: { code: string; currency: CustomCurrency }) => {
      const { error } = await supabase
        .from('custom_currencies')
        .insert({
          organization_id: DEFAULT_ORG_ID,
          currency_code: code,
          currency_name: currency.name,
          currency_symbol: currency.symbol
        });

      if (error) throw error;
      return { code, currency };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-currencies'] });
    },
    onError: (error) => {
      console.error('Error adding custom currency:', error);
      toast({
        title: "Error",
        description: "Failed to add custom currency",
        variant: "destructive"
      });
    }
  });

  // Mutation to remove custom currency
  const removeCustomCurrencyMutation = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase
        .from('custom_currencies')
        .delete()
        .eq('organization_id', DEFAULT_ORG_ID)
        .eq('currency_code', code);

      if (error) throw error;
      return code;
    },
    onSuccess: (removedCode) => {
      queryClient.invalidateQueries({ queryKey: ['custom-currencies'] });
      
      // If the current currency is being removed, switch to USD
      if (currentCurrency === removedCode) {
        updateCurrencyMutation.mutate('USD');
      }
    },
    onError: (error) => {
      console.error('Error removing custom currency:', error);
      toast({
        title: "Error",
        description: "Failed to remove custom currency",
        variant: "destructive"
      });
    }
  });

  const setCurrency = (newCurrency: CurrencyCode) => {
    updateCurrencyMutation.mutate(newCurrency);
  };

  const addCustomCurrency = (code: string, currency: CustomCurrency) => {
    addCustomCurrencyMutation.mutate({ code, currency });
  };

  const removeCustomCurrency = (code: string) => {
    removeCustomCurrencyMutation.mutate(code);
  };

  const formatAmount = (amount: number) => {
    const allCurrencies = { ...CURRENCIES, ...customCurrencies };
    const currencyInfo = allCurrencies[currentCurrency];
    
    if (!currencyInfo) {
      return `$${amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
    }

    return `${currencyInfo.symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const allCurrencies = { ...CURRENCIES, ...customCurrencies };

  return {
    currency: currentCurrency,
    setCurrency,
    formatAmount,
    currencySymbol: allCurrencies[currentCurrency]?.symbol || '$',
    currencyName: allCurrencies[currentCurrency]?.name || 'Unknown Currency',
    availableCurrencies: allCurrencies,
    customCurrencies,
    addCustomCurrency,
    removeCustomCurrency,
    isLoading: updateCurrencyMutation.isPending || addCustomCurrencyMutation.isPending || removeCustomCurrencyMutation.isPending
  };
}
