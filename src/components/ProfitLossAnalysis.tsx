import { useState, useMemo } from 'react';
import type { Transaction } from '../engine/types';

interface ProfitLossProps {
    transactions: Transaction[];
    onNavigate?: (view: string) => void;
}

export function ProfitLossAnalysis({ transactions, onNavigate }: ProfitLossProps) {
    const [year, setYear] = useState<string>('2025');
    const [basis, setBasis] = useState<'cash' | 'accrual'>('cash');
    const [drillDownCategory, setDrillDownCategory] = useState<string | null>(null);

    // Extract available years
    const years = useMemo(() => {
        const y = new Set(transactions.map(t => t.tax_year_label || new Date(t.date).getFullYear().toString()));
        return Array.from(y).sort();
    }, [transactions]);

    // Calculate P&L Data
    const { income, expenses, grossProfit, netProfit, drillDownData } = useMemo(() => {
        const filtered = transactions.filter(t => {
            const tYear = t.tax_year_label || new Date(t.date).getFullYear().toString();

            // Exclusions provided by user or logic
            if (t.excluded_from_tax) return false;

            // Exclude Balance Sheet Items
            const isLoan = t.tax_tag === 'Owner Loan' || t.category_name?.includes('Director Loan');
            const isDividendPaid = t.amount < 0 && t.category_name?.toLowerCase().includes('dividend');

            return tYear === year && !isLoan && !isDividendPaid;
        });

        const incomeMap = new Map<string, number>();
        const expenseMap = new Map<string, number>();

        filtered.forEach(t => {
            const cat = t.category_name || 'Uncategorized';
            if (t.amount > 0) {
                incomeMap.set(cat, (incomeMap.get(cat) || 0) + t.amount);
            } else {
                expenseMap.set(cat, (expenseMap.get(cat) || 0) + Math.abs(t.amount));
            }
        });

        const totalIncome = Array.from(incomeMap.values()).reduce((a, b) => a + b, 0);
        const totalExpenses = Array.from(expenseMap.values()).reduce((a, b) => a + b, 0);

        // Simple implementation: Gross Profit = Total Income (assuming mostly service revenue for MVP)
        // Net Profit = Income - Expenses

        return {
            income: Array.from(incomeMap.entries()).map(([cat, val]) => ({ category: cat, amount: val })),
            expenses: Array.from(expenseMap.entries()).map(([cat, val]) => ({ category: cat, amount: val })),
            grossProfit: totalIncome,
            netProfit: totalIncome - totalExpenses,
            drillDownData: drillDownCategory ? filtered.filter(t => (t.category_name || 'Uncategorized') === drillDownCategory) : []
        };
    }, [transactions, year, drillDownCategory]);

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>Profit & Loss</h2>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Basis:</span>
                        <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '6px', padding: '2px' }}>
                            <button onClick={() => setBasis('cash')} style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', border: 'none', background: basis === 'cash' ? 'white' : 'transparent', fontWeight: basis === 'cash' ? '600' : '400', cursor: 'pointer' }}>Cash</button>
                            <button onClick={() => setBasis('accrual')} style={{ padding: '0.25rem 0.75rem', borderRadius: '4px', border: 'none', background: basis === 'accrual' ? 'white' : 'transparent', fontWeight: basis === 'accrual' ? '600' : '400', cursor: 'pointer' }}>Accrual</button>
                        </div>
                    </div>

                    <select
                        value={year}
                        onChange={e => setYear(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '600' }}
                    >
                        {years.map(y => <option key={y} value={y}>Tax Year {y}</option>)}
                    </select>

                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', borderLeft: '1px solid #cbd5e1', paddingLeft: '1rem' }}>
                    <button onClick={() => onNavigate && onNavigate('analysis/split')} title="Tax Year Split" style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem', cursor: 'pointer' }}>📅</button>
                    <button onClick={() => onNavigate && onNavigate('analysis/cashflow')} title="Cash Flow" style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem', cursor: 'pointer' }}>🌊</button>
                    <button onClick={() => onNavigate && onNavigate('analysis/statement')} title="Statement of Account" style={{ background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '0.5rem', cursor: 'pointer' }}>👁️</button>
                </div>

                <div style={{ marginLeft: '1rem' }}>
                    {onNavigate && (
                        <button
                            onClick={() => onNavigate('tax_cit')}
                            style={{ padding: '0.5rem 1rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                            Next: Compute CIT →
                        </button>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) 1fr', gap: '2rem' }}>
                {/* Main Report Table */}
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            {/* Income Section */}
                            <SectionHeader title="Income" />
                            {income.map(item => (
                                <Row
                                    key={item.category}
                                    label={item.category}
                                    value={item.amount}
                                    onClick={() => setDrillDownCategory(item.category)}
                                />
                            ))}
                            <TotalRow label="Total Income" value={grossProfit} color="#166534" />

                            {/* Expenses Section */}
                            <SectionHeader title="Operating Expenses" />
                            {expenses.map(item => (
                                <Row
                                    key={item.category}
                                    label={item.category}
                                    value={item.amount}
                                    isExpense
                                    onClick={() => setDrillDownCategory(item.category)}
                                />
                            ))}
                            <TotalRow label="Total Expenses" value={expenses.reduce((s, i) => s + i.amount, 0)} color="#b91c1c" />

                            {/* Net Profit */}
                            <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                                <td style={{ padding: '1.5rem 1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>Net Profit</td>
                                <td style={{ padding: '1.5rem 1rem', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem', color: netProfit >= 0 ? '#166534' : '#dc2626' }}>
                                    ₦{netProfit.toLocaleString()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Drill Down View (Side Panel) */}
                <div>
                    {drillDownCategory ? (
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1rem', position: 'sticky', top: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{drillDownCategory}</h3>
                                <button onClick={() => setDrillDownCategory(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                            </div>
                            <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                                {drillDownData.map(t => (
                                    <div key={t.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b' }}>
                                            <span>{new Date(t.date).toLocaleDateString()}</span>
                                            <span>{t.sub_category}</span>
                                        </div>
                                        <div style={{ fontWeight: '500', margin: '0.25rem 0' }}>{t.description}</div>
                                        <div style={{ textAlign: 'right', fontWeight: '600', color: t.amount > 0 ? '#166534' : '#b91c1c' }}>
                                            {t.amount > 0 ? '+' : ''}₦{Math.abs(t.amount).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{ border: '2px dashed #e2e8f0', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                            <p>Click any category on the left to view the transactions behind the number.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <tr style={{ background: '#f8fafc' }}>
            <td colSpan={2} style={{ padding: '0.75rem 1rem', fontWeight: '600', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {title}
            </td>
        </tr>
    );
}

function Row({ label, value, onClick }: { label: string, value: number, isExpense?: boolean, onClick: () => void }) {
    return (
        <tr onClick={onClick} style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background 0.1s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
            <td style={{ padding: '1rem', color: '#334155' }}>
                {label}
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '0.25rem' }}>View Details ›</span>
            </td>
            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500', color: '#334155' }}>
                ₦{value.toLocaleString()}
            </td>
        </tr>
    );
}

function TotalRow({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <tr style={{ background: '#fff', borderTop: '2px solid #f1f5f9' }}>
            <td style={{ padding: '1rem', fontWeight: '600' }}>{label}</td>
            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: color }}>
                ₦{value.toLocaleString()}
            </td>
        </tr>
    );
}
