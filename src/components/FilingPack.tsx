import { useState } from 'react';
import { generateExcelWorkbook } from '../engine/excel';
import { generatePDFReport } from '../engine/reports';
import type { Transaction, StatementSummary } from '../engine/types';
import type { PitInput } from '../engine/pit';
import type { CitInput } from '../engine/cit';
import type { VatInput } from '../engine/vat';

interface FilingPackProps {
    transactions: Transaction[];
    summary: StatementSummary;
    pitInput: PitInput;
    citInput: CitInput;
    vatInput: VatInput;
}

export function FilingPack({ transactions, summary, pitInput, citInput, vatInput }: FilingPackProps) {
    const [checklist, setChecklist] = useState({
        incomeReconciled: false,
        expensesReviewed: false,
        vatReconciled: false,
        payeCredits: false,
    });

    const allChecked = Object.values(checklist).every(Boolean);

    const handleDownloadPdf = () => {
        // Collect all data for the full report
        const reportData = {
            type: 'SUMMARY' as const,
            summary,
            pit: pitInput,
            cit: citInput,
            vat: vatInput,
            date: new Date()
        };
        generatePDFReport(reportData);
    };

    const handleDownloadExcel = () => {
        generateExcelWorkbook(transactions);
    };

    const handleSaveForAccountant = () => {
        alert("Pack saved! Your accountant can now access this snapshot.");
    };

    const toggleCheck = (key: keyof typeof checklist) => {
        setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b' }}>Filing Pack & Submission Prep</h2>
                <p style={{ color: '#64748b' }}>Prepare your final documents for the tax year. Ensure all checks are complete before exporting.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                {/* Left Column: Checklist & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Checklist Card */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#334155' }}>Readiness Checklist</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <CheckItem
                                label="Income Reconciled with Bank Statement"
                                checked={checklist.incomeReconciled}
                                onChange={() => toggleCheck('incomeReconciled')}
                            />
                            <CheckItem
                                label="Expenses Reviewed & Non-Deductibles Tagged"
                                checked={checklist.expensesReviewed}
                                onChange={() => toggleCheck('expensesReviewed')}
                            />
                            <CheckItem
                                label="VAT Input/Output Reconciled"
                                checked={checklist.vatReconciled}
                                onChange={() => toggleCheck('vatReconciled')}
                            />
                            <CheckItem
                                label="PAYE Credits Applied (if applicable)"
                                checked={checklist.payeCredits}
                                onChange={() => toggleCheck('payeCredits')}
                            />
                        </div>
                    </div>

                    {/* Actions Area */}
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#334155' }}>Export & Filing Actions</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <ActionButton
                                label="Download Filing Summary (PDF)"
                                icon="📄"
                                onClick={handleDownloadPdf}
                                disabled={!allChecked}
                                primary
                            />
                            <ActionButton
                                label="Export Full Excel Pack"
                                icon="📊"
                                onClick={handleDownloadExcel}
                                disabled={false}
                            />
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <button
                                onClick={handleSaveForAccountant}
                                disabled={!allChecked}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: allChecked ? '#0f172a' : '#cbd5e1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: allChecked ? 'pointer' : 'not-allowed',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                <span>🔐</span> Save Snapshot for Accountant
                            </button>
                            {!allChecked && <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>Complete checklist to unlock filing actions</div>}
                        </div>
                    </div>

                </div>

                {/* Right Column: Assumptions & Info */}
                <div>
                    <div style={{ background: '#fffbeb', padding: '1.5rem', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#92400e' }}>📌 Important Assumptions</h3>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#92400e', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li><strong>Estimates Only:</strong> Figures are based on provided logic and may not cover all complex edge cases.</li>
                            <li><strong>No Prior Payments:</strong> Computations assume no WHT credits or earlier installments paid unless explicitly entered.</li>
                            <li><strong>Finance Act 2025:</strong> Rules applied are based on the latest Finance Act provisions including rent relief caps.</li>
                        </ul>
                    </div>

                    <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '8px', background: '#eff6ff', border: '1px solid #dbeafe', fontSize: '0.9rem', color: '#1e40af' }}>
                        <strong>Need Help?</strong><br />
                        If you are unsure about any item, please consult a chartered tax practitioner before filing.
                    </div>
                </div>

            </div>
        </div>
    );
}

function CheckItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) {
    return (
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', background: checked ? '#f0fdf4' : 'transparent', transition: 'background 0.2s' }}>
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                style={{ width: '1.25rem', height: '1.25rem', accentColor: '#166534', cursor: 'pointer' }}
            />
            <span style={{ color: checked ? '#15803d' : '#475569', textDecoration: checked ? 'none' : 'none', fontWeight: checked ? '500' : '400' }}>{label}</span>
        </label>
    );
}

function ActionButton({ label, icon, onClick, disabled, primary }: { label: string, icon: string, onClick: () => void, disabled: boolean, primary?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                padding: '1.5rem 1rem',
                background: disabled ? '#f1f5f9' : (primary ? 'white' : 'white'),
                border: disabled ? '1px solid #e2e8f0' : (primary ? '2px solid #1e293b' : '1px solid #cbd5e1'),
                borderRadius: '8px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.7 : 1,
                color: disabled ? '#94a3b8' : '#1e293b',
                boxShadow: disabled || !primary ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
        >
            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', textAlign: 'center' }}>{label}</span>
        </button>
    )
}
