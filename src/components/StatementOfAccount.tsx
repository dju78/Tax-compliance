import type { Transaction } from '../engine/types';

interface Props {
    transactions: Transaction[];
}

export function StatementOfAccount({ transactions }: Props) {
    // Sort by date ascending for ledger calculation
    const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningBalance = 0;

    return (
        <div className="card" style={{ marginTop: '1rem', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Statement of Account</h3>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', textAlign: 'left', color: '#64748b' }}>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>Date</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>Description</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Debit (Out)</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Credit (In)</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((txn, index) => {
                            const inflow = txn.type === 'credit' ? txn.amount : 0;
                            const outflow = txn.type === 'debit' ? txn.amount : 0;

                            // Simple running balance logic (assuming 0 start if not provided)
                            // In real app, we'd need opening balance.
                            if (index === 0 && txn.description.toLowerCase().includes('opening')) {
                                runningBalance = txn.amount;
                            } else {
                                runningBalance += inflow - outflow;
                            }

                            return (
                                <tr key={txn.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.75rem', color: '#475569' }}>{txn.date.toLocaleDateString()}</td>
                                    <td style={{ padding: '0.75rem', color: '#1e293b' }}>{txn.description}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#ef4444' }}>
                                        {outflow > 0 ? `₦${outflow.toLocaleString()}` : '-'}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10b981' }}>
                                        {inflow > 0 ? `₦${inflow.toLocaleString()}` : '-'}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold', color: '#334155' }}>
                                        ₦{runningBalance.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
