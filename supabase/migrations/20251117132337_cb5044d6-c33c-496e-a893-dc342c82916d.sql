-- Create fund_transactions table
CREATE TABLE public.fund_transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    fund_type_id UUID NOT NULL REFERENCES fund_types(id) ON DELETE CASCADE,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('contribution', 'approved_request', 'manual_adjustment', 'opening_balance')),
    reference_type TEXT NOT NULL CHECK (reference_type IN ('contribution', 'money_request', 'manual', 'opening')),
    reference_id UUID,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    debit_credit TEXT NOT NULL CHECK (debit_credit IN ('debit', 'credit')),
    balance_before NUMERIC NOT NULL,
    balance_after NUMERIC NOT NULL,
    description TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_fund_transactions_fund_type ON public.fund_transactions(fund_type_id);
CREATE INDEX idx_fund_transactions_date ON public.fund_transactions(transaction_date DESC);
CREATE INDEX idx_fund_transactions_reference ON public.fund_transactions(reference_type, reference_id);

-- Enable RLS
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view fund transactions"
ON public.fund_transactions FOR SELECT
USING (can_access_funds());

CREATE POLICY "System can create transactions"
ON public.fund_transactions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage transactions"
ON public.fund_transactions FOR ALL
USING (current_user_has_admin_role());

