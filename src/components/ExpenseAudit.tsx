import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { Transaction } from '../engine/types';
import { getRequiredDocuments, validateCompliance } from '../engine/complianceRules';
import type { DocumentRequest, ComplianceIssue } from '../engine/complianceRules';
import { runAudit, saveAuditResults, calculateComplianceStats, type ComplianceStats, type AuditResult, type ComplianceDocument } from '../engine/complianceEngine';
import { ocrService, type OCRResult } from '../services/ocrService';
import { TaxAtRiskWidget } from './TaxAtRiskWidget';

interface AuditItem extends DocumentRequest {
    transaction: Transaction;
    hasDoc: boolean;
    issues: ComplianceIssue[];
    docId?: string;
    auditStatus?: string;
    auditFindings?: string;
}

interface OCRReviewState {
    item: AuditItem;
    file: File;
    data: OCRResult;
    editedAmount: string;
    editedDate: string;
}

export function ExpenseAudit({ companyId, isPersonal }: { companyId: string, isPersonal: boolean }) {
    const [loading, setLoading] = useState(true);
    const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
    const [stats, setStats] = useState<ComplianceStats | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditResult[]>([]);
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    // OCR Review Modal State
    const [ocrReview, setOcrReview] = useState<OCRReviewState | null>(null);
    const [ocrProgress, setOcrProgress] = useState(false);

    useEffect(() => {
        loadAuditData();
    }, [companyId, isPersonal]);

    const loadAuditData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Transactions
            let txnQuery = supabase.from('transactions').select('*').lt('amount', 0);
            if (isPersonal) txnQuery = txnQuery.eq('personal_profile_id', companyId);
            else txnQuery = txnQuery.eq('company_id', companyId);
            const { data: txns } = await txnQuery;
            if (!txns) return;

            // 2. Fetch Docs
            let docQuery = supabase.from('compliance_documents').select('*');
            if (isPersonal) docQuery = docQuery.eq('personal_profile_id', companyId);
            else docQuery = docQuery.eq('company_id', companyId);
            const { data: docs } = await docQuery;

            // 3. Fetch Audit Logs
            let logQuery = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(20);
            if (!isPersonal) logQuery = logQuery.eq('company_id', companyId);

            const { data: logs } = await logQuery;
            const mappedLogs = (logs || []).map((l: any) => ({
                ruleCode: l.rule_code, ruleName: l.rule_name, severity: l.severity,
                finding: l.finding, impactAmount: l.impact_amount, fixAction: l.fix_action, autoFixed: l.auto_fixed
            }));
            setAuditLogs(mappedLogs);

            const items: AuditItem[] = [];

            // 4. Generate Requirements & Items
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            txns.forEach((t: any) => {
                const reqs = getRequiredDocuments(t);
                reqs.forEach(req => {
                    const existingDoc = docs?.find(d => d.transaction_id === t.id && d.document_type === req.requiredDocType);
                    items.push({
                        ...req,
                        transaction: t,
                        hasDoc: !!existingDoc,
                        status: existingDoc?.status || 'missing',
                        issues: existingDoc?.compliance_issues || [],
                        docId: existingDoc?.id,
                        auditStatus: t.audit_status,
                        auditFindings: t.audit_notes
                    });
                });
            });

            setAuditItems(items);

            // 5. Calculate Stats
            const castedDocs: ComplianceDocument[] = (docs || []).map((d: any) => ({
                id: d.id, transaction_id: d.transaction_id, document_type: d.document_type, status: d.status
            }));
            const newStats = calculateComplianceStats(txns, castedDocs, mappedLogs);
            setStats(newStats);

        } catch (err) {
            console.error("Audit load error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (file: File, item: AuditItem) => {
        setUploadingId(item.transactionId + item.requiredDocType);
        setOcrProgress(true);
        try {
            // Run Real OCR
            const ocrResult = await ocrService.processReceipt(file);

            // Open Review Modal
            setOcrReview({
                item,
                file,
                data: ocrResult,
                editedAmount: ocrResult.amount?.toString() || '',
                editedDate: ocrResult.date || ''
            });

        } catch (err) {
            alert("OCR Failed. Please try manually.");
        } finally {
            setUploadingId(null);
            setOcrProgress(false);
        }
    };

    const confirmUpload = async () => {
        if (!ocrReview) return;
        const { item, file, editedAmount, editedDate } = ocrReview;

        setOcrReview(null); // Close modal
        setUploadingId(item.transactionId + item.requiredDocType); // Show spinner again

        try {
            // Parse edited values
            const finalAmount = parseFloat(editedAmount) || 0;
            const finalDate = editedDate ? new Date(editedDate) : undefined;

            const issues = validateCompliance(item.transaction, {
                extractedDate: finalDate,
                extractedAmount: finalAmount
            });
            const status = issues.length > 0 ? 'rejected' : 'verified';
            const fakeUrl = URL.createObjectURL(file); // In real app, upload to storage here

            const payload = {
                company_id: isPersonal ? null : companyId,
                personal_profile_id: isPersonal ? companyId : null,
                transaction_id: item.transaction.id,
                document_type: item.requiredDocType,
                file_url: fakeUrl,
                status: status,
                compliance_issues: issues,
                ocr_data: { date: editedDate, amount: finalAmount, text: ocrReview.data.text },
                verification_score: status === 'verified' ? 100 : 50
            };

            if (item.docId) {
                await supabase.from('compliance_documents').update(payload).eq('id', item.docId);
            } else {
                await supabase.from('compliance_documents').insert(payload);
            }

            // Run Engine Update
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const docObj: any = {
                id: 'temp',
                transaction_id: item.transaction.id,
                document_type: item.requiredDocType,
                status: status,
                ocr_data: { date: editedDate, amount: finalAmount }
            };
            const { results, updates } = await runAudit(item.transaction, [docObj]);
            await saveAuditResults(item.transaction.id, isPersonal ? null : companyId, results);
            await supabase.from('transactions').update(updates).eq('id', item.transaction.id);

            await loadAuditData();
        } catch (err) {
            alert("Save failed");
        } finally {
            setUploadingId(null);
        }
    };


    if (loading) return <div style={{ padding: '2rem' }}>Loading Audit...</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b' }}>Compliance Dashboard</h1>
                <p style={{ color: '#64748b' }}>Real-time audit of expenses against Nigerian Tax Laws.</p>
            </div>

            {/* Score Cards */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <ScoreCard title="Documentation" score={stats.docScore} icon="📄" />
                    <ScoreCard title="Allowability" score={stats.allowabilityScore} icon="✅" />
                    <ScoreCard title="VAT Compliance" score={stats.vatScore} icon="💰" />
                    <ScoreCard title="WHT Compliance" score={stats.whtScore} icon="📊" />
                </div>
            )}

            {/* Overall Status */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>Overall Compliance Status</h2>
                    <div style={{
                        marginTop: '0.5rem', display: 'inline-block', padding: '0.4rem 1rem', borderRadius: '99px', fontWeight: '600',
                        background: stats?.status === 'compliant' ? '#dcfce7' : stats?.status === 'review_needed' ? '#fef9c3' : '#fee2e2',
                        color: stats?.status === 'compliant' ? '#166534' : stats?.status === 'review_needed' ? '#854d0e' : '#b91c1c'
                    }}>
                        {stats?.status === 'compliant' ? 'COMPLIANT' : stats?.status === 'review_needed' ? 'REVIEW NEEDED' : 'NON-COMPLIANT'}
                    </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#334155' }}>{stats?.overallScore}%</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Score</div>
                </div>
            </div>

            {/* Tax at Risk Widget */}
            <TaxAtRiskWidget companyId={companyId} />

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Document Requirements List */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>Document Requests</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {auditItems.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', background: 'white', borderRadius: '12px', color: '#94a3b8' }}>
                                🎉 All expenses documented!
                            </div>
                        ) : (
                            auditItems.map((item, idx) => (
                                <div key={`${item.transactionId}-${item.requiredDocType}-${idx}`} style={{
                                    background: 'white', borderRadius: '12px', padding: '1.5rem',
                                    border: item.status === 'missing' ? '1px solid #fecaca' : '1px solid #e2e8f0',
                                    borderLeft: item.status === 'missing' ? '4px solid #ef4444' : item.status === 'verified' ? '4px solid #166534' : '4px solid #e2e8f0',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#334155' }}>{item.transaction.description}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                                                {new Date(item.transaction.date).toLocaleDateString()} • <span style={{ fontFamily: 'monospace' }}>₦{Math.abs(item.transaction.amount).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '99px',
                                                background: item.status === 'verified' ? '#dcfce7' : item.status === 'rejected' ? '#fee2e2' : '#f1f5f9',
                                                color: item.status === 'verified' ? '#166534' : item.status === 'rejected' ? '#b91c1c' : '#64748b'
                                            }}>
                                                {item.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '1.2rem' }}>📄</span>
                                            <div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>Required: {item.requiredDocType}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.reason} <span style={{ opacity: 0.7 }}>({item.ruleRef})</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    {item.status === 'rejected' && item.issues.length > 0 && (
                                        <div style={{ marginBottom: '1rem', background: '#fee2e2', padding: '0.8rem', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#b91c1c', marginBottom: '4px' }}>⚠️ Validation Issues:</div>
                                            {item.issues.map((iss, i) => (
                                                <div key={i} style={{ fontSize: '0.8rem', color: '#991b1b' }}>• {iss.message}</div>
                                            ))}
                                        </div>
                                    )}

                                    <div>
                                        {uploadingId === item.transactionId + item.requiredDocType ? (
                                            <div style={{ background: '#f1f5f9', color: '#64748b', padding: '0.8rem', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem' }}>
                                                {ocrProgress ? '⏳ Initializing Extraction...' : '⏳ Validating...'}
                                            </div>
                                        ) : (
                                            <label style={{
                                                display: 'block', width: '100%', cursor: 'pointer', textAlign: 'center',
                                                background: item.hasDoc ? 'white' : '#2563eb',
                                                border: item.hasDoc ? '1px solid #cbd5e1' : 'none',
                                                color: item.hasDoc ? '#334155' : 'white',
                                                padding: '0.8rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem',
                                                transition: 'all 0.2s'
                                            }}>
                                                {item.hasDoc ? 'Refine / Re-upload Document' : `⬆️ Upload ${item.requiredDocType}`}
                                                <input type="file" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], item)} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Audit Issues / Logs */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>Recent Findings</h3>
                    <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem' }}>
                        {auditLogs.length === 0 ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>No issues found.</div>
                        ) : (
                            auditLogs.map((log, idx) => (
                                <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: log.severity === 'critical' ? '#ef4444' : '#f59e0b' }}>
                                            {log.ruleCode}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{log.ruleName}</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#334155', marginTop: '4px' }}>{log.finding}</div>
                                    {log.fixAction && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#2563eb', cursor: 'pointer' }}>
                                            Fix: {log.fixAction} ➡️
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Actions */}
            </div>

            {/* Actions */}
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => {
                        const headers = "Date,Description,Amount,Category,RequiredDoc,DocStatus,AuditStatus,Findings,EvidenceRequired,EvidenceStatus,DocumentCount,VerificationNotes\n";
                        const rows = auditItems.map(i => {
                            const notes = [i.auditFindings, ...i.issues.map(iss => iss.message)].filter(Boolean).join("; ");
                            return `${new Date(i.transaction.date).toLocaleDateString()},"${i.transaction.description}",${i.transaction.amount},"${i.transaction.category_name}",${i.requiredDocType},${i.status},${i.auditStatus || ''},"${i.auditFindings || ''}",${i.requiredDocType},${i.status},${i.hasDoc ? 1 : 0},"${notes}"`;
                        }).join("\n");
                        downloadCSV(headers + rows, "compliance_report.csv");
                    }}
                    style={{
                        background: 'white', border: '1px solid #cbd5e1', color: '#334155', padding: '0.6rem 1.2rem',
                        borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                    💾 Download Full Report
                </button>
                <button
                    onClick={() => {
                        const headers = "Date,Description,OriginalAmount,AllowableAmount,Status,FixAction,RecommendedAction,ReasonCode,Priority\n";
                        const rows = auditLogs.map(l => {
                            const priority = l.severity === 'critical' ? 'High' : l.severity === 'warning' ? 'Medium' : 'Low';
                            return `${new Date().toLocaleDateString()},"${l.ruleName}",${l.impactAmount || 0},0,${l.severity},"${l.fixAction || ''}","${l.fixAction || ''}","${l.ruleCode}","${priority}"`
                        }).join("\n");
                        downloadCSV(headers + rows, "adjusted_expenses.csv");
                    }}
                    style={{
                        background: '#3b82f6', border: 'none', color: 'white', padding: '0.6rem 1.2rem',
                        borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 2px 5px rgba(59, 130, 246, 0.3)'
                    }}>
                    📉 Export Adjusted Expenses
                </button>
            </div>

            {/* REVIEW MODAL */}
            {ocrReview && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '2rem', width: '500px', maxWidth: '90%' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e293b' }}>Confirm Extracted Data</h2>
                        <p style={{ marginBottom: '1.5rem', color: '#64748b' }}>Please verify the data extracted from the receipt matches the transaction.</p>

                        <div style={{ marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                            <div style={{ marginBottom: '4px' }}><strong>Merchant Found:</strong> {ocrReview.data.merchant || 'None'}</div>
                            <div style={{ marginBottom: '4px' }}><strong>Text Sample:</strong> {ocrReview.data.text.substring(0, 50)}...</div>
                        </div>

                        {ocrReview.data.isLowConfidence && (
                            <div style={{ marginBottom: '1.5rem', background: '#fffbeb', padding: '0.8rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b', fontSize: '0.9rem', color: '#b45309' }}>
                                ⚠️ <strong>Low Confidence Scans:</strong> The image quality might be low. Please double-check the values below.
                            </div>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#334155' }}>Receipt Date (YYYY-MM-DD)</label>
                            <input
                                type="date"
                                value={ocrReview.editedDate}
                                onChange={e => setOcrReview({ ...ocrReview, editedDate: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#334155' }}>Amount (₦)</label>
                            <input
                                type="number"
                                value={ocrReview.editedAmount}
                                onChange={e => setOcrReview({ ...ocrReview, editedAmount: e.target.value })}
                                style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            />
                            {Math.abs(ocrReview.item.transaction.amount) !== parseFloat(ocrReview.editedAmount || '0') && (
                                <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '4px' }}>
                                    ⚠️ Doesn't match ledger amount of ₦{Math.abs(ocrReview.item.transaction.amount).toLocaleString()}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setOcrReview(null)}
                                style={{ padding: '0.6rem 1.2rem', color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmUpload}
                                style={{ padding: '0.6rem 1.5rem', color: 'white', background: '#2563eb', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                            >
                                Confirm & Validate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ScoreCard({ title, score, icon }: { title: string, score: number, icon: string }) {
    return (
        <div style={{ background: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: score > 80 ? '#166534' : score > 50 ? '#ca8a04' : '#ef4444' }}>
                    {score}%
                </span>
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>{title}</div>
        </div>
    );
}

const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
