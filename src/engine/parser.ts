import type { Transaction, StatementSummary } from './types';

export function parseCSV(csvContent: string): { transactions: Transaction[], summary: StatementSummary } {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    const transactions: Transaction[] = [];
    const dataLines = lines.slice(1);

    dataLines.forEach((line, index) => {
        const cols = line.split(',').map(c => c.replace(/"/g, '').trim());
        if (cols.length < 3) return;

        const date = new Date(cols[0]);
        let amount = 0;
        const description = cols[1];

        // Heuristic for Signed vs Debit/Credit
        if (cols.length >= 4) {
            const debit = parseCurrency(cols[2]);
            const credit = parseCurrency(cols[3]);
            if (debit > 0) amount = -Math.abs(debit); // Expense
            else amount = Math.abs(credit);           // Income
        } else {
            amount = parseCurrency(cols[2]); // Assume signed if single col, or TODO: auto-detect
        }

        if (!isNaN(date.getTime()) && !isNaN(amount)) {
            const taxYear = date.getFullYear().toString();

            transactions.push({
                id: `txn_${index}`,
                company_id: 'default',
                date,
                description,
                amount,
                dla_status: 'none',
                tax_year_label: taxYear,
                category_name: amount > 0 ? 'Uncategorized Income' : 'Uncategorized Expense',

                // Defaults
                tax_tag: 'None',
                excluded_from_tax: false,
                notes: ''
            });
        }
    });

    return { transactions, summary: calculateSummary(transactions) };
}

function calculateSummary(transactions: Transaction[]): StatementSummary {
    const total_inflow = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const total_outflow = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
        total_inflow,
        total_outflow,
        net_cash_flow: total_inflow - total_outflow,
        transaction_count: transactions.length,
        period_start: transactions[0] ? new Date(transactions[0].date) : undefined,
        period_end: transactions[transactions.length - 1] ? new Date(transactions[transactions.length - 1].date) : undefined
    };
}

function parseCurrency(val: string): number {
    if (!val) return 0;
    // Remove currency symbols, commas
    const clean = val.replace(/[₦,]/g, '').trim();
    return parseFloat(clean) || 0;
}
