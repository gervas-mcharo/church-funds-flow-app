-- Initial schema migration
-- Creates all tables, types, and basic database structure

-- Create custom types
CREATE TYPE public.app_role AS ENUM (
    'administrator',
    'data_entry_clerk', 
    'finance_manager',
    'head_of_department',
    'secretary',
    'treasurer',
    'department_member',
    'super_administrator',
    'finance_administrator',
    'pastor',
    'general_secretary',
    'finance_elder',
    'contributor',
    'department_treasurer'
);

CREATE TYPE public.money_request_status AS ENUM (
    'submitted',
    'pending_hod_approval',
    'pending_finance_elder_approval', 
    'pending_general_secretary_approval',
    'pending_pastor_approval',
    'approved',
    'rejected',
    'paid'
);

CREATE TYPE public.pledge_frequency AS ENUM (
    'one_time',
    'weekly',
    'monthly',
    'quarterly',
    'annually'
);

CREATE TYPE public.pledge_status AS ENUM (
    'active',
    'upcoming',
    'partially_fulfilled',
    'fulfilled',
    'overdue',
    'cancelled'
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Create organization_settings table
CREATE TABLE public.organization_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(setting_key)
);

-- Create departments table
CREATE TABLE public.departments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create department_personnel table
CREATE TABLE public.department_personnel (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create department_treasurers table
CREATE TABLE public.department_treasurers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    department_id UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    assigned_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create fund_types table
CREATE TABLE public.fund_types (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    opening_balance NUMERIC DEFAULT 0,
    current_balance NUMERIC DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create department_funds table
CREATE TABLE public.department_funds (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID NOT NULL,
    fund_type_id UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    assigned_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create contributors table
CREATE TABLE public.contributors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create qr_codes table
CREATE TABLE public.qr_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contributor_id UUID,
    fund_type_id UUID,
    qr_data TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contributions table
CREATE TABLE public.contributions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contributor_id UUID NOT NULL,
    fund_type_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    contribution_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    qr_code_id UUID,
    department_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pledges table
CREATE TABLE public.pledges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    contributor_id UUID NOT NULL,
    fund_type_id UUID NOT NULL,
    pledge_amount NUMERIC NOT NULL,
    total_paid NUMERIC NOT NULL DEFAULT 0,
    remaining_balance NUMERIC,
    status pledge_status NOT NULL DEFAULT 'active',
    frequency pledge_frequency NOT NULL DEFAULT 'one_time',
    installment_amount NUMERIC,
    number_of_installments INTEGER,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    next_payment_date DATE,
    last_payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID,
    department_id UUID,
    purpose TEXT,
    notes TEXT
);

-- Create pledge_contributions table
CREATE TABLE public.pledge_contributions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pledge_id UUID NOT NULL,
    contribution_id UUID NOT NULL,
    amount_applied NUMERIC NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    applied_by UUID,
    notes TEXT
);

-- Create pledge_audit_log table
CREATE TABLE public.pledge_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    pledge_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reason TEXT
);

-- Create money_requests table
CREATE TABLE public.money_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    requesting_department_id UUID NOT NULL,
    requester_id UUID NOT NULL,
    fund_type_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    purpose TEXT NOT NULL,
    suggested_vendor TEXT,
    associated_project TEXT,
    status money_request_status NOT NULL DEFAULT 'submitted',
    request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create approval_chain table
CREATE TABLE public.approval_chain (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    money_request_id UUID NOT NULL,
    approver_role app_role NOT NULL,
    approver_id UUID,
    approval_date TIMESTAMP WITH TIME ZONE,
    is_approved BOOLEAN,
    step_order INTEGER NOT NULL,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create request_attachments table
CREATE TABLE public.request_attachments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    money_request_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    content_type TEXT,
    file_size INTEGER,
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security_audit_log table
CREATE TABLE public.security_audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom_currencies table
CREATE TABLE public.custom_currencies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL DEFAULT gen_random_uuid(),
    currency_code TEXT NOT NULL,
    currency_name TEXT NOT NULL,
    currency_symbol TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default fund types
INSERT INTO public.fund_types (name, description, opening_balance, current_balance) VALUES
('Tithes & Offerings', 'Regular tithes and general offerings', 0, 0),
('Building Fund', 'Construction and building maintenance', 0, 0),
('Missions Fund', 'Missionary support and outreach programs', 0, 0);

-- Insert default departments
INSERT INTO public.departments (name, description) VALUES
('General Administration', 'Church administration and general operations'),
('Finance', 'Financial management and accounting'),
('Worship', 'Music and worship services'),
('Youth Ministry', 'Youth programs and activities'),
('Children Ministry', 'Children programs and Sunday school'),
('Missions', 'Missionary work and outreach');