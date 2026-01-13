import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../supabase';
import { autoCategorize, CATEGORY_RULES } from '../engine/autoCat';
import { ocrService } from '../services/ocrService';
import type { Transaction, StatementSummary } from '../engine/types';

interface UploadZoneProps {
    onUpload: (data: { transactions: Transaction[], summary: StatementSummary }) => void;
    companyId: string;
    isPersonal: boolean;
}

export function UploadZone({ onUpload, companyId, isPersonal }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [showMapping, setShowMapping] = useState(false);
    const [headers, setHeaders] = useState<string[]>([]);
    const [rawRows, setRawRows] = useState<unknown[][]>([]);

    const [showReview, setShowReview] = useState(false);
    const [reviewTransactions, setReviewTransactions] = useState<Transaction[]>([]);

    const [documentType, setDocumentType] = useState<'BANK_UPLOAD' | 'RECEIPT' | 'MANUAL' | 'OTHER'>('BANK_UPLOAD');

    const [mapping, setMapping] = useState({
        date: '',
        description: '',
        category: '',
        amount: '',     // for signed
        moneyIn: '',    // for split
        moneyOut: ''    // for split
    });

    const handleFinalizeUpload = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found. Please log in again.");

            const transactions = reviewTransactions;

            // 1. Prepare DB Payload
            const dbPayload = transactions.map(t => ({
                company_id: isPersonal ? null : companyId,
                personal_profile_id: isPersonal ? companyId : null,
                txn_date: new Date(t.date).toISOString(), // Map to DB column
                description: t.description,
                amount: t.amount,
                category_name: t.category_name,
                dla_status: t.dla_status,
                tax_tag: t.tax_tag || 'None',
                source_type: t.source_type,
                vat_status: 'none', // Default
                include_in_pit: isPersonal,
                include_in_cit: !isPersonal,
                created_by: user.id
            }));
            // 2. Insert to Supabase
            const { data, error } = await supabase
                .from('transactions')
                .insert(dbPayload)
                .select(); // Get back real IDs

            if (error) throw error;
            if (!data) throw new Error("No data returned from insert");

            // 3. Map back to UI Model
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const savedTransactions = data.map((row: any) => ({
                id: row.id,
                company_id: row.company_id || 'default',
                date: new Date(row.txn_date || row.date), // Handle return from DB
                description: row.description,
                amount: row.amount,
                dla_status: row.dla_status,
                tax_tag: row.tax_tag,
                tax_year_label: new Date(row.date).getFullYear().toString(),
                category_name: row.category_name,
                source_type: row.source_type
            } as Transaction));

            const total_inflow = savedTransactions.filter(t => t.amount > 0).reduce((a, b) => a + b.amount, 0);
            const total_outflow = savedTransactions.filter(t => t.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0);

            onUpload({
                transactions: savedTransactions,
                summary: {
                    total_inflow,
                    total_outflow,
                    net_cash_flow: total_inflow - total_outflow,
                    transaction_count: savedTransactions.length,
                    period_start: savedTransactions[0]?.date ? new Date(savedTransactions[0].date) : new Date(),
                    period_end: savedTransactions[savedTransactions.length - 1]?.date ? new Date(savedTransactions[savedTransactions.length - 1].date) : new Date()
                }
            });
            setShowReview(false);
            alert("Transactions saved to database successfully!");

        } catch (err: any) {
            console.error("Upload failed full error:", err);

            const msg = err.message || err.error_description || JSON.stringify(err);
            const details = err.details || err.hint || '';
            alert(`Failed to save transactions: ${msg} \n${details}`);
        }
    };

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

    const [processingFile, setProcessingFile] = useState<boolean>(false);

    const handleFiles = useCallback(async (files: File[]) => {
        setProcessingFile(true);
        const docTransactions: Transaction[] = [];
        let dataFile: File | null = null;

        try {
            for (const f of files) {
                const name = f.name.toLowerCase();
                if (name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
                    if (!dataFile) dataFile = f;
                } else if (name.endsWith('.pdf') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')) {

                    let description = `Document Upload: ${f.name}`;
                    let amount = 0;
                    let date = new Date();
                    let notes = 'Manual entry required';

                    // Run OCR if it's a receipt or just an image upload
                    if (documentType === 'RECEIPT' || documentType === 'OTHER') {
                        const ocrResult = await ocrService.processReceipt(f);
                        if (ocrResult.amount) amount = ocrResult.amount;
                        if (ocrResult.date) date = new Date(ocrResult.date);
                        if (ocrResult.merchant) description = ocrResult.merchant;
                        if (ocrResult.text) notes = `OCR Confidence: ${Math.round(ocrResult.confidence)}%`;
                    }

                    const previewUrl = URL.createObjectURL(f);
                    docTransactions.push({
                        id: self.crypto.randomUUID(), // Valid UUID for DB
                        company_id: 'default',
                        date: date,
                        description: description,
                        amount: amount, // Extracted amount or 0
                        dla_status: 'none',
                        tax_year_label: date.getFullYear().toString(),
                        category_name: 'Uncategorized Expense',
                        source_type: documentType,
                        preview_url: previewUrl,
                        notes: notes
                    });
                }
            }

            // Upload Docs Batch -> Go to Review Step
            if (docTransactions.length > 0) {
                setReviewTransactions(docTransactions);
                setShowReview(true);
            }

            if (dataFile) {
                processDataFile(dataFile);
            }

        } catch (err) {
            console.error("File processing error", err);
            alert("Error processing files");
        } finally {
            setProcessingFile(false);
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

        rawRows.forEach((row) => {
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

            // Apply Auto-Cat if no category mapped
            let catName = String(row[headers.indexOf(mapping.category)] || '');
            if (!catName && descVal) {
                const auto = autoCategorize(String(descVal));
                if (auto) catName = auto;
            }
            if (!catName) {
                catName = amount > 0 ? 'Uncategorized Income' : 'Uncategorized Expense';
            }

            // Only add if valid
            const dateObj = new Date(dateVal as string);
            if (!isNaN(dateObj.getTime()) && !isNaN(amount)) {
                transactions.push({
                    id: self.crypto.randomUUID(), // Valid UUID for internal use
                    company_id: 'default',
                    date: dateObj,
                    description: String(descVal || ''),
                    amount: amount,
                    dla_status: (catName?.toLowerCase().includes('director') || catName?.toLowerCase().includes('loan') || String(descVal).toLowerCase().includes('director')) ? 'potential' : 'none',
                    tax_tag: (catName?.toLowerCase().includes('director') || catName?.toLowerCase().includes('loan')) ? 'Owner Loan' : undefined,
                    tax_year_label: dateObj.getFullYear().toString(),
                    category_name: catName,
                    source_type: documentType
                });
            }
        });

        setReviewTransactions(transactions);
        setShowMapping(false);
        setShowReview(true);
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
                    onChange={(e) => setDocumentType(e.target.value as 'BANK_UPLOAD' | 'RECEIPT' | 'MANUAL' | 'OTHER')}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                    <option value="BANK_UPLOAD">Bank Statement (Upload)</option>
                    <option value="RECEIPT">Receipt</option>
                    <option value="MANUAL">Manual Entry / Invoice</option>
                    <option value="OTHER">Other</option>
                </select>
            </div>

            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                style={{
                    background: isDragging ? '#f0f9ff' : 'transparent',
                    padding: '4rem', // Increased padding
                    transition: 'background 0.2s',
                    minHeight: '400px', // Added min-height
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>📂</div>
                <h3 style={{ color: '#334155', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    Drag & drop your {documentType.replace('_', ' ').toLowerCase()} here
                </h3>
                <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '1.1rem' }}>
                    Supports CSV, Excel, PDF, JPG, PNG
                </p>

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
                                <MappingRow label="Category" options={headers} value={mapping.category} onChange={v => setMapping({ ...mapping, category: v })} />

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

            {/* Review Modal */
                showReview && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
                    }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '900px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Review Import</h3>
                                    <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Review and categorize your transactions before finalizing.</p>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.9rem', color: '#64748b' }}>
                                    {reviewTransactions.length} transactions found
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '1.5rem' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Description</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e2e8f0' }}>Amount</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Category</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reviewTransactions.map((t, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '0.75rem', color: '#64748b' }}>{new Date(t.date).toLocaleDateString()}</td>
                                                <td style={{ padding: '0.75rem', fontWeight: '500' }}>{t.description}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: t.amount > 0 ? '#166534' : '#b91c1c' }}>
                                                    {t.amount.toLocaleString()}
                                                </td>
                                                <td style={{ padding: '0.5rem' }}>
                                                    <select
                                                        value={t.category_name}
                                                        onChange={(e) => {
                                                            const newVal = e.target.value;
                                                            setReviewTransactions(prev => {
                                                                const copy = [...prev];
                                                                copy[i] = { ...copy[i], category_name: newVal };
                                                                return copy;
                                                            });
                                                        }}
                                                        style={{
                                                            width: '100%', padding: '0.4rem', borderRadius: '4px',
                                                            border: t.category_name?.startsWith('Uncategorized') ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                                            background: t.category_name?.startsWith('Uncategorized') ? '#fef2f2' : 'white',
                                                            fontSize: '0.85rem'
                                                        }}
                                                    >
                                                        <optgroup label="System">
                                                            <option value="Uncategorized Income">Uncategorized Income</option>
                                                            <option value="Uncategorized Expense">Uncategorized Expense</option>
                                                        </optgroup>
                                                        {Object.entries(CATEGORY_RULES).map(([cat]) => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '0.9rem', color: '#ef4444' }}>
                                    {reviewTransactions.filter(t => t.category_name?.startsWith('Uncategorized')).length} items still uncategorized
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button onClick={() => setShowReview(false)} style={{ padding: '0.75rem 1.5rem', border: 'none', background: '#f1f5f9', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                                    <button
                                        onClick={handleFinalizeUpload}
                                        style={{ background: '#166534', color: 'white', padding: '0.75rem 2rem', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <span>✅</span> Complete Import
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Loading Overlay */
                processingFile && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
                        flexDirection: 'column'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                        <h3 style={{ color: '#334155' }}>Processing Documents...</h3>
                        <p style={{ color: '#64748b' }}>Running OCR extraction (this might take a few seconds)</p>
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
