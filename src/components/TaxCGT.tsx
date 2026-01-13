import { useState, useEffect } from 'react';
import { calculateCGT, type CgtInput } from '../engine/cgt';

interface TaxCGTProps {
    savedInput: CgtInput;
    onSave: (input: CgtInput) => void;
    onNavigate?: (view: string) => void;
    entityType: 'individual' | 'company';
}

export function TaxCGT({ savedInput, onSave, onNavigate, entityType }: TaxCGTProps) {
    const [input, setInput] = useState<CgtInput>(savedInput);
    const [autoSync, setAutoSync] = useState(true);

    // Sync with upstream calculated input
    useEffect(() => {
        if (autoSync) {
            setInput(_prev => ({
                ...savedInput,
                entity_type: entityType
            }));
        }
    }, [savedInput, autoSync, entityType]);

    const result = calculateCGT({ ...input, entity_type: entityType });
    const formatCurrency = (n: number) => `₦${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

    const handleChange = (field: keyof CgtInput, value: number) => {
        setAutoSync(false);
        const newInput = { ...input, [field]: value };
        setInput(newInput);
        onSave(newInput);
    };

    return (
        <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>Capital Gains Tax (CGT)</h2>
                {onNavigate && (
                    <button
                        onClick={() => onNavigate('filing_pack')}
                        style={{ padding: '0.5rem 1rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', marginLeft: 'auto', marginRight: '1rem' }}
                    >
                        Next: Filing Pack →
                    </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} id="autosync_cgt" />
                    <label htmlFor="autosync_cgt" style={{ fontSize: '0.9rem', color: '#64748b' }}>Pull from Ledger</label>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '2rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>Asset Disposals</h3>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Total Gain Amount</label>
                        <input
                            type="number"
                            value={input.gain_amount}
                            onChange={e => handleChange('gain_amount', +e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', color: '#1e293b' }}
                        />
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Net gain from disposal of qualifying assets</div>
                    </div>

                    {entityType === 'company' && (
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#475569', marginBottom: '0.5rem' }}>Total Turnover (Revenue)</label>
                            <input
                                type="number"
                                value={input.turnover || 0}
                                onChange={e => handleChange('turnover', +e.target.value)}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', color: '#1e293b' }}
                            />
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>Used to determine Small Company Exemption status</div>
                        </div>
                    )}

                    {autoSync && (
                        <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#be185d', background: '#fdf2f8', padding: '0.75rem', borderRadius: '6px' }}>
                            Values are synced with 'Capital Gain' tagged transactions.
                        </div>
                    )}
                </div>

                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Tax Calculation</h3>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                        <span style={{ color: '#64748b' }}>Rate Applied</span>
                        <span style={{ fontWeight: '600', color: '#334155' }}>{result.rate_description}</span>
                    </div>

                    {entityType === 'individual' && result.gain_amount > 0 && result.gain_amount <= 50000000 && (
                        <div style={{ padding: '0.75rem', background: '#eff6ff', borderRadius: '6px', fontSize: '0.85rem', color: '#1e40af', marginBottom: '1rem' }}>
                            <strong>Note:</strong> Partial exemption may apply for compensation for loss of office (up to ₦10m {'->'} raised to ₦50m).
                        </div>
                    )}

                    <div style={{ textAlign: 'center', margin: '2rem 0', padding: '2rem 0', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>CGT Payable</div>
                        <div style={{ fontSize: '3rem', fontWeight: '900', color: '#be185d' }}>
                            {formatCurrency(result.tax_payable)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
