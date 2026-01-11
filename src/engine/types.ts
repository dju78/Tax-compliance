// DEAP Compliance: Signed Amounts (+ Income, - Expense)

export interface Transaction {
    id: string;
    company_id: string;      // Multi-tenancy support
    date: Date;
    description: string;
    amount: number;          // Signed: >0 (Income/Funding), <0 (Expense/Repayment)
    type?: 'credit' | 'debit'; // Legacy/Display support
    category?: string;       // Legacy/Display support

    // Categorization
    category_id?: string;
    category_name?: string; // Cache for display

    // Tax Year Mapping
    tax_year_id?: string;
    tax_year_label?: string; // e.g. "2025"

    // Director's Loan Account (DLA) Tags
    dla_status: 'none' | 'potential' | 'confirmed';
    dla_owner_id?: string;
    dla_type?: 'funding' | 'repayment' | 'personal_expense_paid_by_company' | 'company_expense_paid_by_owner';

    // Meta
    is_business: boolean;
    excluded_from_tax?: boolean;

    // Enhanced Ledger Fields
    sub_category?: string;
    tax_tag?: 'VAT' | 'WHT' | 'Non-deductible' | 'Owner Loan' | 'None';
    notes?: string;
    source_type?: 'BANK_STATEMENT' | 'RECEIPT' | 'INVOICE' | 'OTHER'; // Added for upload source tracking
    preview_url?: string; // Blob URL for document preview
}

export interface Owner {
    id: string;
    company_id: string;
    full_name: string;
    role: 'Owner' | 'Director' | 'Partner';
    opening_balance: number; // (+) Company Owes Owner, (-) Owner Owes Company
    opening_balance_date: Date;
}

export interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense' | 'cogs' | 'other_income';
    is_system?: boolean;
}

export interface TaxYear {
    id: string;
    label: string;
    start_date: Date;
    end_date: Date;
    is_default: boolean;
}

export interface StatementSummary {
    total_inflow: number;
    total_outflow: number;
    net_cash_flow: number;
    transaction_count: number;
    period_start?: Date;
    period_end?: Date;
}

export interface Company {
    id: string;
    name: string;
    sector?: string;
    description?: string;
    reg_number?: string; // Legacy field, might map to rc_number
    rc_number?: string;
    address?: string;
    tin?: string;
    email?: string; // Added based on Settings.tsx usage
    phone?: string;

    // New fields
    profile_type?: 'individual' | 'business';
    nin?: string;
    business_type?: string;
    created_at?: Date;
    entity_type?: 'sole_trader' | 'ltd';
}

export interface FilingChecks {
    company_id: string; // redundant but good for safety
    tax_year_label: string; // e.g. "2023"
    bank_reconciled: boolean;
    expenses_reviewed: boolean;
    updated_at: Date;
}

export interface DividendVoucher {
    id: string;
    company_id: string;
    voucher_number: string; // e.g. DIV-2025-001
    status: 'draft' | 'final';
    date_of_payment: Date;
    tax_year_label: string;

    shareholder_name: string;
    shareholder_address: string;
    shares_held: number;
    share_class: string; // e.g. 'Ordinary'

    gross_dividend: number;
    tax_credit: number; // 0 for strict validation, but field kept for legacy

    lines: DividendVoucherLine[];

    // Signatures / Meta
    authorised_by_name?: string;
    authorised_by_role?: string;
    received_by_name?: string;
}

export interface DividendVoucherLine {
    id: string;
    description: string;
    amount: number;
}

export interface FilingChecklist {
    incomeReconciled: boolean;
    expensesReviewed: boolean;
    vatReconciled: boolean;
    payeCredits: boolean;
}
