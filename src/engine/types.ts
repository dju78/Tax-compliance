// DEAP Compliance: Signed Amounts (+ Income, - Expense)

export interface Transaction {
    id: string; // UUID

    // Scoping (One must be set)
    company_id?: string;
    personal_profile_id?: string;

    date: Date | string; // Supabase returns string dates
    description: string;
    amount: number;

    // Categorization
    category_name?: string;
    sub_category?: string;

    // Tax Attributes
    tax_year_label?: string; // "2025"
    tax_tag?: 'VAT' | 'WHT' | 'Non-deductible' | 'Owner Loan' | 'Capital Gain' | 'None';
    dla_status: 'none' | 'potential' | 'confirmed';
    excluded_from_tax?: boolean;

    // Meta
    source_type?: 'BANK_UPLOAD' | 'RECEIPT' | 'MANUAL' | 'OTHER';
    created_at?: string;
    preview_url?: string; // For receipt images/PDFs
    notes?: string;

    // Legacy/Display support (Frontend only props)
    type?: 'credit' | 'debit';
}

export interface PersonalProfile {
    id: string;
    user_id: string;
    name: string; // Changed from full_name to name to match DB
    tin?: string;
    state_of_residence?: string;
    nin?: string;
    created_at?: string;
}

export interface Company {
    id: string;
    user_id: string; // Owner
    name: string;
    tin?: string;
    rc_number?: string;
    sector?: string;
    entity_type: 'sole_trader' | 'ltd' | 'partnership';
    description?: string; // Frontend optional
    email?: string;
    phone?: string;
    address?: string;
    nin?: string;
    profile_type?: 'individual' | 'business'; // Mapped to entity_type logic usually
    business_type?: string;
    created_at?: string;
}

// ... Keep existing aggregated types (StatementSummary, etc) for UI logic ..
export interface StatementSummary {
    total_inflow: number;
    total_outflow: number;
    net_cash_flow: number;
    transaction_count: number;
    period_start?: Date;
    period_end?: Date;
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
