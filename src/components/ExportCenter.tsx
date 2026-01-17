import { useState } from 'react';
import type { Transaction, StatementSummary } from '../engine/types';
import {
    exportTransactionsToCSV,
    exportSummaryToCSV,
    exportCategoryBreakdownToCSV,
    exportToExcelAdvanced
} from '../engine/exportUtils';
import { generatePDFReport, generateExcelWorkbook } from '../engine/reports';
import type { PitInput, CitInput, CgtInput, WhtInput, VatInput } from '../engine/types';

interface ExportCenterProps {
    transactions: Transaction[];
    summary: StatementSummary;
    companyName?: string;
    // Tax data (optional)
    pitInput?: PitInput;
    citInput?: CitInput;
    cgtInput?: CgtInput;
    whtInput?: WhtInput;
    vatInput?: VatInput;
}

export function ExportCenter({
    transactions,
    summary,
    companyName = 'Your Business',
    pitInput,
    citInput,
    cgtInput,
    whtInput,
    vatInput
}: ExportCenterProps) {
    const [exporting, setExporting] = useState(false);
    const [lastExport, setLastExport] = useState<{ type: string; timestamp: Date } | null>(null);

    const handleExport = async (type: string, action: () => void) => {
        setExporting(true);
        try {
            action();
            setLastExport({ type, timestamp: new Date() });
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
                    Export Center
                </h1>
                <p style={{ color: '#64748b' }}>
                    Download your financial data in various formats
                </p>
            </div>

            {/* Last Export Info */}
            {lastExport && (
                <div style={{
                    background: '#dcfce7',
                    border: '1px solid #10b981',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                    <div>
                        <div style={{ fontWeight: '600', color: '#166534' }}>Export Successful</div>
                        <div style={{ fontSize: '0.9rem', color: '#15803d' }}>
                            {lastExport.type} exported at {lastExport.timestamp.toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            )}

            {/* Export Options Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* CSV Exports */}
                <ExportCard
                    title="CSV - All Transactions"
                    description="Complete transaction data for external analysis"
                    icon="📊"
                    format="CSV"
                    disabled={exporting}
                    onExport={() => handleExport('CSV - Transactions', () =>
                        exportTransactionsToCSV(transactions, `${companyName}_Transactions.csv`)
                    )}
                />

                <ExportCard
                    title="CSV - Financial Summary"
                    description="Key financial metrics and totals"
                    icon="📈"
                    format="CSV"
                    disabled={exporting}
                    onExport={() => handleExport('CSV - Summary', () =>
                        exportSummaryToCSV(summary, `${companyName}_Summary.csv`)
                    )}
                />

                <ExportCard
                    title="CSV - Category Breakdown"
                    description="Expense analysis by category"
                    icon="🏷️"
                    format="CSV"
                    disabled={exporting}
                    onExport={() => handleExport('CSV - Categories', () =>
                        exportCategoryBreakdownToCSV(transactions, `${companyName}_Categories.csv`)
                    )}
                />

                {/* Excel Exports */}
                <ExportCard
                    title="Excel - Advanced Report"
                    description="Multi-sheet workbook with analysis & formulas"
                    icon="📑"
                    format="XLSX"
                    disabled={exporting}
                    recommended
                    onExport={() => handleExport('Excel - Advanced', () =>
                        exportToExcelAdvanced(transactions, summary, companyName)
                    )}
                />

                {/* PDF Exports */}
                {citInput && (
                    <ExportCard
                        title="PDF - Tax Assessment"
                        description="Professional tax computation report"
                        icon="📄"
                        format="PDF"
                        disabled={exporting}
                        onExport={() => handleExport('PDF - Tax Report', () =>
                            generatePDFReport({
                                type: 'SUMMARY',
                                date: new Date(),
                                statementSummary: summary,
                                pit: pitInput,
                                cit: citInput,
                                cgt: cgtInput,
                                wht: whtInput,
                                vat: vatInput
                            })
                        )}
                    />
                )}

                {/* Full Filing Pack */}
                {citInput && vatInput && (
                    <ExportCard
                        title="Excel - Complete Filing Pack"
                        description="All tax computations in one workbook"
                        icon="📦"
                        format="XLSX"
                        disabled={exporting}
                        recommended
                        onExport={() => handleExport('Excel - Filing Pack', () =>
                            generateExcelWorkbook({
                                transactions,
                                summary,
                                pit: pitInput || { gross_income: 0, allowable_deductions: 0, non_taxable_income: 0, actual_rent_paid: 0 },
                                cit: citInput,
                                cgt: cgtInput || { entity_type: 'company', gain_amount: 0, turnover: 0 },
                                wht: whtInput || { wht_payable: 0, wht_receivable: 0 },
                                vat: vatInput
                            })
                        )}
                    />
                )}
            </div>

            {/* Export Tips */}
            <div style={{
                marginTop: '3rem',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '12px',
                padding: '1.5rem'
            }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0369a1', marginBottom: '1rem' }}>
                    💡 Export Tips
                </h3>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#0c4a6e', lineHeight: '1.8' }}>
                    <li><strong>CSV</strong> - Best for importing into other software or custom analysis</li>
                    <li><strong>Excel</strong> - Includes formulas, charts, and multiple analysis sheets</li>
                    <li><strong>PDF</strong> - Professional reports for sharing with accountants or authorities</li>
                    <li><strong>Filing Pack</strong> - Complete tax submission package with all computations</li>
                </ul>
            </div>

            {/* Data Summary */}
            <div style={{
                marginTop: '2rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
            }}>
                <StatCard label="Total Transactions" value={transactions.length.toString()} />
                <StatCard label="Date Range" value={`${new Date(summary.period_start).toLocaleDateString()} - ${new Date(summary.period_end).toLocaleDateString()}`} />
                <StatCard label="Total Revenue" value={`₦${summary.total_inflow.toLocaleString()}`} />
                <StatCard label="Total Expenses" value={`₦${summary.total_outflow.toLocaleString()}`} />
            </div>
        </div>
    );
}

function ExportCard({
    title,
    description,
    icon,
    format,
    disabled,
    recommended,
    onExport
}: {
    title: string;
    description: string;
    icon: string;
    format: string;
    disabled: boolean;
    recommended?: boolean;
    onExport: () => void;
}) {
    return (
        <div style={{
            background: 'white',
            border: recommended ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.5rem',
            position: 'relative',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1
        }}
            onMouseEnter={(e) => !disabled && (e.currentTarget.style.transform = 'translateY(-2px)', e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)', e.currentTarget.style.boxShadow = 'none')}
            onClick={!disabled ? onExport : undefined}
        >
            {recommended && (
                <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '10px',
                    background: '#3b82f6',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '99px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                }}>
                    RECOMMENDED
                </div>
            )}

            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
                {title}
            </h3>

            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem', minHeight: '40px' }}>
                {description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                    background: '#f1f5f9',
                    color: '#475569',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                }}>
                    {format}
                </span>

                <button style={{
                    background: recommended ? '#3b82f6' : 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                }}>
                    {disabled ? 'Exporting...' : 'Export'}
                </button>
            </div>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center'
        }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>{label}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>{value}</div>
        </div>
    );
}
