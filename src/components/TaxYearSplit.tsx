import { useState, useMemo } from 'react';
import type { Transaction } from '../engine/types';

interface TaxYearSplitProps {
    transactions: Transaction[];
}

export function TaxYearSplit({ transactions }: TaxYearSplitProps) {
    const [selectedYear, setSelectedYear] = useState<string>('2025');

    // Extract available years
    const years = useMemo(() => {
        const y = new Set(transactions.map(t => t.tax_year_label || new Date(t.date).getFullYear().toString()));
        return Array.from(y).sort();
    }, [transactions]);

    // Calculate Split Data
    const splitData = useMemo(() => {
        const categoryMap = new Map<string, { total: number, allocated: number }>();

        transactions.forEach(t => {
            if (t.excluded_from_tax) return; // Skip excluded? Or show as excluded? Prompt says "Excluded or Deferred". 
            // Let's assume Excluded here means "Not in selected year". 
            // But if t.excluded_from_tax is true, it shouldn't be in "Total" either probably for tax purposes?
            // Actually, "Excluded or Deferred" column might be a catch-all for anything not in the current year.

            const cat = t.category_name || 'Uncategorized';
            const tYear = t.tax_year_label || new Date(t.date).getFullYear().toString();

            if (!categoryMap.has(cat)) categoryMap.set(cat, { total: 0, allocated: 0 });
            const entry = categoryMap.get(cat)!;

            // We sum the signed amounts? Or absolute volume?
            // Usually splitting Income/Expense is better, but maybe just Net per category?
            // The prompt asks for "Total Amount". Let's use absolute magnitude for easier visualization of "volume", 
            // or signed if we want to show profit contribution.
            // Given it's a "Split" page, usually you check if you have revenue in wrong year.
            // Let's use raw amounts (signed) for correctness of totals, but maybe display absolute in tables if separated by income/expense.
            // For simplicity in a single table, let's just sum the signed amounts. 
            // Expenses will be negative.

            entry.total += t.amount;
            if (tYear === selectedYear) {
                entry.allocated += t.amount;
            }
        });

        return Array.from(categoryMap.entries()).map(([cat, val]) => ({
            category: cat,
            total: val.total,
            allocated: val.allocated,
            diff: val.total - val.allocated
        })).sort((a, b) => a.category.localeCompare(b.category));
    }, [transactions, selectedYear]);

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>Tax Year Split</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Transactions are allocated based on transaction date.</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>Select Tax Year:</span>
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(e.target.value)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '600', minWidth: '120px' }}
                    >
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Category</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total Amount (All Time)</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#0f766e', fontSize: '0.85rem', textTransform: 'uppercase', background: '#f0fdfa' }}>Allocated to {selectedYear}</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>Excluded / Deferred</th>
                        </tr>
                    </thead>
                    <tbody>
                        {splitData.map(row => (
                            <tr key={row.category} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem', fontWeight: '500', color: '#334155' }}>{row.category}</td>
                                <td style={{ padding: '1rem', textAlign: 'right', color: '#64748b' }}>
                                    ₦{row.total.toLocaleString()}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: '#0f766e', background: '#f0fdfa' }}>
                                    ₦{row.allocated.toLocaleString()}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', color: '#94a3b8' }}>
                                    ₦{row.diff.toLocaleString()}
                                </td>
                            </tr>
                        ))}

                        {splitData.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>No data found for this period.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', fontSize: '0.9rem', color: '#92400e' }}>
                <strong>Note:</strong> Amounts shown are net (Income - Expense). Positive values indicate net income, negative values indicate net expense.
                Use the 'Excluded' column to identify items that may belong to a different basis period.
            </div>
        </div>
    );
}
