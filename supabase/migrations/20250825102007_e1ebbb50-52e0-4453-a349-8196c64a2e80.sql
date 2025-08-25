-- Step 1: Create a standard organization ID
DO $$
DECLARE
    standard_org_id uuid := '00000000-0000-0000-0000-000000000001';
    latest_currency_setting jsonb;
BEGIN
    -- Get the most recent currency setting to preserve
    SELECT setting_value INTO latest_currency_setting
    FROM organization_settings 
    WHERE setting_key = 'currency'
    ORDER BY updated_at DESC 
    LIMIT 1;

    -- Clean up organization_settings - remove all currency settings
    DELETE FROM organization_settings WHERE setting_key = 'currency';
    
    -- Insert the latest currency setting with standard org ID
    IF latest_currency_setting IS NOT NULL THEN
        INSERT INTO organization_settings (organization_id, setting_key, setting_value)
        VALUES (standard_org_id, 'currency', latest_currency_setting);
    END IF;

    -- Update all custom_currencies to use standard org ID and remove duplicates
    -- First, get unique currencies
    CREATE TEMP TABLE temp_unique_currencies AS
    SELECT DISTINCT ON (currency_code) 
        currency_code, 
        currency_name, 
        currency_symbol,
        ROW_NUMBER() OVER (ORDER BY 
            CASE currency_code 
                WHEN 'USD' THEN 1 
                WHEN 'EUR' THEN 2 
                WHEN 'GBP' THEN 3 
                WHEN 'TZS' THEN 4 
                ELSE 99 
            END, 
            currency_code
        ) * 10 as sort_order
    FROM custom_currencies
    ORDER BY currency_code, created_at DESC;

    -- Clear existing custom_currencies
    DELETE FROM custom_currencies;

    -- Insert unique currencies with standard org ID
    INSERT INTO custom_currencies (organization_id, currency_code, currency_name, currency_symbol, sort_order)
    SELECT 
        standard_org_id,
        currency_code,
        currency_name, 
        currency_symbol,
        sort_order
    FROM temp_unique_currencies;

    DROP TABLE temp_unique_currencies;
END $$;

-- Step 2: Add constraints to prevent future duplicates
ALTER TABLE organization_settings 
DROP CONSTRAINT IF EXISTS unique_org_setting_key;

ALTER TABLE organization_settings 
ADD CONSTRAINT unique_org_setting_key 
UNIQUE (organization_id, setting_key);

ALTER TABLE custom_currencies 
DROP CONSTRAINT IF EXISTS unique_org_currency_code;

ALTER TABLE custom_currencies 
ADD CONSTRAINT unique_org_currency_code 
UNIQUE (organization_id, currency_code);

-- Step 3: Update RLS policies to allow authenticated users to read currencies
DROP POLICY IF EXISTS "Admins can manage custom currencies" ON custom_currencies;
DROP POLICY IF EXISTS "Authenticated users can view currencies" ON custom_currencies;

-- Allow authenticated users to view currencies
CREATE POLICY "Authenticated users can view currencies" 
ON custom_currencies 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow admins to manage currencies  
CREATE POLICY "Admins can manage custom currencies" 
ON custom_currencies 
FOR ALL 
USING (current_user_has_admin_role())
WITH CHECK (current_user_has_admin_role());

-- Step 4: Update organization_settings RLS to allow reading currency settings
DROP POLICY IF EXISTS "Authenticated users can view currency settings" ON organization_settings;

CREATE POLICY "Authenticated users can view currency settings" 
ON organization_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND setting_key = 'currency');

-- Keep admin-only policy for modifications
-- (The existing "Admins can manage organization settings" policy remains)