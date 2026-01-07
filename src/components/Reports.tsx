import { generateExcelWorkbook } from '../engine/excel';
import { generatePDFReport } from '../engine/reports';
import type { Transaction, StatementSummary } from '../engine/types';
import type { PitInput } from '../engine/pit';
import type { CitInput } from '../engine/cit';
import type { VatInput } from '../engine/vat';

interface ReportsProps {
    transactions: Transaction[];
    summary: StatementSummary;
    pitInput: PitInput;
    citInput: CitInput;
    vatInput: VatInput;
}

export function Reports({ transactions, summary, pitInput, citInput, vatInput }: ReportsProps) {

    const handleDownloadPdf = (type: 'SUMMARY' | 'PIT' | 'CIT' | 'VAT' = 'SUMMARY') => {
        generatePDFReport({
            type,
            summary: type === 'SUMMARY' ? summary : undefined, // Include statement breakdown for summary
            statementSummary: type === 'SUMMARY' ? summary : undefined,
            pit: pitInput,
            cit: citInput,
            vat: vatInput,
            date: new Date()
        });
    };

    const handleDownloadExcel = () => {
        generateExcelWorkbook(transactions);
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '2rem' }}>Reports Center</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Tax Computation Summary */}
                <ReportCard
                    title="Tax Computation Summary"
                    description="Consolidated view of PIT, CIT, and VAT liabilities."
                    icon="⚖️"
                    onPdf={() => handleDownloadPdf('SUMMARY')}
                    onExcel={handleDownloadExcel}
                />

                {/* Statement of Account */}
                <ReportCard
                    title="Statement of Account"
                    description="Detailed record of all inflows, outflows, and running balances."
                    icon="🏦"
                    onPdf={() => handleDownloadPdf('SUMMARY')} // Reusing summary for now
                    onExcel={handleDownloadExcel} // Excel has full sheet
                />

                {/* Profit & Loss Report */}
                <ReportCard
                    title="Profit & Loss Report"
                    description="Income vs Expenses breakdown, calculating Net Profit."
                    icon="📈"
                    onPdf={() => handleDownloadPdf('CIT')} // Closest approximation
                    onExcel={handleDownloadExcel}
                />

                {/* Transaction Ledger */}
                <ReportCard
                    title="Transaction Ledger"
                    description="Raw ledger data including tags, categories, and tax inputs."
                    icon="📒"
                    onPdf={() => handleDownloadPdf('SUMMARY')}
                    onExcel={handleDownloadExcel}
                />
            </div>

        </div>
    );
}

function ReportCard({ title, description, icon, onPdf, onExcel }: { title: string, description: string, icon: string, onPdf: () => void, onExcel: () => void }) {
    return (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{icon}</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>{title}</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem', flexGrow: 1 }}>{description}</p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                    onClick={onPdf}
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                >
                    <span>📄</span> PDF
                </button>
                <button
                    onClick={onExcel}
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #166534', borderRadius: '6px', background: '#f0fdf4', color: '#166534', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                >
                    <span>📊</span> Excel
                </button>
            </div>
        </div>
    )
}
