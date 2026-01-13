import { useState } from 'react';
import type { Transaction } from '../engine/types';

interface SmartLedgerProps {
    transactions: Transaction[];
    onUpdate: (updated: Transaction[]) => void;
    onNavigate?: (view: string) => void;
    onSave?: (txn: Transaction) => void;
    onSaveBulk?: (txns: Transaction[]) => void;
}

import { autoCategorize, CATEGORY_RULES } from '../engine/autoCat';

export function SmartLedger({ transactions, onUpdate, onNavigate, onSave, onSaveBulk }: SmartLedgerProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    // Auto-Categorize Handler
    const handleAutoCategorize = () => {
        const updated = transactions.map(t => {
            // Only auto-categorize if it's currently uncategorized (or simple override logic)
            // For safety, let's only touch "Uncategorized" items unless specific override requested
            if (t.category_name?.startsWith('Uncategorized')) {
                const newCat = autoCategorize(t.description);
                if (newCat) return { ...t, category_name: newCat };
            }
            return t;
        });

        // Calculate how many changed
        const changed = updated.filter((t, i) => t.category_name !== transactions[i].category_name);
        if (changed.length > 0) {
            onUpdate(updated);
            onSaveBulk?.(changed);
            alert(`✨ Auto-categorized ${changed.length} transactions!`);
        } else {
            alert("No matching categories found for uncategorized items.");
        }
    };

    // Bulk Action Handler (Unused for now)
    // const handleBulkAction = (action: string, payload?: any) => {
    /*
    if (selectedIds.size === 0) return;

    const updated = transactions.map(t => {
        if (selectedIds.has(t.id)) {
            if (action === 'categorize') return { ...t, category_name: payload };
            if (action === 'tag') return { ...t, tax_tag: payload };
            if (action === 'exclude') return { ...t, excluded_from_tax: true };
        }
        return t;
    });
    onUpdate(updated);
    setSelectedIds(new Set()); // Clear selection
    */
    // };

    // Inline Update
    const handleRowUpdate = (id: string, field: keyof Transaction, value: Transaction[keyof Transaction]) => {
        const original = transactions.find(t => t.id === id);
        if (!original) return;

        const updatedTxn = { ...original, [field]: value };
        const updated = transactions.map(t => t.id === id ? updatedTxn : t);

        onUpdate(updated);
        onSave?.(updatedTxn);
    };

    // Selection
    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === transactions.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(transactions.map(t => t.id)));
    };

    // Tax Tag Colors
    const getTagColor = (tag: string) => {
        switch (tag) {
            case 'VAT': return '#e0f2fe'; // blue-100
            case 'WHT': return '#fef3c7'; // amber-100
            case 'Non-deductible': return '#fee2e2'; // red-100
            case 'Owner Loan': return '#dcfce7'; // green-100
            case 'Capital Gain': return '#fce7f3'; // pink-100
            default: return '#f1f5f9';
        }
    };

    const getTagTextColor = (tag: string) => {
        switch (tag) {
            case 'VAT': return '#0369a1';
            case 'WHT': return '#b45309';
            case 'Non-deductible': return '#b91c1c';
            case 'Owner Loan': return '#15803d';
            case 'Capital Gain': return '#db2777';
            default: return '#64748b';
        }
    };

    // Preview Modal
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Filtering
    const filteredTransactions = transactions.filter(t => {
        const term = searchTerm.toLowerCase();
        const matchesSearch =
            (searchTerm === 'uncategorized' && !t.category_name) ||
            t.description.toLowerCase().includes(term) ||
            t.category_name?.toLowerCase().includes(term) ||
            (t.amount.toString().includes(term));

        // Simple date match if dateFilter is set
        const matchesDate = !dateFilter ? true : new Date(t.date).toISOString().split('T')[0] === dateFilter;

        return matchesSearch && matchesDate;
    });

    const uncategorizedCount = transactions.filter(t => !t.category_name || t.category_name.startsWith('Uncategorized')).length;

    return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* Validation Banner */}
            {uncategorizedCount > 0 && (
                <div style={{
                    margin: '1rem',
                    padding: '1rem',
                    background: '#fee2e2',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    color: '#991b1b'
                }}>
                    <div style={{ fontSize: '1.5rem' }}>🔴</div>
                    <div>
                        <div style={{ fontWeight: 'bold' }}>Action Items Pending</div>
                        <div style={{ fontSize: '0.9rem' }}>
                            You have <strong>{uncategorizedCount} transactions</strong> without a category.
                            These must be categorized before you can generate your Filing Pack.
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setSearchTerm('uncategorized')}>
                                Filter Uncategorized
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '250px' }}
                    />
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                    <button
                        onClick={handleAutoCategorize}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)'
                        }}
                    >
                        ✨ Magic Auto-Cat
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {onNavigate && (
                        <button
                            onClick={() => onNavigate('analysis_pl')}
                            style={{ marginLeft: '1rem', padding: '0.5rem 1rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                        >
                            Next: Review Analysis →
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    {/* ... thead ... */}
                    <thead style={{ position: 'sticky', top: 0, background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', zIndex: 10 }}>
                        <tr style={{ textAlign: 'left', color: '#64748b' }}>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', width: '40px' }}><input type="checkbox" checked={selectedIds.size === transactions.length && transactions.length > 0} onChange={toggleSelectAll} /></th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>Date</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>Description</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Money In</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Money Out</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>Source</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', width: '180px' }}>Category</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', width: '150px' }}>Sub-category</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0', width: '120px' }}>Tax Tag</th>
                            <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map(t => {
                            const isSelected = selectedIds.has(t.id);
                            // ... existing row render ...
                            return (
                                <tr key={t.id} style={{ background: isSelected ? '#f0f9ff' : 'white', borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.75rem' }}><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(t.id)} /></td>
                                    <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>
                                        <input
                                            type="date"
                                            value={(() => {
                                                try {
                                                    const d = new Date(t.date);
                                                    return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
                                                } catch { return ''; }
                                            })()}
                                            onChange={(e) => {
                                                const d = new Date(e.target.value);
                                                if (!isNaN(d.getTime())) handleRowUpdate(t.id, 'date', d);
                                            }}
                                            style={{ border: '1px solid transparent', background: 'transparent', fontFamily: 'inherit', color: 'inherit', width: '130px', cursor: 'pointer' }}
                                        />
                                        {t.preview_url && (
                                            <button
                                                onClick={() => setPreviewUrl(t.preview_url!)}
                                                style={{ display: 'block', marginTop: '0.2rem', fontSize: '0.7rem', color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                                            >
                                                View Doc 📄
                                            </button>
                                        )}
                                    </td>
                                    <td style={{ padding: '0.75rem', maxWidth: '300px' }}>
                                        <input
                                            type="text"
                                            value={t.description}
                                            onChange={(e) => handleRowUpdate(t.id, 'description', e.target.value)}
                                            style={{ width: '100%', border: '1px solid transparent', background: 'transparent', fontFamily: 'inherit', color: 'inherit' }}
                                        />
                                        {t.excluded_from_tax && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: '#fee2e2', color: '#dc2626', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>EXCLUDED</span>}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#16a34a' }}>
                                        <input
                                            type="number"
                                            value={t.amount > 0 ? t.amount : ''}
                                            placeholder="-"
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) handleRowUpdate(t.id, 'amount', Math.abs(val));
                                                else if (e.target.value === '') handleRowUpdate(t.id, 'amount', 0);
                                            }}
                                            style={{ width: '100%', textAlign: 'right', border: '1px solid transparent', background: 'transparent', color: '#16a34a', fontWeight: '500' }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#dc2626' }}>
                                        <input
                                            type="number"
                                            value={t.amount < 0 ? Math.abs(t.amount) : ''}
                                            placeholder="-"
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                if (!isNaN(val)) handleRowUpdate(t.id, 'amount', -Math.abs(val));
                                                else if (e.target.value === '') handleRowUpdate(t.id, 'amount', 0);
                                            }}
                                            style={{ width: '100%', textAlign: 'right', border: '1px solid transparent', background: 'transparent', color: '#dc2626', fontWeight: '500' }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                                        {t.source_type ? t.source_type.replace('_', ' ').toLowerCase() : '-'}
                                    </td>

                                    {/* Category Edit */}
                                    <td style={{ padding: '0.5rem' }}>
                                        <select
                                            value={t.category_name}
                                            onChange={e => handleRowUpdate(t.id, 'category_name', e.target.value)}
                                            style={{ width: '100%', padding: '0.25rem', border: '1px solid transparent', background: 'transparent', cursor: 'pointer' }}
                                        >
                                            <option value="Uncategorized Income">Uncategorized Income</option>
                                            <option value="Uncategorized Expense">Uncategorized Expense</option>
                                            {Object.keys(CATEGORY_RULES).map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                            <option value="Sales">Sales</option>
                                            <option value="Consulting">Consulting</option>
                                            <option value="Salaries">Salaries</option>
                                            <option value="Bank Charges">Bank Charges</option>
                                        </select>
                                    </td>

                                    {/* Sub-cat Edit (Input for now) */}
                                    <td style={{ padding: '0.5rem' }}>
                                        <input
                                            type="text"
                                            value={t.sub_category || ''}
                                            placeholder="Sub-cat..."
                                            onChange={e => handleRowUpdate(t.id, 'sub_category', e.target.value)}
                                            style={{ width: '100%', border: 'none', background: 'transparent' }}
                                        />
                                    </td>

                                    {/* Tax Tag Edit */}
                                    <td style={{ padding: '0.5rem' }}>
                                        <select
                                            value={t.tax_tag || 'None'}
                                            onChange={e => handleRowUpdate(t.id, 'tax_tag', e.target.value)}
                                            style={{
                                                background: getTagColor(t.tax_tag || 'None'),
                                                color: getTagTextColor(t.tax_tag || 'None'),
                                                border: 'none',
                                                borderRadius: '12px',
                                                padding: '0.25rem 0.75rem',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                appearance: 'none',
                                                textAlign: 'center',
                                                width: '100%'
                                            }}
                                        >
                                            <option value="None">None</option>
                                            <option value="VAT">VAT</option>
                                            <option value="WHT">WHT</option>
                                            <option value="Non-deductible">Non-deductible</option>
                                            <option value="Owner Loan">Owner Loan</option>
                                            <option value="Capital Gain">Capital Gain</option>
                                        </select>
                                    </td>

                                    {/* Notes Edit */}
                                    <td style={{ padding: '0.5rem' }}>
                                        <input
                                            type="text"
                                            value={t.notes || ''}
                                            placeholder="Add note..."
                                            onChange={e => handleRowUpdate(t.id, 'notes', e.target.value)}
                                            style={{ width: '100%', border: 'none', background: 'transparent', color: '#64748b' }}
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Preview Modal */}
            {
                previewUrl && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', width: '90%', height: '90%', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>Document Preview</h3>
                                <button onClick={() => setPreviewUrl(null)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                            </div>
                            <div style={{ flex: 1, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Document Preview" />
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
}
