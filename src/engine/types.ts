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
}
