-- Add sort_order column to custom_currencies table
ALTER TABLE public.custom_currencies 
ADD COLUMN sort_order INTEGER DEFAULT 1000;

-- Create index for better performance on sorting
CREATE INDEX idx_custom_currencies_sort_order ON public.custom_currencies(sort_order);

-- Seed database with all hardcoded currencies from frontend
INSERT INTO public.custom_currencies (currency_code, currency_name, currency_symbol, sort_order) VALUES
  ('USD', 'US Dollar', '$', 1),
  ('EUR', 'Euro', '€', 2),
  ('GBP', 'British Pound', '£', 3),
  ('CAD', 'Canadian Dollar', 'CA$', 4),
  ('AUD', 'Australian Dollar', 'AU$', 5),
  ('JPY', 'Japanese Yen', '¥', 6),
  ('CHF', 'Swiss Franc', 'CHF', 7),
  ('CNY', 'Chinese Yuan', '¥', 8),
  ('INR', 'Indian Rupee', '₹', 9),
  ('BRL', 'Brazilian Real', 'R$', 10),
  ('ZAR', 'South African Rand', 'R', 11),
  ('KES', 'Kenyan Shilling', 'KSh', 12),
  ('NGN', 'Nigerian Naira', '₦', 13),
  ('GHS', 'Ghanaian Cedi', '₵', 14),
  ('XOF', 'West African CFA Franc', 'CFA', 15),
  ('XAF', 'Central African CFA Franc', 'FCFA', 16),
  ('ETB', 'Ethiopian Birr', 'Br', 17),
  ('UGX', 'Ugandan Shilling', 'USh', 18),
  ('TZS', 'Tanzanian Shilling', 'TSh', 19),
  ('RWF', 'Rwandan Franc', 'FRw', 20)
ON CONFLICT (currency_code) DO NOTHING;

-- Update existing custom currencies to have higher sort_order values
UPDATE public.custom_currencies 
SET sort_order = 2000 + id::text::integer % 1000
WHERE sort_order = 1000;