import { generateExcelWorkbook } from '../engine/excel';
import { generatePDFReport } from '../engine/reports';
import type { Transaction, StatementSummary, FilingChecklist, FilingChecks } from '../engine/types';
import type { PitInput } from '../engine/pit';
import type { CitInput } from '../engine/cit';
import type { VatInput } from '../engine/vat';

interface FilingPackProps {
    transactions: Transaction[];
    summary: StatementSummary;
    pitInput: PitInput;
    citInput: CitInput;
    vatInput: VatInput;
    checklist: FilingChecklist; // kept for compatibility but not primary driver
    filingChecks: FilingChecks;
    onFilingChecksChange: (checks: FilingChecks | ((prev: FilingChecks) => FilingChecks)) => void;
    onChecklistChange: (checklist: FilingChecklist | ((prev: FilingChecklist) => FilingChecklist)) => void;
    onNavigate: (view: string) => void;
}

export function FilingPack({ transactions, summary, pitInput, citInput, vatInput, checklist, filingChecks, onFilingChecksChange, onChecklistChange, onNavigate }: FilingPackProps) {

    // Readiness Logic
    const uncategorizedCount = transactions.filter(t => !t.category_id).length;

    // Manual checks from persistent storage
    const isChecksComplete = filingChecks.bank_reconciled && filingChecks.expenses_reviewed;

    let readinessStatus: 'RED' | 'AMBER' | 'GREEN' = 'GREEN';
    if (uncategorizedCount > 0) {
        readinessStatus = 'RED';
    } else if (!isChecksComplete) {
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
        /*  const workbook = generateExcelWorkbook({
             transactions,
             summary,
             pit: pitInput,
             cit: citInput,
             vat: vatInput
         }); */
        // Excel download logic would go here
        alert("Excel export not yet implemented in this delta.");
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
                display: 'flex', alignItems: 'center', gap: '1.5rem'
            }}>
                <div style={{ fontSize: '3rem' }}>
                    {readinessStatus === 'GREEN' ? '✅' : (readinessStatus === 'AMBER' ? '⚠️' : '🛑')}
                </div>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>
                        Filing Status: {readinessStatus}
                    </h2>
                    <p style={{ color: '#334155' }}>
                        {readinessStatus === 'GREEN'
                            ? "All systems go. Your filing pack is ready for export."
                            : (readinessStatus === 'AMBER'
                                ? "Manual checks incomplete. You can preview the draft, but final export is blocked."
                                : `${uncategorizedCount} Uncategorized transactions found. Action required.`
                            )
                        }
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
                                label={`Expenses Reviewed (${uncategorizedCount} Uncategorized)`}
                                checked={filingChecks.expenses_reviewed}
                                onChange={() => toggleCheck('expenses_reviewed')}
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
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#92400e' }}>📌 Important Assumptions</h3>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.9rem', color: '#92400e', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li><strong>Management Representation:</strong> By exporting this pack, management confirms that all expenses claimed are wholly, reasonably, and exclusively for business purposes.</li>
                            <li><strong>Audit Readiness:</strong> The user acknowledges that supporting documentation (receipts/invoices) must be available for all claimed deductions upon FIRS request.</li>
                            <li><strong>Regulatory Basis:</strong> Computations are based on the Finance Act 2024/2025 provisions. Tax authorities may interpret specific provisions differently.</li>
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
