export interface Transaction {
    id: string;
    date: Date;
    description: string;
    amount: number; // Absolute value
    type: 'credit' | 'debit';
    balance?: number;
}

export interface StatementSummary {
    total_inflow: number; // Revenue/Credits
    total_outflow: number; // Expenses/Debits
    net_cash_flow: number;
    transaction_count: number;
    period_start?: Date;
    period_end?: Date;
}
