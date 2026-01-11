import { useState, useEffect } from 'react';
import type { Transaction } from '../engine/types';
import { calculateCIT, type CitInput } from '../engine/cit';
import type { AuditInputs } from '../engine/auditRisk';
import { EXPENSE_CHECKLIST_LTD } from '../data/expenseChecklists';

interface TaxCITProps {
    transactions: Transaction[];
    savedInput: CitInput;
    onSave: (input: CitInput) => void;
    onNavigate?: (view: string) => void;
    expenseChecklist?: AuditInputs;
}

export function TaxCIT({ transactions, savedInput, onSave, onNavigate, expenseChecklist }: TaxCITProps) {
    const [input, setInput] = useState<CitInput>(savedInput);
    const [autoSync, setAutoSync] = useState(true);

    // Auto-calculate from transactions
    useEffect(() => {
        if (!autoSync) return;

        const turnover = transactions.reduce((acc, t) => t.amount > 0 && !t.excluded_from_tax ? acc + t.amount : acc, 0);
        const expenses = transactions.reduce((acc, t) => t.amount < 0 && !t.excluded_from_tax ? acc + Math.abs(t.amount) : acc, 0);

        // Very basic profit calculation. In reality, one would adjust for non-deductibles here.
        const profit = Math.max(0, turnover - expenses);

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInput(prev => ({
            ...prev,
            turnover,
            assessable_profit: profit
        }));
    }, [transactions, autoSync]);

    const result = calculateCIT(input);
    const formatCurrency = (n: number) => `₦${n.toLocaleString()}`;

    const handleChange = (field: keyof CitInput, value: number) => {
        setAutoSync(false);
        const newInput = { ...input, [field]: value };
        setInput(newInput);
        onSave(newInput);
    };

    return (
        <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>Company Income Tax (CIT)</h2>
                {onNavigate && (
                    <button
                        onClick={() => onNavigate('filing_pack')}
                        style={{ padding: '0.5rem 1rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', marginLeft: 'auto', marginRight: '1rem' }}
                    >
                        Next: Filing Pack →
                    </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} id="autosync_cit" />
                    <label htmlFor="autosync_cit" style={{ fontSize: '0.9rem', color: '#64748b' }}>Pull from Ledger</label>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Financial Position</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Total Turnover (Revenue)</label>
                        <input
                            type="number"
                            value={input.turnover}
                            onChange={e => handleChange('turnover', +e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Assessable Profit</label>
                        <input
                            type="number"
                            value={input.assessable_profit}
                            onChange={e => handleChange('assessable_profit', +e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                        <small style={{ color: '#64748b' }}>Net Profit after adjustments (Capital Assumptions etc)</small>

                        {/* Checklist Add-backs Suggestion */}
                        {expenseChecklist && expenseChecklist.selectedItems.length > 0 && (
                            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px' }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#c2410c', marginBottom: '0.5rem' }}>
                                    ⚠️ Potential Add-backs detected from Checklist
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#9a3412' }}>
                                    You checked items that are likely disallowed. Consider adding these back to your Assessable Profit:
                                    <ul style={{ paddingLeft: '1.2rem', margin: '0.5rem 0' }}>
                                        {EXPENSE_CHECKLIST_LTD.flatMap(c => c.items).filter(i => expenseChecklist.selectedItems.includes(i.id) && i.isDisallowed).map(i => (
                                            <li key={i.id}>{i.label}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Tax Liability</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                            <span>Company Size Category</span>
                            <span style={{ color: '#0369a1' }}>
                                {input.turnover < 25000000 ? 'Small (< ₦25m)' : input.turnover < 100000000 ? 'Medium (< ₦100m)' : 'Large (> ₦100m)'}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                            Rate Applied: {input.turnover < 25000000 ? '0% (Exempt)' : input.turnover < 100000000 ? '20%' : '30%'}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>CIT Payable</span>
                        <span>{formatCurrency(result.tax_payable)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span>Tertiary Education Tax (2.5%)</span>
                        <span>{formatCurrency(result.development_levy)}</span>
                    </div>

                    <hr style={{ borderColor: '#e2e8f0', margin: '1rem 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 'bold', color: '#b91c1c' }}>
                        <span>Total Due</span>
                        <span>{formatCurrency(result.tax_payable + result.development_levy)}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
