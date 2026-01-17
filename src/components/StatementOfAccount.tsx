import { useState } from 'react';
import type { Transaction } from '../engine/types';

interface Props {
    transactions: Transaction[];
    onUpdate: (updated: Transaction[]) => void;
    onDownloadExcel: () => void;
    onAddTransaction?: (transaction: Partial<Transaction>) => Promise<void>;
    onDeleteTransaction?: (id: string) => Promise<void>;
    companyId?: string;
    isPersonal?: boolean;
}

export function StatementOfAccount({ transactions, onUpdate, onDownloadExcel, onAddTransaction, onDeleteTransaction, companyId, isPersonal }: Props) {
    // Modal state for adding transactions
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        type: 'credit',
        category_name: 'Revenue - Other',
        tax_tag: 'None',
        dla_status: 'none'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCategoryChange = (id: string, newCategory: string) => {
        const updated = transactions.map(t =>
            t.id === id ? { ...t, category_name: newCategory } : t
        );
        onUpdate(updated);
    };

    const handleAddTransactionSubmit = async () => {
        if (!onAddTransaction) return;
        if (!newTransaction.description || !newTransaction.amount) {
            alert('Please fill in all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            // Convert amount based on type
            const finalAmount = newTransaction.type === 'debit'
                ? -Math.abs(Number(newTransaction.amount))
                : Math.abs(Number(newTransaction.amount));

            await onAddTransaction({
                ...newTransaction,
                amount: finalAmount,
                company_id: isPersonal ? null : companyId,
                personal_profile_id: isPersonal ? companyId : null,
                source_type: 'MANUAL'
            });

            // Reset form and close modal
            setNewTransaction({
                date: new Date().toISOString().split('T')[0],
                description: '',
                amount: 0,
                type: 'credit',
                category_name: 'Revenue - Other',
                tax_tag: 'None',
                dla_status: 'none'
            });
            setShowAddModal(false);
        } catch (error) {
            console.error('Failed to add transaction:', error);
            alert('Failed to add transaction. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        if (!onDeleteTransaction) return;

        if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
            return;
        }

        try {
            await onDeleteTransaction(id);
        } catch (error) {
            console.error('Failed to delete transaction:', error);
            alert('Failed to delete transaction. Please try again.');
        }
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {onAddTransaction && (
                        <button
                            onClick={() => setShowAddModal(true)}
                            style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            ➕ Add Transaction
                        </button>
                    )}
                    <button
                        onClick={onDownloadExcel}
                        style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        📥 Download Excel Workbook
                    </button>
                </div>
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
                            {onDeleteTransaction && <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Actions</th>}
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
                                {onDeleteTransaction && (
                                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleDeleteTransaction(txn.id)}
                                            style={{
                                                background: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem'
                                            }}
                                            title="Delete transaction"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Transaction Modal */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <h3 style={{ marginTop: 0, color: 'var(--color-primary)' }}>Add New Transaction</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Date *</label>
                                <input
                                    type="date"
                                    value={newTransaction.date as string}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Description *</label>
                                <input
                                    type="text"
                                    value={newTransaction.description}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                                    placeholder="Enter transaction description"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Amount (₦) *</label>
                                <input
                                    type="number"
                                    value={newTransaction.amount}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                                    placeholder="0.00"
                                    step="0.01"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Type *</label>
                                <select
                                    value={newTransaction.type}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as 'credit' | 'debit' })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="credit">Credit (Income)</option>
                                    <option value="debit">Debit (Expense)</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Category</label>
                                <select
                                    value={newTransaction.category_name}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, category_name: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Tax Tag</label>
                                <select
                                    value={newTransaction.tax_tag}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, tax_tag: e.target.value as any })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="None">None</option>
                                    <option value="VAT">VAT</option>
                                    <option value="WHT">WHT</option>
                                    <option value="Personal">Personal</option>
                                    <option value="Non-deductible">Non-deductible</option>
                                    <option value="Owner Loan">Owner Loan</option>
                                    <option value="Capital Gain">Capital Gain</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', fontSize: '0.9rem', color: '#10b981' }}>💳 Payment Method</label>
                                <select
                                    value={newTransaction.payment_method || 'OTHER'}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, payment_method: e.target.value as any })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                >
                                    <option value="FLUTTERWAVE">Flutterwave</option>
                                    <option value="PAYSTACK">Paystack</option>
                                    <option value="INTERSWITCH">Interswitch</option>
                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                    <option value="POS">POS</option>
                                    <option value="CASH">Cash</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Payment Reference (Optional)</label>
                                <input
                                    type="text"
                                    value={newTransaction.payment_reference || ''}
                                    onChange={(e) => setNewTransaction({ ...newTransaction, payment_reference: e.target.value })}
                                    placeholder="e.g., FLW-123456, REF-789"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button
                                    onClick={handleAddTransactionSubmit}
                                    disabled={isSubmitting}
                                    style={{
                                        flex: 1,
                                        background: isSubmitting ? '#94a3b8' : '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem',
                                        borderRadius: '6px',
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {isSubmitting ? 'Adding...' : 'Add Transaction'}
                                </button>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    disabled={isSubmitting}
                                    style={{
                                        flex: 1,
                                        background: '#64748b',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem',
                                        borderRadius: '6px',
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
