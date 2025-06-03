
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

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

const CURRENCY_STORAGE_KEY = 'church-finance-currency';
const CUSTOM_CURRENCIES_STORAGE_KEY = 'church-finance-custom-currencies';

export function useCurrencySettings() {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return stored || 'USD';
  });

  const [customCurrencies, setCustomCurrencies] = useState<Record<string, CustomCurrency>>(() => {
    const stored = localStorage.getItem(CUSTOM_CURRENCIES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  });

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
  };

  const addCustomCurrency = (code: string, currency: CustomCurrency) => {
    const updatedCustomCurrencies = { ...customCurrencies, [code]: currency };
    setCustomCurrencies(updatedCustomCurrencies);
    localStorage.setItem(CUSTOM_CURRENCIES_STORAGE_KEY, JSON.stringify(updatedCustomCurrencies));
  };

  const removeCustomCurrency = (code: string) => {
    const updatedCustomCurrencies = { ...customCurrencies };
    delete updatedCustomCurrencies[code];
    setCustomCurrencies(updatedCustomCurrencies);
    localStorage.setItem(CUSTOM_CURRENCIES_STORAGE_KEY, JSON.stringify(updatedCustomCurrencies));
    
    // If the current currency is being removed, switch to USD
    if (currency === code) {
      setCurrency('USD');
    }
  };

  const formatAmount = (amount: number) => {
    const allCurrencies = { ...CURRENCIES, ...customCurrencies };
    const currencyInfo = allCurrencies[currency];
    
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
    currency,
    setCurrency,
    formatAmount,
    currencySymbol: allCurrencies[currency]?.symbol || '$',
    currencyName: allCurrencies[currency]?.name || 'Unknown Currency',
    availableCurrencies: allCurrencies,
    customCurrencies,
    addCustomCurrency,
    removeCustomCurrency
  };
}