-- Create transaction recording function
CREATE OR REPLACE FUNCTION public.record_fund_transaction(
    p_fund_type_id UUID,
    p_transaction_type TEXT,
    p_reference_type TEXT,
    p_reference_id UUID,
    p_amount NUMERIC,
    p_debit_credit TEXT,
    p_description TEXT,
    p_transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    p_created_by UUID DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_balance_before NUMERIC;
    v_balance_after NUMERIC;
BEGIN
    -- Get current balance
    SELECT current_balance INTO v_balance_before
    FROM public.fund_types
    WHERE id = p_fund_type_id;
    
    -- Calculate new balance
    IF p_debit_credit = 'credit' THEN
        v_balance_after := v_balance_before + p_amount;
    ELSE
        v_balance_after := v_balance_before - p_amount;
    END IF;
    
    -- Insert transaction record
    INSERT INTO public.fund_transactions (
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
        created_by,
        notes
    ) VALUES (
        p_fund_type_id,
        p_transaction_date,
        p_transaction_type,
        p_reference_type,
        p_reference_id,
        p_amount,
        p_debit_credit,
        v_balance_before,
        v_balance_after,
        p_description,
        p_created_by,
        p_notes
    );
END;
$$;

-- Update the contribution trigger to record transactions
CREATE OR REPLACE FUNCTION public.update_fund_balance_on_contribution()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Handle INSERT: Add contribution amount to fund balance
  IF TG_OP = 'INSERT' THEN
    UPDATE fund_types 
    SET current_balance = current_balance + NEW.amount
    WHERE id = NEW.fund_type_id;
    
    -- Record transaction
    PERFORM public.record_fund_transaction(
        NEW.fund_type_id,
        'contribution',
        'contribution',
        NEW.id,
        NEW.amount,
        'credit',
        'Contribution recorded',
        NEW.contribution_date,
        auth.uid()
    );
    
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE: Adjust balance based on amount difference
  IF TG_OP = 'UPDATE' THEN
    -- If fund type changed, subtract from old fund and add to new fund
    IF OLD.fund_type_id != NEW.fund_type_id THEN
      UPDATE fund_types 
      SET current_balance = current_balance - OLD.amount
      WHERE id = OLD.fund_type_id;
      
      -- Record debit transaction on old fund
      PERFORM public.record_fund_transaction(
          OLD.fund_type_id,
          'contribution',
          'contribution',
          OLD.id,
          OLD.amount,
          'debit',
          'Contribution moved to another fund',
          now(),
          auth.uid()
      );
      
      UPDATE fund_types 
      SET current_balance = current_balance + NEW.amount
      WHERE id = NEW.fund_type_id;
      
      -- Record credit transaction on new fund
      PERFORM public.record_fund_transaction(
          NEW.fund_type_id,
          'contribution',
          'contribution',
          NEW.id,
          NEW.amount,
          'credit',
          'Contribution moved from another fund',
          NEW.contribution_date,
          auth.uid()
      );
    ELSE
      -- Same fund type, adjust by the difference
      UPDATE fund_types 
      SET current_balance = current_balance - OLD.amount + NEW.amount
      WHERE id = NEW.fund_type_id;
      
      -- Record adjustment transaction
      IF NEW.amount > OLD.amount THEN
        PERFORM public.record_fund_transaction(
            NEW.fund_type_id,
            'contribution',
            'contribution',
            NEW.id,
            NEW.amount - OLD.amount,
            'credit',
            'Contribution amount increased',
            NEW.contribution_date,
            auth.uid()
        );
      ELSE
        PERFORM public.record_fund_transaction(
            NEW.fund_type_id,
            'contribution',
            'contribution',
            NEW.id,
            OLD.amount - NEW.amount,
            'debit',
            'Contribution amount decreased',
            NEW.contribution_date,
            auth.uid()
        );
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle DELETE: Subtract contribution amount from fund balance
  IF TG_OP = 'DELETE' THEN
    UPDATE fund_types 
    SET current_balance = current_balance - OLD.amount
    WHERE id = OLD.fund_type_id;
    
    -- Record transaction
    PERFORM public.record_fund_transaction(
        OLD.fund_type_id,
        'contribution',
        'contribution',
        OLD.id,
        OLD.amount,
        'debit',
        'Contribution deleted',
        now(),
        auth.uid()
    );
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Update the approval trigger to record transactions
CREATE OR REPLACE FUNCTION public.update_fund_balance_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When request is approved, deduct amount from fund balance
  IF NEW.status = 'approved' AND (OLD IS NULL OR OLD.status != 'approved') THEN
    UPDATE public.fund_types 
    SET current_balance = current_balance - NEW.amount
    WHERE id = NEW.fund_type_id;
    
    -- Record transaction
    PERFORM public.record_fund_transaction(
        NEW.fund_type_id,
        'approved_request',
        'money_request',
        NEW.id,
        NEW.amount,
        'debit',
        'Approved money request: ' || NEW.purpose,
        NEW.approved_at,
        auth.uid(),
        NEW.description
    );
    
    -- Log the transaction in security audit
    PERFORM public.log_security_event(
      'fund_balance_deducted',
      'fund_types',
      NEW.fund_type_id,
      jsonb_build_object('previous_balance', (SELECT current_balance FROM public.fund_types WHERE id = NEW.fund_type_id)),
      jsonb_build_object(
        'new_balance', (SELECT current_balance FROM public.fund_types WHERE id = NEW.fund_type_id),
        'deducted_amount', NEW.amount,
        'request_id', NEW.id,
        'purpose', NEW.purpose
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create function to migrate opening balances
CREATE OR REPLACE FUNCTION public.migrate_opening_balances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    fund_record RECORD;
BEGIN
    FOR fund_record IN 
        SELECT id, name, opening_balance, created_at 
        FROM public.fund_types 
        WHERE opening_balance > 0
        AND NOT EXISTS (
            SELECT 1 FROM public.fund_transactions 
            WHERE fund_type_id = fund_types.id 
            AND transaction_type = 'opening_balance'
        )
    LOOP
        INSERT INTO public.fund_transactions (
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
            fund_record.id,
            fund_record.created_at,
            'opening_balance',
            'opening',
            NULL,
            fund_record.opening_balance,
            'credit',
            0,
            fund_record.opening_balance,
            'Opening balance for ' || fund_record.name,
            'Initial balance setup'
        );
    END LOOP;
END;
$$;