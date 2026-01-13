import type { Transaction } from '../engine/types';

interface Props {
    transactions: Transaction[];
    onUpdate: (updated: Transaction[]) => void;
    onDownloadExcel: () => void;
}

export function StatementOfAccount({ transactions, onUpdate, onDownloadExcel }: Props) {
    // Sort logic could be moved up or kept here.
    // We need to find the transaction in the original array to update it.

    const handleCategoryChange = (id: string, newCategory: string) => {
        const updated = transactions.map(t =>
            t.id === id ? { ...t, category_name: newCategory } : t
        );
        onUpdate(updated);
    };

    const CATEGORIES = [
        'Revenue - Consultancy Income',
        'Revenue - Other',
        'Director Loan - In (Company owes Director)',
        'Director Loan - Out (Director owes Company)',
        'Office Expenses - General',
        'Office Expenses - Rent',
        'Equipment - Hardware',
        'Professional Fees - Legal/Accounting',
        'Travel - Transportation',
        'Software - Subscription',
        'Bank Fees',
        'Tax Payment'
    ];


    const rowsWithBalance = transactions.reduce<{ rows: (Transaction & { inflow: number; outflow: number; balance: number })[], balance: number }>((acc, txn, index) => {
        const inflow = txn.type === 'credit' ? txn.amount : 0;
        const outflow = txn.type === 'debit' ? txn.amount : 0;
        let newBalance = acc.balance;

        if (index === 0 && txn.description.toLowerCase().includes('opening')) {
            newBalance = txn.amount;
        } else {
            newBalance += inflow - outflow;
        }

        acc.rows.push({
            ...txn,
            inflow,
            outflow,
            balance: newBalance
        });
        acc.balance = newBalance;
        return acc;
    }, { rows: [], balance: 0 }).rows;

    return (
        <div className="card" style={{ marginTop: '1rem', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                <h3 style={{ color: 'var(--color-primary)', margin: 0 }}>Statement of Account</h3>
                <button
                    onClick={onDownloadExcel}
                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    📥 Download Excel Workbook
                </button>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                        <tr style={{ textAlign: 'left', color: '#64748b' }}>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>Date</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>Description</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>Category</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Debit</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Credit</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rowsWithBalance.map((txn) => (
                            <tr key={txn.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.5rem', color: '#475569', whiteSpace: 'nowrap' }}>{new Date(txn.date).toLocaleDateString()}</td>
                                <td style={{ padding: '0.5rem', color: '#1e293b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{txn.description}</td>
                                <td style={{ padding: '0.5rem' }}>
                                    <select
                                        value={txn.category_name || (txn.amount > 0 ? 'Revenue - General' : 'Office Expenses - General')}
                                        onChange={(e) => handleCategoryChange(txn.id, e.target.value)}
                                        style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1', width: '100%', fontSize: '0.8rem' }}
                                    >
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'right', color: '#ef4444' }}>
                                    {txn.outflow > 0 ? `₦${txn.outflow.toLocaleString()}` : '-'}
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'right', color: '#10b981' }}>
                                    {txn.inflow > 0 ? `₦${txn.inflow.toLocaleString()}` : '-'}
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: '#334155' }}>
                                    ₦{txn.balance.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
