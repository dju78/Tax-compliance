import type { Transaction, StatementSummary } from './types';

export function parseCSV(csvContent: string): { transactions: Transaction[], summary: StatementSummary } {
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    const transactions: Transaction[] = [];

    // Simple Heuristic for generic CSVs without strict headers
    // We assume columns might be: Date, Description, Amount, (Type?), (Balance?)
    // Or: Date, Description, Debit, Credit, Balance

    // Skipping header for now (optimistic)
    const dataLines = lines.slice(1);

    dataLines.forEach((line, index) => {
        const cols = line.split(',').map(c => c.replace(/"/g, '').trim());
        if (cols.length < 3) return;

        // Attempt to identify date
        const dateStr = cols[0];
        const date = new Date(dateStr);

        // Attempt to identify amount
        // Logic: Look for the last numeric column or explicit Debit/Credit columns
        // For MVP, simple assumption: Date, Description, Amount (negative for debit?) OR Date, Desc, Debit, Credit

        let amount = 0;
        let type: 'credit' | 'debit' = 'credit';
        let description = cols[1];

        if (cols.length >= 4) {
            // Possible Debit/Credit columns
            const debit = parseCurrency(cols[2]);
            const credit = parseCurrency(cols[3]);

            if (debit > 0) {
                amount = debit;
                type = 'debit';
            } else {
                amount = credit;
                type = 'credit';
            }
        } else {
            // Single Amount column
            const rawAmount = parseCurrency(cols[2]);
            amount = Math.abs(rawAmount);
            type = rawAmount < 0 ? 'debit' : 'credit';
        }

        if (!isNaN(date.getTime()) && !isNaN(amount)) {
            transactions.push({
                id: `txn_${index}`,
                date,
                description,
                amount,
                type,
                balance: 0 // Placeholder
            });
        }
    });

    // Calculate Summary
    const total_inflow = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const total_outflow = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);

    return {
        transactions,
        summary: {
            total_inflow,
            total_outflow,
            net_cash_flow: total_inflow - total_outflow,
            transaction_count: transactions.length,
            period_start: transactions[0]?.date,
            period_end: transactions[transactions.length - 1]?.date
        }
    };
}

function parseCurrency(val: string): number {
    if (!val) return 0;
    // Remove currency symbols, commas
    const clean = val.replace(/[₦,]/g, '').trim();
    return parseFloat(clean) || 0;
}
