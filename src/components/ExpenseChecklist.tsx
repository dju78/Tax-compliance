import { useMemo } from 'react';
import { EXPENSE_CHECKLIST_SOLE, EXPENSE_CHECKLIST_LTD } from '../data/expenseChecklists';
import { calculateAuditRisk, type AuditInputs } from '../engine/auditRisk';
import { AuditRiskReport } from './AuditRiskReport';

interface ExpenseChecklistProps {
    data: AuditInputs;
    onChange: (data: AuditInputs) => void;
}

export function ExpenseChecklist({ data, onChange }: ExpenseChecklistProps) {
    const checklist = data.type === 'SOLE' ? EXPENSE_CHECKLIST_SOLE : EXPENSE_CHECKLIST_LTD;

    const updateField = (field: keyof AuditInputs, value: unknown) => {
        onChange({ ...data, [field]: value });
    };

    const toggleItem = (itemId: string) => {
        const newSet = new Set(data.selectedItems);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        updateField('selectedItems', Array.from(newSet));
    };

    const auditResult = useMemo(() => {
        return calculateAuditRisk(data, checklist);
    }, [data, checklist]);

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b' }}>
                Expense Checklist & Compliance
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                {/* Left Column: Checklist & Form */}
                <div>
                    {/* Business Type Toggle */}
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600', color: '#64748b' }}>Business Type:</span>
                        <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '6px' }}>
                            <button
                                onClick={() => updateField('type', 'SOLE')}
                                style={{
                                    padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500',
                                    background: data.type === 'SOLE' ? 'white' : 'transparent',
                                    boxShadow: data.type === 'SOLE' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                    color: data.type === 'SOLE' ? '#0f172a' : '#64748b'
                                }}
                            >
                                Sole Proprietor
                            </button>
                            <button
                                onClick={() => updateField('type', 'LTD')}
                                style={{
                                    padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500',
                                    background: data.type === 'LTD' ? 'white' : 'transparent',
                                    boxShadow: data.type === 'LTD' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                    color: data.type === 'LTD' ? '#0f172a' : '#64748b'
                                }}
                            >
                                Limited Company (LTD)
                            </button>
                        </div>
                    </div>

                    {/* Financial Context Inputs */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#334155' }}>Financial Context (For Audit Scoring)</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.25rem' }}>Annual Turnover (₦)</label>
                                <input type="number" value={data.turnover || ''} onChange={(e) => updateField('turnover', Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                            </div>

                            {data.type === 'SOLE' ? (
                                <div>
                                    <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.25rem' }}>Total Expenses (₦)</label>
                                    <input type="number" value={data.totalExpenses || ''} onChange={(e) => updateField('totalExpenses', Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                            ) : (
                                <div>
                                    <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.25rem' }}>Net Profit (Pre-Tax) (₦)</label>
                                    <input type="number" value={data.profit || ''} onChange={(e) => updateField('profit', Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                            )}

                            {/* Specific Category Totals for Ratio Checks */}
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.25rem' }}>Transport/Fuel Cost (₦)</label>
                                <input type="number" value={data.transportTotal || ''} onChange={(e) => updateField('transportTotal', Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.25rem' }}>Marketing Cost (₦)</label>
                                <input type="number" value={data.marketingTotal || ''} onChange={(e) => updateField('marketingTotal', Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                            </div>

                            {data.type === 'SOLE' && (
                                <div>
                                    <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.25rem' }}>Phone/Internet Cost (₦)</label>
                                    <input type="number" value={data.phoneInternetTotal || ''} onChange={(e) => updateField('phoneInternetTotal', Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                            )}
                            {data.type === 'LTD' && (
                                <div>
                                    <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.25rem' }}>Director Remuneration (₦)</label>
                                    <input type="number" value={data.directorRemuneration || ''} onChange={(e) => updateField('directorRemuneration', Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                            )}
                        </div>

                        {/* Red Flag Toggles */}
                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={data.receiptMissing || false} onChange={(e) => updateField('receiptMissing', e.target.checked)} />
                                <span>I have some expenses without receipts / invoices</span>
                            </label>

                            {data.type === 'SOLE' && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={data.noSeparateAccount || false} onChange={(e) => updateField('noSeparateAccount', e.target.checked)} />
                                    <span>I do not have a separate business bank account</span>
                                </label>
                            )}

                            {data.type === 'LTD' && (
                                <>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={data.cashOver500k || false} onChange={(e) => updateField('cashOver500k', e.target.checked)} />
                                        <span>I made cash payments above ₦500,000</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={data.noWHT || false} onChange={(e) => updateField('noWHT', e.target.checked)} />
                                        <span>I did not deduct WHT where required</span>
                                    </label>
                                </>
                            )}

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={data.repeatedLosses || false} onChange={(e) => updateField('repeatedLosses', e.target.checked)} />
                                <span>Business has made losses for 2+ years</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={data.suddenSpike || false} onChange={(e) => updateField('suddenSpike', e.target.checked)} />
                                <span>Expenses spiked &gt;40% compared to last year</span>
                            </label>
                        </div>
                    </div>

                    {/* The Checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {checklist.map(category => (
                            <div key={category.id} style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <div style={{ padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>{category.icon}</span> {category.title}
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                                        {category.items.map(item => (
                                            <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                                <input
                                                    type="checkbox"
                                                    id={item.id}
                                                    checked={data.selectedItems?.includes(item.id) || false}
                                                    onChange={() => toggleItem(item.id)}
                                                    style={{ marginTop: '0.25rem' }}
                                                />
                                                <div>
                                                    <label htmlFor={item.id} style={{ fontWeight: '500', color: item.isDisallowed ? '#dc2626' : '#1e293b', cursor: 'pointer' }}>
                                                        {item.label}
                                                    </label>
                                                    {item.isDisallowed && item.warning && (
                                                        <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>⚠️ {item.warning}</div>
                                                    )}
                                                    {!item.isDisallowed && item.warning && (
                                                        <div style={{ fontSize: '0.75rem', color: '#d97706' }}>ℹ️ {item.warning}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

                {/* Right Column: Sticky Report */}
                <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
                    <AuditRiskReport result={auditResult} />

                    <div style={{ marginTop: '1.5rem', background: '#f0f9ff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#0369a1', marginBottom: '0.5rem' }}>Why FIRS will take this seriously</h4>
                        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#0c4a6e', lineHeight: '1.5', margin: 0 }}>
                            <li>Mirrors actual audit triggers used by FIRS.</li>
                            <li>Encourages voluntary compliance.</li>
                            <li>Reduces likelihood of aggressive expense inflation.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
