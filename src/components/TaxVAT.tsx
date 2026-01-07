import { useState, useEffect } from 'react';
import type { Transaction } from '../engine/types';
import { calculateVAT, type VatInput } from '../engine/vat';

interface TaxVATProps {
    transactions: Transaction[];
    savedInput: VatInput;
    onSave: (input: VatInput) => void;
    onNavigate?: (view: string) => void;
}

const VATABLE_KEYWORDS = ['sales', 'service', 'supply', 'consulting', 'contract'];
const VATABLE_EXPENSES = ['utilities', 'supplies', 'maintenance', 'repairs'];

export function TaxVAT({ transactions, savedInput, onSave, onNavigate }: TaxVATProps) {
    const [input, setInput] = useState<VatInput>(savedInput);
    const [autoSync, setAutoSync] = useState(true);

    useEffect(() => {
        if (!autoSync) return;

        // Auto-Compute Logic:
        // 1. Explicit 'VAT' tag (Highest priority)
        // 2. Keyword match in Category Name (Fallback)

        let vatableIncome = 0;
        let vatableExpense = 0;

        transactions.forEach(t => {
            const isIncome = t.amount > 0;
            const absAmount = Math.abs(t.amount);
            const cat = t.category_name?.toLowerCase() || '';
            const tag = t.tax_tag;

            // Decision Logic
            let isVatable = false;

            if (tag === 'VAT') {
                isVatable = true;
            } else if (tag === 'None' || t.excluded_from_tax) {
                isVatable = false;
            } else {
                // Heuristic Fallback
                if (isIncome && VATABLE_KEYWORDS.some(k => cat.includes(k))) isVatable = true;
                if (!isIncome && VATABLE_EXPENSES.some(k => cat.includes(k))) isVatable = true;
            }

            if (isVatable) {
                if (isIncome) vatableIncome += absAmount;
                else vatableExpense += absAmount;
            }
        });

        // Assumptions:
        // - Amounts are Gross (Inclusive of VAT)
        // - Rate is standard 7.5%
        // - Net = Gross / 1.075
        // - VAT = Gross - Net

        const outputVal = vatableIncome - (vatableIncome / 1.075);
        const inputVal = vatableExpense - (vatableExpense / 1.075);

        setInput(prev => ({
            ...prev,
            output_vat: outputVal,
            input_vat: inputVal
        }));

    }, [transactions, autoSync]);

    const result = calculateVAT(input);
    const formatCurrency = (n: number) => `₦${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

    const handleChange = (field: keyof VatInput, value: number) => {
        setAutoSync(false);
        const newInput = { ...input, [field]: value };
        setInput(newInput);
        onSave(newInput);
    };

    return (
        <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>Value Added Tax (VAT)</h2>
                {onNavigate && (
                    <button
                        onClick={() => onNavigate('filing')}
                        style={{ padding: '0.5rem 1rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', marginLeft: 'auto', marginRight: '1rem' }}
                    >
                        Next: Filing Pack →
                    </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={autoSync} onChange={e => setAutoSync(e.target.checked)} id="autosync_vat" />
                    <label htmlFor="autosync_vat" style={{ fontSize: '0.9rem', color: '#64748b' }}>Pull from Ledger</label>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>VAT Return Inputs</h3>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Output VAT (Collected)</label>
                        <input
                            type="number"
                            value={input.output_vat}
                            onChange={e => handleChange('output_vat', +e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Input VAT (Paid)</label>
                        <input
                            type="number"
                            value={input.input_vat}
                            onChange={e => handleChange('input_vat', +e.target.value)}
                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Net Position</h3>

                    <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: result.vat_payable > 0 ? '#b91c1c' : '#166534' }}>
                            {formatCurrency(Math.abs(result.vat_payable))}
                        </div>
                        <div style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: '500' }}>
                            {result.vat_payable > 0 ? 'PAYABLE TO FIRS' : 'REFUND DUE'}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '1rem', padding: '1rem', background: '#eff6ff', borderRadius: '8px', color: '#1e40af', fontSize: '0.9rem' }}>
                ℹ️ <strong>Tip:</strong> Ensure you have tagged your transactions with "VAT" in the Smart Ledger for automatic calculation.
            </div>
        </div>
    );
}
