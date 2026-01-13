import { useState, useEffect } from 'react';
import type { Transaction } from '../engine/types';
import { calculateWHT, type WhtType, type WhtInput } from '../engine/wht';

interface TaxWHTProps {
    transactions: Transaction[];
    savedInput: WhtInput;
    onSave: (input: WhtInput) => void;
    onNavigate?: (view: string) => void;
}

// Simple keyword mapping for auto-detection
const WHT_MAPPING: Record<string, WhtType> = {
    'rent': 'Rent',
    'lease': 'Rent',
    'legal': 'Professional',
    'audit': 'Professional',
    'consult': 'Consultancy',
    'contract': 'Contract',
    'construct': 'Contract',
    'repair': 'Contract', // Often attracts 5%
    'commission': 'Commission',
    'director': 'DirectorFee',
    'royalty': 'Royalty',
    'interest': 'Interest',
    'dividend': 'Dividend'
};

export function TaxWHT({ transactions, savedInput, onSave, onNavigate }: TaxWHTProps) {
    const [input, setInput] = useState<WhtInput>(savedInput);
    const [autoSync, setAutoSync] = useState(true);

    // Sync with upstream if autoSync is on
    useEffect(() => {
        if (!autoSync) return;

        // Auto-calc logic
        const notes: { id: string, note: string, amount: number }[] = [];
        let payable = 0;
        let receivable = 0;

        transactions.forEach(t => {
            const isExpense = t.amount < 0;
            const absAmount = Math.abs(t.amount);
            const desc = (t.description + ' ' + (t.category_name || '')).toLowerCase();

            // 1. Check for explicit tag
            let type: WhtType | null = null;
            if (t.tax_tag === 'WHT') {
                // Try to infer type from category
                const cat = t.category_name?.toLowerCase() || '';
                const foundKey = Object.keys(WHT_MAPPING).find(k => cat.includes(k) || desc.includes(k));
                type = foundKey ? WHT_MAPPING[foundKey] : 'Contract'; // Default to Contract (5%) if tagged but unknown
            }

            if (type) {
                const res = calculateWHT(absAmount, type);
                // Note: The formula for WHT is usually Gross * Rate. 
                // If the transaction amount is the Net paid, we might need to gross up? 
                // For simplicity/MVP, we assume the transaction amount matches the WHT Base (or is close enough).
                // Ideally: Transaction = Net. WHT = Net / (1-Rate) * Rate. 
                // But users often record the Gross as expense and WHT as separate line?
                // Let's assume Transaction Amount = Gross Base for calculation purposes to be conservative/simple.

                if (isExpense) {
                    payable += res.tax_payable;
                    notes.push({ id: t.id, note: `Withheld ${res.tax_payable} (${type}) from ${t.description}`, amount: res.tax_payable });
                } else {
                    receivable += res.tax_payable; // We suffered this
                    notes.push({ id: t.id, note: `Suffered ${res.tax_payable} (${type}) on ${t.description}`, amount: res.tax_payable });
                }
            }
        });

        setInput(prev => ({
            ...prev,
            wht_payable: payable,
            wht_receivable: receivable,
            notes: notes.map(n => n.note).join('; ')
        }));

    }, [transactions, autoSync]);

    const handleChange = (field: keyof WhtInput, value: number | string) => {
        setAutoSync(false);
        const newInput = { ...input, [field]: value };
        setInput(newInput);
        onSave(newInput);
    };

    const formatCurrency = (n: number) => `₦${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

    return (
        <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>Withholding Tax (WHT)</h2>
                {onNavigate && (
                    <button
                        onClick={() => onNavigate('filing_pack')}
                        style={{ padding: '0.5rem 1rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', marginLeft: 'auto', marginRight: '1rem' }}
                    >
                        Next: Filing Pack →
                    </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} id="autosync_wht" />
                    <label htmlFor="autosync_wht" style={{ fontSize: '0.9rem', color: '#64748b' }}>Pull from Ledger</label>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* WHT Payable (Liability) */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold', color: '#b91c1c' }}>WHT Payable (Liability)</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
                        Tax you withheld from vendors/suppliers and must remit to FIRS/SIRS.
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Total WHT Payable</label>
                        <input
                            type="number"
                            value={input.wht_payable}
                            onChange={e => handleChange('wht_payable', +e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1.2rem', fontWeight: 'bold' }}
                        />
                    </div>
                </div>

                {/* WHT Credit (Asset) */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold', color: '#15803d' }}>WHT Credit (Asset)</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
                        Tax withheld by your customers that you can use to offset CIT/PIT.
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Total WHT Credit Notes</label>
                        <input
                            type="number"
                            value={input.wht_receivable}
                            onChange={e => handleChange('wht_receivable', +e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1.2rem', fontWeight: 'bold' }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Summary Position</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Gross Liability</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#b91c1c' }}>{formatCurrency(input.wht_payable)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Credits</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#15803d' }}>{formatCurrency(input.wht_receivable)}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Net Cash Impact</div>
                        {/* This isn't exactly "Net Payable" because Credit offsets CIT, not WHT Payable usually. 
                             WHT Payable must be remitted. WHT Credit offsets CIT. 
                             But showing the magnitude is helpful. */}
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                            {formatCurrency(input.wht_payable)} <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>(To Remit)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '1rem', padding: '1rem', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d', color: '#92400e', fontSize: '0.9rem' }}>
                <strong>Note:</strong> WHT Payable should be remitted by the 21st of the following month. WHT Credit Notes should be collected to reduce your annual CIT liability.
            </div>

        </div>
    );
}
