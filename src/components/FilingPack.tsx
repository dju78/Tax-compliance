import { generatePDFReport, generateExcelWorkbook } from '../engine/reports';
import type { Transaction, StatementSummary, FilingChecklist, FilingChecks } from '../engine/types';
import type { PitInput } from '../engine/pit';
import type { CitInput } from '../engine/cit';
import type { CgtInput } from '../engine/cgt';
import type { WhtInput } from '../engine/wht';
import type { VatInput } from '../engine/vat';

import type { AuditInputs } from '../engine/auditRisk';

interface FilingPackProps {
    transactions: Transaction[];
    summary: StatementSummary | null;
    pitInput: PitInput;
    citInput: CitInput;

    cgtInput: CgtInput;
    whtInput: WhtInput;
    vatInput: VatInput;
    filingChecks: FilingChecks;
    expenseChecklist?: AuditInputs;
    checklist: FilingChecklist; // kept for compatibility but not primary driver
    onFilingChecksChange: (checks: FilingChecks | ((prev: FilingChecks) => FilingChecks)) => void;
    onNavigate: (view: string) => void;
}

export function FilingPack({ transactions, summary, pitInput, citInput, cgtInput, whtInput, vatInput, filingChecks, expenseChecklist, onFilingChecksChange, onNavigate }: FilingPackProps) {

    // Readiness Logic
    const uncategorizedCount = transactions.filter(t => !t.category_name || t.category_name.startsWith('Uncategorized')).length;

    // Checklist Audit Status
    const auditStatus = expenseChecklist && expenseChecklist.isReviewed ? 'REVIEWED' : 'PENDING';

    // Manual checks from persistent storage
    const isChecksComplete = filingChecks.bank_reconciled && filingChecks.expenses_reviewed;

    let readinessStatus: 'RED' | 'AMBER' | 'GREEN' = 'GREEN';
    if (uncategorizedCount > 0) {
        readinessStatus = 'RED';
    } else if (!isChecksComplete || auditStatus === 'PENDING') {
        readinessStatus = 'AMBER';
    }

    const isBlocked = readinessStatus === 'RED';
    const isAmberBlock = readinessStatus === 'AMBER';

    const handleDownloadPdf = () => {
        if (isBlocked) {
            alert("Cannot export filing pack while critical red flags exist. Please categorize all transactions.");
            return;
        }
        if (isAmberBlock) {
            alert("Cannot export FINAL filing pack until all manual checks are confirmed. You can only preview.");
            return;
        }
        // Collect all data for the full report
        const reportData = {
            type: 'SUMMARY' as const,
            summary,
            pit: pitInput,
            cit: citInput,

            cgt: cgtInput,
            wht: whtInput,
            vat: vatInput,
            date: new Date()
        };
        generatePDFReport(reportData);
    };

    const handleDownloadExcel = () => {
        if (isBlocked) {
            alert("Cannot export excel pack while critical red flags exist.");
            return;
        }
        generateExcelWorkbook({
            transactions,
            summary: summary!,
            pit: pitInput,
            cit: citInput,
            cgt: cgtInput,

            wht: whtInput,
            vat: vatInput
        });
    };

    const handleSaveForAccountant = () => {
        // Snapshot logic
        alert("Snapshot saved! (Simulation)");
    };

    const toggleCheck = (key: keyof FilingChecks) => {
        if (key === 'company_id' || key === 'updated_at' || key === 'tax_year_label') return;
        onFilingChecksChange(prev => ({
            ...prev,
            [key]: !prev[key],
            updated_at: new Date()
        }));
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            {/* Status Banner */}
            <div style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                borderRadius: '12px',
                background: readinessStatus === 'GREEN' ? '#dcfce7' : (readinessStatus === 'AMBER' ? '#fef3c7' : '#fee2e2'),
                border: `2px solid ${readinessStatus === 'GREEN' ? '#22c55e' : (readinessStatus === 'AMBER' ? '#f59e0b' : '#ef4444')}`,
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem'
            }}>
                <span style={{ fontSize: '2.5rem' }}>
                    {readinessStatus === 'GREEN' ? '✅' : (readinessStatus === 'AMBER' ? '⚠️' : '🛑')}
                </span>
                <div>
                    <h2 style={{
                        fontSize: '1.4rem',
                        fontWeight: 'bold',
                        color: readinessStatus === 'GREEN' ? '#166534' : (readinessStatus === 'AMBER' ? '#b45309' : '#b91c1c'),
                        marginBottom: '0.25rem'
                    }}>
                        Filing Status: {readinessStatus}
                    </h2>
                    <p style={{ color: readinessStatus === 'GREEN' ? '#15803d' : (readinessStatus === 'AMBER' ? '#92400e' : '#991b1b') }}>
                        {readinessStatus === 'RED' && "Critical issues found. You must categorize all transactions before proceeding."}
                        {readinessStatus === 'GREEN' && "All checks passed. You are ready to export the final filing pack."}
                        {readinessStatus === 'AMBER' && (
                            <span>
                                Not ready yet.
                                {auditStatus === 'PENDING' && <strong> Please click "Expense Audit Pending" below to complete the audit.</strong>}
                                {(auditStatus !== 'PENDING' && !isChecksComplete) && <strong> Please tick the green checkboxes below to confirm readiness.</strong>}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }}>
                {/* Left Column: Actions & Checks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Readiness Checklist */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#0f172a' }}>Readiness Checklist</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <CheckItem
                                label="Income Reconciled with Bank Statement"
                                checked={filingChecks.bank_reconciled}
                                onChange={() => toggleCheck('bank_reconciled')}
                            />
                            <CheckItem
                                checked={filingChecks.expenses_reviewed && uncategorizedCount === 0}
                                label={`Expenses Reviewed (${uncategorizedCount} Uncategorized)`}
                                onChange={() => onFilingChecksChange(prev => ({ ...prev, expenses_reviewed: !prev.expenses_reviewed }))}
                            />
                            <CheckItem
                                checked={expenseChecklist ? !!expenseChecklist.isReviewed : false}
                                label={expenseChecklist && expenseChecklist.isReviewed ? "Disallowable Expenses Audited" : "Expense Audit Pending"}
                                onChange={() => onNavigate && onNavigate('expense_checklist')}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#0f172a' }}>Export Options</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <ActionButton
                                label={isAmberBlock ? "Download Draft Preview" : "Download Filing Summary (PDF)"}
                                icon="📄"
                                onClick={handleDownloadPdf}
                                disabled={isBlocked}
                                primary
                            />
                            <ActionButton
                                label="Export Full Excel Pack"
                                icon="📊"
                                onClick={handleDownloadExcel}
                                disabled={isBlocked}
                            />
                            <ActionButton
                                label="Generate Dividend Voucher"
                                icon="📜"
                                onClick={() => onNavigate('dividend_vouchers')}
                                disabled={false}
                            />
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <button
                                onClick={handleSaveForAccountant}
                                disabled={isBlocked || readinessStatus === 'AMBER'}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: (isBlocked || readinessStatus === 'AMBER') ? '#cbd5e1' : '#0f172a',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: (isBlocked || readinessStatus === 'AMBER') ? 'not-allowed' : 'pointer',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem'
                                }}
                            >
                                <span>🔐</span> Save Snapshot for Accountant
                            </button>
                        </div>
                    </div>

                </div>

                {/* Right Column: Assumptions & Info */}
                <div>
                    <div style={{ background: '#fffbeb', padding: '1.5rem', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#92400e' }}>📌 Simple Guidelines</h3>
                        <div style={{ fontSize: '0.9rem', color: '#92400e' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#166534' }}>👍 Do:</p>
                            <ul style={{ paddingLeft: '1.2rem', marginBottom: '1rem' }}>
                                <li><strong>Keep your receipts:</strong> FIRS may ask for evidence of your expenses.</li>
                                <li><strong>Review carefully:</strong> Ensure all transactions are actually for the business.</li>
                            </ul>

                            <p style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#b91c1c' }}>👎 Do Not:</p>
                            <ul style={{ paddingLeft: '1.2rem' }}>
                                <li><strong>Mix personal costs:</strong> Do not include family expenses or personal rent.</li>
                                <li><strong>Hide income:</strong> All business earnings must be declared to avoid penalties.</li>
                            </ul>
                        </div>
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
