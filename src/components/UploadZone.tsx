import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { Transaction, StatementSummary } from '../engine/types';

interface UploadZoneProps {
    onUpload: (data: { transactions: Transaction[], summary: StatementSummary }) => void;
}

export function UploadZone({ onUpload }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [showMapping, setShowMapping] = useState(false);
    const [headers, setHeaders] = useState<string[]>([]);
    const [rawRows, setRawRows] = useState<unknown[][]>([]);

    const [documentType, setDocumentType] = useState<'BANK_STATEMENT' | 'RECEIPT' | 'INVOICE' | 'OTHER'>('BANK_STATEMENT');

    const [mapping, setMapping] = useState({
        date: '',
        description: '',
        amount: '',     // for signed
        moneyIn: '',    // for split
        moneyOut: ''    // for split
    });

    const processDataFile = useCallback((f: File) => {
        const reader = new FileReader();
        const name = f.name.toLowerCase();

        if (name.endsWith('.csv')) {
            reader.onload = (e) => {
                const text = e.target?.result as string;
                const lines = text.split(/\r?\n/);
                const h = lines[0].split(',').map(c => c.replace(/"/g, '').trim());
                setHeaders(h);
                setRawRows(lines.slice(1).map(l => l.split(',')));
                setShowMapping(true);
            };
            reader.readAsText(f);
        } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
            reader.onload = (e) => {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
                if (json.length > 0) {
                    setHeaders(json[0].map(h => String(h)));
                    setRawRows(json.slice(1));
                    setShowMapping(true);
                }
            };
            reader.readAsArrayBuffer(f);
        }
    }, []);

    const handleFiles = useCallback((files: File[]) => {
        const docTransactions: Transaction[] = [];
        let dataFile: File | null = null;

        files.forEach(f => {
            const name = f.name.toLowerCase();
            if (name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
                if (!dataFile) dataFile = f; // Only take first data file for mapping
            } else if (name.endsWith('.pdf') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')) {
                // Batch create placeholders
                const previewUrl = URL.createObjectURL(f);
                docTransactions.push({
                    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    company_id: 'default',
                    date: new Date(),
                    description: `Document Upload: ${f.name}`,
                    amount: 0,
                    is_business: true,
                    dla_status: 'none',
                    tax_year_label: new Date().getFullYear().toString(),
                    category_name: 'Uncategorized Expense',
                    source_type: documentType,
                    preview_url: previewUrl,
                    notes: 'Manual entry required from source document'
                });
            }
        });

        // Upload Docs Batch
        if (docTransactions.length > 0) {
            onUpload({
                transactions: docTransactions,
                summary: {
                    total_inflow: 0,
                    total_outflow: 0,
                    net_cash_flow: 0,
                    transaction_count: docTransactions.length,
                    period_start: new Date(),
                    period_end: new Date()
                }
            });
        }

        // Process Data File (CSV/Excel) - Only one at a time for mapping UI
        if (dataFile) {
            processDataFile(dataFile);
        }
    }, [documentType, onUpload, processDataFile]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    }, [handleFiles]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handleConfirmMapping = () => {
        // Transform Raw Rows to Transactions using Mapping
        const transactions: Transaction[] = [];

        rawRows.forEach((row, idx) => {
            const dateVal = row[headers.indexOf(mapping.date)];
            const descVal = row[headers.indexOf(mapping.description)];

            // Amount Logic
            let amount = 0;
            if (mapping.amount) {
                // Signed Column
                amount = parseVal(row[headers.indexOf(mapping.amount)]);
            } else if (mapping.moneyIn && mapping.moneyOut) {
                // Split Columns
                const credit = parseVal(row[headers.indexOf(mapping.moneyIn)]);
                const debit = parseVal(row[headers.indexOf(mapping.moneyOut)]);
                if (debit > 0) amount = -Math.abs(debit);
                else amount = Math.abs(credit);
            }

            // Only add if valid
            const dateObj = new Date(dateVal as string);
            if (!isNaN(dateObj.getTime()) && !isNaN(amount)) {
                transactions.push({
                    id: `txn_${idx}`,
                    company_id: 'default',
                    date: dateObj,
                    description: String(descVal || ''),
                    amount: amount,
                    is_business: true,
                    dla_status: 'none',
                    tax_year_label: dateObj.getFullYear().toString(),
                    category_name: amount > 0 ? 'Uncategorized Income' : 'Uncategorized Expense',
                    source_type: documentType
                });
            }
        });

        // Calc Summary
        const total_inflow = transactions.filter(t => t.amount > 0).reduce((a, b) => a + b.amount, 0);
        const total_outflow = transactions.filter(t => t.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0);

        onUpload({
            transactions,
            summary: {
                total_inflow,
                total_outflow,
                net_cash_flow: total_inflow - total_outflow,
                transaction_count: transactions.length,
                period_start: transactions[0]?.date,
                period_end: transactions[transactions.length - 1]?.date
            }
        });

        setShowMapping(false); // Close
    };

    const parseVal = (v: unknown) => {
        if (typeof v === 'number') return v;
        if (!v) return 0;
        return parseFloat(String(v).replace(/[^\d.-]/g, '')) || 0;
    };

    return (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '2px dashed #e2e8f0', textAlign: 'center' }}>

            <div style={{ marginBottom: '1.5rem', textAlign: 'left', maxWidth: '300px', margin: '0 auto 1.5rem auto' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>Document Type</label>
                <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as 'BANK_STATEMENT' | 'RECEIPT' | 'INVOICE' | 'OTHER')}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                    <option value="BANK_STATEMENT">Bank Statement</option>
                    <option value="RECEIPT">Receipt</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="OTHER">Other</option>
                </select>
            </div>

            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                style={{ background: isDragging ? '#f0f9ff' : 'transparent', padding: '2rem', transition: 'background 0.2s' }}
            >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                <h3 style={{ color: '#334155', marginBottom: '0.5rem' }}>Drag & drop your {documentType.replace('_', ' ').toLowerCase()} here</h3>
                <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>Supports CSV, Excel, PDF, JPG, PNG</p>

                <label style={{
                    background: 'var(--color-primary)',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '600'
                }}>
                    Upload File
                    <input type="file" hidden multiple accept=".csv, .xlsx, .xls, .pdf, .jpg, .jpeg, .png" onChange={handleFileSelect} />
                </label>
            </div>

            {/* Mapping Modal Overlay */
                showMapping && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                    }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Map Your Columns</h3>

                            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                                <MappingRow label="Date" options={headers} value={mapping.date} onChange={v => setMapping({ ...mapping, date: v })} />
                                <MappingRow label="Description" options={headers} value={mapping.description} onChange={v => setMapping({ ...mapping, description: v })} />

                                <div style={{ borderTop: '1px solid #eee', margin: '0.5rem 0' }}></div>

                                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Choose either Signed Amount OR Split Columns:</p>
                                <MappingRow label="Amount (Signed)" options={headers} value={mapping.amount} onChange={v => setMapping({ ...mapping, amount: v })} />

                                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>- OR -</div>

                                <MappingRow label="Money In (Credit)" options={headers} value={mapping.moneyIn} onChange={v => setMapping({ ...mapping, moneyIn: v })} />
                                <MappingRow label="Money Out (Debit)" options={headers} value={mapping.moneyOut} onChange={v => setMapping({ ...mapping, moneyOut: v })} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button onClick={() => setShowMapping(false)} style={{ padding: '0.75rem', border: 'none', background: 'none', cursor: 'pointer' }}>Cancel</button>
                                <button
                                    onClick={handleConfirmMapping}
                                    style={{ background: 'var(--color-primary)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    Confirm Mapping
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}

function MappingRow({ label, options, value, onChange }: { label: string, options: string[], value: string, onChange: (v: string) => void }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>{label}</label>
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            >
                <option value="">-- Select --</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    )
}
