import { useMemo } from 'react';
import type { Transaction } from '../engine/types';

interface DirectorLoanProps {
    transactions: Transaction[];
    onNavigate: (view: string) => void;
}

export function DirectorLoanAccount({ transactions, onNavigate }: DirectorLoanProps) {
    // Filter for DLA transactions
    // Logic: 
    // 1. Explicit Category "Director Loan"
    // 2. Explicit Tax Tag "Owner Loan"
    // 3. Status "Confirmed" (if we used auto-detection)

    const dlaData = useMemo(() => {
        const filtered = transactions.filter(t =>
            t.category_name?.includes('Director Loan') ||
            t.tax_tag === 'Owner Loan' ||
            t.dla_status === 'confirmed'
        ).sort((a, b) => a.date.getTime() - b.date.getTime());

        let balance = 0; // Positive = Company Owes Director. Negative = Director Owes Company.

        return filtered.map(t => {
            // Inflow to Company (Money In) = Director Lending to Company = Credit Balance
            // Outflow from Company (Money Out) = Company Repaying/Lending to Director = Debit Balance

            const credit = t.amount > 0 ? t.amount : 0;
            const debit = t.amount < 0 ? Math.abs(t.amount) : 0;

            balance += (credit - debit);

            return {
                ...t,
                credit,
                debit,
                runningBalance: balance
            };
        });
    }, [transactions]);

    const currentBalance = dlaData.length > 0 ? dlaData[dlaData.length - 1].runningBalance : 0;
    const isOverdrawn = currentBalance < 0; // Director owes company

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>Director's Loan Account</h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>Track funds introduced by or withdrawn by directors.</p>
                </div>

                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.25rem' }}>Current Balance</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: currentBalance >= 0 ? '#166534' : '#dc2626' }}>
                        {currentBalance >= 0 ? `Company Owes You: ₦${currentBalance.toLocaleString()}` : `You Owe Company: ₦${Math.abs(currentBalance).toLocaleString()}`}
                    </div>
                </div>
            </div>

            {/* Warnings */}
            {isOverdrawn && (
                <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'start' }}>
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#991b1b' }}>Overdrawn Balance Alert</h3>
                        <p style={{ color: '#b91c1c', fontSize: '0.9rem', margin: '0.25rem 0' }}>
                            You explicitly owe the company money. If not repaid within 9 months of year-end, this may trigger <strong>S455 Tax (33.75%)</strong>.
                        </p>
                        <button style={{ marginTop: '0.5rem', background: '#fff', border: '1px solid #fca5a5', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', color: '#991b1b', fontSize: '0.85rem' }}>
                            Learn how to clear this
                        </button>
                    </div>
                </div>
            )}

            {/* Ledger Table */}
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b' }}>Date</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#64748b' }}>Description</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#166534' }}>Funds In (Credit)</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#dc2626' }}>Withdrawals (Debit)</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#334155' }}>Balance</th>
                            <th style={{ width: '50px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Opening Balance Row (Placeholder) */}
                        <tr style={{ background: '#fefce8', borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '1rem', fontStyle: 'italic' }}>01/01/2025</td>
                            <td style={{ padding: '1rem', fontStyle: 'italic' }}>Opening Balance</td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>-</td>
                            <td style={{ padding: '1rem', textAlign: 'right' }}>-</td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>₦0</td>
                        </tr>

                        {dlaData.map(t => (
                            <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '1rem' }}>{t.date.toLocaleDateString()}</td>
                                <td style={{ padding: '1rem' }}>
                                    {t.description}
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.category_name}</div>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', color: '#166534' }}>
                                    {t.credit > 0 ? `₦${t.credit.toLocaleString()}` : '-'}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', color: '#dc2626' }}>
                                    {t.debit > 0 ? `₦${t.debit.toLocaleString()}` : '-'}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold' }}>
                                    ₦{t.runningBalance.toLocaleString()}
                                </td>
                                <td style={{ padding: '0.5rem' }}>
                                    {t.debit > 0 && (
                                        <button
                                            title="Convert to Dividend Voucher"
                                            onClick={() => {
                                                if (confirm('Create Dividend Voucher for this withdrawal?')) {
                                                    // Potential improvement: Prefill form via state/context
                                                    onNavigate('dividend_vouchers');
                                                }
                                            }}
                                            style={{
                                                cursor: 'pointer',
                                                background: 'none',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '4px',
                                                fontSize: '1.1rem',
                                                padding: '0.2rem 0.4rem'
                                            }}
                                        >
                                            📜
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}

                        {dlaData.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                    No Director Loan transactions found. <br />
                                    <small>Tag transactions as 'Owner Loan' in the Ledger to see them here.</small>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
