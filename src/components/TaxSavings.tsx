import { useMemo } from 'react';
import { calculateTaxSavings } from '../engine/taxSavings';

interface TaxSavingsProps {
    turnover: number;
    totalExpenses: number;
    businessType: 'SOLE' | 'LTD';
}

export function TaxSavings({ turnover, totalExpenses, businessType }: TaxSavingsProps) {
    const result = useMemo(() => {
        return calculateTaxSavings(turnover, totalExpenses || 0, businessType);
    }, [turnover, totalExpenses, businessType]);

    // Don't show if no turnover
    if (!turnover) return null;

    return (
        <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>
                Projected Tax Savings
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#fee2e2', border: '2px solid #ef4444', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#991b1b', marginBottom: '0.5rem' }}>Tax Without Deductions</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#b91c1c' }}>
                        ₦{result.taxWithoutExpenses.toLocaleString()}
                    </div>
                </div>
                <div style={{ background: '#dcfce7', border: '2px solid #166534', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#14532d', marginBottom: '0.5rem' }}>Tax With Deductions</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#166534' }}>
                        ₦{result.taxWithExpenses.toLocaleString()}
                    </div>
                </div>
            </div>

            <div style={{
                background: 'linear-gradient(135deg, #059669, #3b82f6)',
                color: 'white',
                padding: '2rem',
                borderRadius: '8px',
                textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem', opacity: 0.9 }}>💰 ESTIMATED TAX SAVINGS</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                    ₦{result.savings.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
                    Based on {businessType === 'SOLE' ? 'Personal Income Tax' : 'Company Income Tax'} rates
                </div>
            </div>
        </div>
    );
}
