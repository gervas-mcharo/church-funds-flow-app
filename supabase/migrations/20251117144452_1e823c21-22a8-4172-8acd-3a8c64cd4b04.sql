-- Migrate historical contributions to fund_transactions
-- This creates transaction records for all existing contributions in chronological order

DO $$
DECLARE
    contrib_record RECORD;
    running_balance NUMERIC;
    fund_id UUID;
    prev_fund_id UUID := NULL;
BEGIN
    -- Process contributions in chronological order, grouped by fund
    FOR contrib_record IN 
        SELECT 
            c.id,
            c.fund_type_id,
            c.contribution_date,
            c.amount,
            c.notes,
            ft.name as fund_name
        FROM contributions c
        JOIN fund_types ft ON c.fund_type_id = ft.id
        ORDER BY c.fund_type_id, c.contribution_date ASC
    LOOP
        -- Reset running balance when we switch to a new fund
        IF prev_fund_id IS NULL OR prev_fund_id != contrib_record.fund_type_id THEN
            -- Get opening balance or last transaction balance for this fund
            SELECT COALESCE(
                (SELECT balance_after 
                 FROM fund_transactions 
                 WHERE fund_type_id = contrib_record.fund_type_id 
                 AND transaction_type = 'opening_balance'
                 ORDER BY transaction_date DESC 
                 LIMIT 1),
                0
            ) INTO running_balance;
            
            prev_fund_id := contrib_record.fund_type_id;
        END IF;
        
        -- Insert transaction record only if it doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM fund_transactions 
            WHERE reference_type = 'contribution' 
            AND reference_id = contrib_record.id
        ) THEN
            INSERT INTO fund_transactions (
                fund_type_id,
                transaction_date,
                transaction_type,
                reference_type,
                reference_id,
                amount,
                debit_credit,
                balance_before,
                balance_after,
                description,
                notes
            ) VALUES (
                contrib_record.fund_type_id,
                contrib_record.contribution_date,
                'contribution',
                'contribution',
                contrib_record.id,
                contrib_record.amount,
                'credit',
                running_balance,
                running_balance + contrib_record.amount,
                'Contribution recorded',
                contrib_record.notes
            );
            
            -- Update running balance
            running_balance := running_balance + contrib_record.amount;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Historical contributions migration completed successfully';
END $$;

-- Migrate historical approved money requests to fund_transactions
DO $$
DECLARE
    request_record RECORD;
    running_balance NUMERIC;
    prev_fund_id UUID := NULL;
BEGIN
    -- Process approved money requests in chronological order, grouped by fund
    FOR request_record IN 
        SELECT 
            mr.id,
            mr.fund_type_id,
            mr.approved_at,
            mr.amount,
            mr.purpose,
            mr.description,
            ft.name as fund_name
        FROM money_requests mr
        JOIN fund_types ft ON mr.fund_type_id = ft.id
        WHERE mr.status = 'approved' AND mr.approved_at IS NOT NULL
        ORDER BY mr.fund_type_id, mr.approved_at ASC
    LOOP
        -- Reset running balance when we switch to a new fund
        IF prev_fund_id IS NULL OR prev_fund_id != request_record.fund_type_id THEN
            -- Get the last transaction balance for this fund
            SELECT COALESCE(
                (SELECT balance_after 
                 FROM fund_transactions 
                 WHERE fund_type_id = request_record.fund_type_id 
                 ORDER BY transaction_date DESC 
                 LIMIT 1),
                0
            ) INTO running_balance;
            
            prev_fund_id := request_record.fund_type_id;
        END IF;
        
        -- Insert transaction record only if it doesn't already exist
        IF NOT EXISTS (
            SELECT 1 FROM fund_transactions 
            WHERE reference_type = 'money_request' 
            AND reference_id = request_record.id
        ) THEN
            INSERT INTO fund_transactions (
                fund_type_id,
                transaction_date,
                transaction_type,
                reference_type,
                reference_id,
                amount,
                debit_credit,
                balance_before,
                balance_after,
                description,
                notes
            ) VALUES (
                request_record.fund_type_id,
                request_record.approved_at,
                'approved_request',
                'money_request',
                request_record.id,
                request_record.amount,
                'debit',
                running_balance,
                running_balance - request_record.amount,
                'Approved money request: ' || request_record.purpose,
                request_record.description
            );
            
            -- Update running balance
            running_balance := running_balance - request_record.amount;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Historical money requests migration completed successfully';
END $$;