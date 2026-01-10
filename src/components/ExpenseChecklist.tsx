import { useState, useMemo } from 'react';
import { EXPENSE_CHECKLIST_SOLE, EXPENSE_CHECKLIST_LTD } from '../data/expenseChecklists';
import { calculateAuditRisk, type AuditInputs } from '../engine/auditRisk';
import { AuditRiskReport } from './AuditRiskReport';

export function ExpenseChecklist() {
    const [businessType, setBusinessType] = useState<'SOLE' | 'LTD'>('SOLE');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [turnover, setTurnover] = useState<number>(0);
    const [totalExpenses, setTotalExpenses] = useState<number>(0); // Mainly for Sole checks
    const [profit, setProfit] = useState<number>(0); // Mainly for LTD director check

    // Specific inputs for proportion tests
    const [transportTotal, setTransportTotal] = useState<number>(0);
    const [marketingTotal, setMarketingTotal] = useState<number>(0);
    const [phoneTotal, setPhoneTotal] = useState<number>(0);
    const [directorPay, setDirectorPay] = useState<number>(0);

    // Boolean flags
    const [receiptMissing, setReceiptMissing] = useState(false);
    const [noSeparateAccount, setNoSeparateAccount] = useState(false); // Sole
    const [cashOver500k, setCashOver500k] = useState(false); // LTD
    const [noWHT, setNoWHT] = useState(false); // LTD
    const [repeatedLosses, setRepeatedLosses] = useState(false);
    const [suddenSpike, setSuddenSpike] = useState(false);

    const checklist = businessType === 'SOLE' ? EXPENSE_CHECKLIST_SOLE : EXPENSE_CHECKLIST_LTD;

    const toggleItem = (itemId: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        setSelectedItems(newSet);
    };

    const auditResult = useMemo(() => {
        const inputs: AuditInputs = {
            type: businessType,
            turnover,
            totalExpenses,
            profit,
            selectedItems: Array.from(selectedItems),
            receiptMissing,
            noSeparateAccount,
            cashOver500k,
            noWHT,
            repeatedLosses,
            suddenSpike,
            transportTotal,
            marketingTotal,
            phoneInternetTotal: phoneTotal,
            directorRemuneration: directorPay
        };
        return calculateAuditRisk(inputs, checklist);
    }, [businessType, turnover, totalExpenses, profit, selectedItems, receiptMissing, noSeparateAccount, cashOver500k, noWHT, repeatedLosses, suddenSpike, transportTotal, marketingTotal, phoneTotal, directorPay, checklist]);

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
                                onClick={() => setBusinessType('SOLE')}
                                style={{
                                    padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500',
                                    background: businessType === 'SOLE' ? 'white' : 'transparent',
                                    boxShadow: businessType === 'SOLE' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                    color: businessType === 'SOLE' ? '#0f172a' : '#64748b'
                                }}
                            >
                                Sole Proprietor
                            </button>
                            <button
                                onClick={() => setBusinessType('LTD')}
                                style={{
                                    padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500',
                                    background: businessType === 'LTD' ? 'white' : 'transparent',
                                    boxShadow: businessType === 'LTD' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                    color: businessType === 'LTD' ? '#0f172a' : '#64748b'
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
                                <input type="number" value={turnover} onChange={(e) => setTurnover(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                            </div>

                            {businessType === 'SOLE' ? (
                                <div>
                                    <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.25rem' }}>Total Expenses (₦)</label>
                                    <input type="number" value={totalExpenses} onChange={(e) => setTotalExpenses(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                            ) : (
                                <div>
                                    <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.25rem' }}>Net Profit (Pre-Tax) (₦)</label>
                                    <input type="number" value={profit} onChange={(e) => setProfit(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                            )}

                            {/* Specific Category Totals for Ratio Checks */}
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.25rem' }}>Transport/Fuel Cost (₦)</label>
                                <input type="number" value={transportTotal} onChange={(e) => setTransportTotal(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.25rem' }}>Marketing Cost (₦)</label>
                                <input type="number" value={marketingTotal} onChange={(e) => setMarketingTotal(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                            </div>

                            {businessType === 'SOLE' && (
                                <div>
                                    <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.25rem' }}>Phone/Internet Cost (₦)</label>
                                    <input type="number" value={phoneTotal} onChange={(e) => setPhoneTotal(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                            )}
                            {businessType === 'LTD' && (
                                <div>
                                    <label style={{ display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.25rem' }}>Director Remuneration (₦)</label>
                                    <input type="number" value={directorPay} onChange={(e) => setDirectorPay(Number(e.target.value))} style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                            )}
                        </div>

                        {/* Red Flag Toggles */}
                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={receiptMissing} onChange={(e) => setReceiptMissing(e.target.checked)} />
                                <span>I have some expenses without receipts / invoices</span>
                            </label>

                            {businessType === 'SOLE' && (
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={noSeparateAccount} onChange={(e) => setNoSeparateAccount(e.target.checked)} />
                                    <span>I do not have a separate business bank account</span>
                                </label>
                            )}

                            {businessType === 'LTD' && (
                                <>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={cashOver500k} onChange={(e) => setCashOver500k(e.target.checked)} />
                                        <span>I made cash payments above ₦500,000</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={noWHT} onChange={(e) => setNoWHT(e.target.checked)} />
                                        <span>I did not deduct WHT where required</span>
                                    </label>
                                </>
                            )}

                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={repeatedLosses} onChange={(e) => setRepeatedLosses(e.target.checked)} />
                                <span>Business has made losses for 2+ years</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={suddenSpike} onChange={(e) => setSuddenSpike(e.target.checked)} />
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
                                                    checked={selectedItems.has(item.id)}
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
