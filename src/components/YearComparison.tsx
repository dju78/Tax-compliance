import { useMemo } from 'react';
import { calculateYearComparison } from '../engine/comparison';

interface YearComparisonProps {
    currentExpenses: number;
    lastYearExpenses: number;
    currentTurnover: number;
    lastYearTurnover: number;
}

export function YearComparison({ currentExpenses, lastYearExpenses, currentTurnover, lastYearTurnover }: YearComparisonProps) {
    const result = useMemo(() => {
        return calculateYearComparison(currentExpenses, lastYearExpenses, currentTurnover, lastYearTurnover);
    }, [currentExpenses, lastYearExpenses, currentTurnover, lastYearTurnover]);

    if (!lastYearExpenses && !lastYearTurnover) return null;

    const renderChange = (change: number) => {
        const isUp = change > 0;
        const color = isUp ? (change > 40 ? '#dc2626' : '#d97706') : '#166534'; // Red if huge spike, Orange if up, Green if down (for expenses usually)
        return (
            <span style={{ color, fontWeight: 'bold' }}>
                {isUp ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
            </span>
        );
    };

    return (
        <div style={{ marginTop: '2rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#334155', marginBottom: '1rem' }}>
                Year-on-Year Comparison
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Total Expenses</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>₦{result.expenses.thisYear.toLocaleString()}</span>
                        {renderChange(result.expenses.change)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>vs ₦{result.expenses.lastYear.toLocaleString()} last year</div>
                </div>

                <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Turnover</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>₦{result.turnover.thisYear.toLocaleString()}</span>
                        {/* Logic: Turnover UP is usually good (Green), but here we just reuse the renderer. Ideally Turnover UP = Green. */}
                        <span style={{ color: result.turnover.change > 0 ? '#166534' : '#b91c1c', fontWeight: 'bold' }}>
                            {result.turnover.change > 0 ? '▲' : '▼'} {Math.abs(result.turnover.change).toFixed(1)}%
                        </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>vs ₦{result.turnover.lastYear.toLocaleString()} last year</div>
                </div>
            </div>
        </div>
    );
}
