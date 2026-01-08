import { useState, useEffect } from 'react';
import type { Transaction } from '../engine/types';
import { calculatePIT, type PitInput } from '../engine/pit';

interface TaxPITProps {
    transactions: Transaction[];
    savedInput: PitInput;
    onSave: (input: PitInput) => void;
    onNavigate?: (view: string) => void; // Added onNavigate
}

export function TaxPIT({ transactions, savedInput, onSave, onNavigate }: TaxPITProps) { // Added onNavigate
    // ... existing code ...

    // (Adding button in return statement header)

    const [input, setInput] = useState<PitInput>(savedInput);
    const [autoSync, setAutoSync] = useState(true);
    const [showSteps, setShowSteps] = useState(false);

    // Auto-calculate from transactions
    useEffect(() => {
        if (!autoSync) return;

        const income = transactions.reduce((acc, t) => t.amount > 0 && !t.excluded_from_tax ? acc + t.amount : acc, 0);
        const expense = transactions.reduce((acc, t) => t.amount < 0 && !t.excluded_from_tax ? acc + Math.abs(t.amount) : acc, 0);

        // Try to identify rent from categories
        const rent = transactions
            .filter(t => t.category_name?.toLowerCase().includes('rent') && t.amount < 0)
            .reduce((acc, t) => acc + Math.abs(t.amount), 0);

        setInput(prev => ({
            ...prev,
            gross_income: income,
            allowable_deductions: expense,
            actual_rent_paid: rent // Auto-detected rent
        }));
    }, [transactions, autoSync]);

    const result = calculatePIT(input);
    const formatCurrency = (n: number) => `₦${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

    const handleChange = (field: keyof PitInput, value: number) => {
        setAutoSync(false);
        const newInput = { ...input, [field]: value };
        setInput(newInput);
        onSave(newInput);
    };

    return (
        <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>Personal Income Tax (PIT)</h2>
                    {onNavigate && (
                        <button
                            onClick={() => onNavigate('filing_pack')}
                            style={{ padding: '0.5rem 1rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                            Next: Filing Pack →
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} id="autosync" />
                    <label htmlFor="autosync" style={{ fontSize: '0.9rem', color: '#64748b' }}>Pull from Ledger</label>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '2rem' }}>
                {/* Inputs Section */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', alignSelf: 'start' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>Adjust Inputs</h3>

                    <InputGroup label="Gross Income" value={input.gross_income} onChange={v => handleChange('gross_income', v)} />
                    <InputGroup label="Allowable Expenses" value={input.allowable_deductions} onChange={v => handleChange('allowable_deductions', v)} hint="Business deductions" />
                    <InputGroup label="Actual Rent Paid" value={input.actual_rent_paid} onChange={v => handleChange('actual_rent_paid', v)} hint="For Rent Relief calculation" />
                    <InputGroup label="Pension / NHF" value={input.non_taxable_income} onChange={v => handleChange('non_taxable_income', v)} hint="Tax exempt contributions" />

                    {autoSync && (
                        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#0f766e', background: '#f0fdfa', padding: '0.75rem', borderRadius: '6px' }}>
                            values are synced with the ledger.
                        </div>
                    )}
                </div>

                {/* Results Section */}
                <div>
                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ padding: '2rem', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Tax Payable</div>
                            <div style={{ fontSize: '3rem', fontWeight: '900', color: '#1e293b', lineHeight: '1' }}>{formatCurrency(result.tax_payable)}</div>
                            <div style={{ marginTop: '1rem', display: 'inline-block', background: '#f8fafc', padding: '0.25rem 1rem', borderRadius: '20px', fontSize: '0.9rem', color: '#475569', fontWeight: '500' }}>
                                Effective Tax Rate: {(result.effective_rate * 100).toFixed(1)}%
                            </div>
                        </div>

                        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc' }}>
                            <SummaryItem label="Taxable Income" value={result.taxable_income} />
                            <SummaryItem label="Reliefs Applied" value={result.reliefs} hint="CRA + Rent + Pension" />
                        </div>

                        {/* Expandable Computation Steps */}
                        <div style={{ borderTop: '1px solid #e2e8f0' }}>
                            <button
                                onClick={() => setShowSteps(!showSteps)}
                                style={{ width: '100%', padding: '1rem', background: 'white', border: 'none', cursor: 'pointer', textAlign: 'left', fontWeight: '600', color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <span>View computation steps</span>
                                <span>{showSteps ? '▲' : '▼'}</span>
                            </button>

                            {showSteps && (
                                <div style={{ padding: '1.5rem', background: 'white', borderTop: '1px solid #f1f5f9' }}>
                                    <StepRow label="Gross Income" value={input.gross_income} />
                                    <StepRow label="Less: Allowable Expenses" value={-input.allowable_deductions} color="#b91c1c" />
                                    <StepRow label="Less: Pension / NHF" value={-input.non_taxable_income} color="#b91c1c" />

                                    <div style={{ margin: '0.5rem 0', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '0.25rem' }}>Reliefs Breakdown</div>
                                        <StepRow label="Consolidated Relief Allowance (CRA)" value={-result.cra} isSubItem color="#059669" />
                                        <StepRow label="Rent Relief" value={-result.rent_relief} isSubItem color="#059669" />
                                    </div>

                                    <StepRow label="Net Taxable Income" value={result.taxable_income} isTotal />

                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Tax Band Calculation</div>
                                        {result.breakdown.map((band, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem', color: '#475569' }}>
                                                <span>{band.rate * 100}% on {formatCurrency(band.band)}</span>
                                                <span>{formatCurrency(band.tax)}</span>
                                            </div>
                                        ))}
                                        <StepRow label="Total Tax Due" value={result.tax_payable} isTotal />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InputGroup({ label, value, onChange, hint }: { label: string, value: number, onChange: (n: number) => void, hint?: string }) {
    return (
        <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>{label}</label>
            <input
                type="number"
                value={value}
                onChange={e => onChange(+e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', color: '#1e293b' }}
            />
            {hint && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{hint}</div>}
        </div>
    )
}

function SummaryItem({ label, value, hint }: { label: string, value: number, hint?: string }) {
    return (
        <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{label}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#334155' }}>₦{value.toLocaleString()}</div>
            {hint && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{hint}</div>}
        </div>
    )
}

function StepRow({ label, value, color, isSubItem, isTotal }: { label: string, value: number, color?: string, isSubItem?: boolean, isTotal?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: isSubItem ? '0.85rem' : '0.9rem', fontWeight: isTotal ? '700' : '400', color: isTotal ? '#1e293b' : '#334155' }}>
            <span style={{ paddingLeft: isSubItem ? '1rem' : 0 }}>{label}</span>
            <span style={{ color: color || 'inherit' }}>{value < 0 ? '-' : ''}₦{Math.abs(value).toLocaleString()}</span>
        </div>
    )
}
