
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

export type CurrencyCode = keyof typeof CURRENCIES;

const CURRENCY_STORAGE_KEY = 'church-finance-currency';

export function useCurrencySettings() {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return (stored as CurrencyCode) || 'USD';
  });

  const setCurrency = (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
  };

  const formatAmount = (amount: number) => {
    const currencyInfo = CURRENCIES[currency];
    return `${currencyInfo.symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return {
    currency,
    setCurrency,
    formatAmount,
    currencySymbol: CURRENCIES[currency].symbol,
    currencyName: CURRENCIES[currency].name,
    availableCurrencies: CURRENCIES
  };
}
