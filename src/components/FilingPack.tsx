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

    // ...

    const toggleCheck = (key: keyof FilingChecks) => {
        if (key === 'company_id' || key === 'updated_at' || key === 'tax_year_label') return;
        onFilingChecksChange(prev => ({
            ...prev,
            [key]: !prev[key],
            updated_at: new Date()
        }));
    };

    // ...

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
    {/* Deprecated Checks Visuals but keeping simpler UI */ }

    // ...

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
                    </div >

                </div >

            </div >
        </div >
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
