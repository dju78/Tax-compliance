import type { Transaction } from './types';
import { supabase } from '../supabase';

// Types
export interface AuditRule {
    code: string;
    name: string;
    description: string;
    severity: 'critical' | 'warning' | 'info';
    legalRef: string;
    check: (txn: Transaction, docs?: ComplianceDocument[]) => { passed: boolean; finding?: string; impact?: number; action?: string };
}

export interface ComplianceDocument {
    id: string;
    transaction_id: string;
    document_type: string;
    status: string;
    ocr_data?: { date?: string; amount?: number; text?: string };
}

export interface AuditResult {
    ruleCode: string;
    ruleName: string;
    severity: string;
    finding: string;
    impactAmount: number;
    autoFixed: boolean;
    fixAction?: string;
}

// RULES DEFINITION
const AUDIT_RULES: AuditRule[] = [
    // --- DOCUMENTATION RULES ---
    {
        code: 'DOC_001',
        name: 'Missing Receipt',
        description: 'No receipt found for expense > N10,000.',
        severity: 'critical',
        legalRef: 'CITA S24',
        check: (txn, docs) => {
            const hasDoc = docs && docs.some(d => ['verified', 'pending', 'review'].includes(d.status));
            if (Math.abs(txn.amount) > 10000 && !hasDoc) {
                return { passed: false, finding: 'Missing supporting document for transaction > N10k', impact: Math.abs(txn.amount), action: 'disallow' };
            }
            return { passed: true };
        }
    },
    {
        code: 'DOC_002',
        name: 'Cash Transaction Gap',
        description: 'Cash expense > N10,000 without detailed narration.',
        severity: 'warning',
        legalRef: 'Audit Policy',
        check: (txn) => {
            if (Math.abs(txn.amount) > 10000 && (!txn.description || txn.description.length < 5)) {
                return { passed: false, finding: 'Vague narration for high value cash expense', impact: 0, action: 'flag' };
            }
            return { passed: true };
        }
    },
    {
        code: 'DOC_003',
        name: 'Date Mismatch',
        description: 'Receipt date matches ledger date within 7 days.',
        severity: 'warning',
        legalRef: 'Internal Control',
        check: (txn, docs) => {
            const doc = docs?.find(d => d.ocr_data?.date);
            if (doc && doc.ocr_data?.date) {
                const txnDate = new Date(txn.date).getTime();
                const docDate = new Date(doc.ocr_data.date).getTime();
                const diffDays = Math.abs(txnDate - docDate) / (1000 * 60 * 60 * 24);
                if (diffDays > 7) {
                    return { passed: false, finding: `Receipt date deviates by ${Math.ceil(diffDays)} days`, impact: 0, action: 'flag' };
                }
            }
            return { passed: true };
        }
    },
    {
        code: 'DOC_004',
        name: 'Amount Mismatch',
        description: 'Receipt amount matches ledger amount within 5%.',
        severity: 'critical',
        legalRef: 'Internal Control',
        check: (txn, docs) => {
            const doc = docs?.find(d => d.ocr_data?.amount);
            if (doc && doc.ocr_data?.amount) {
                const txnAmount = Math.abs(txn.amount);
                const docAmount = Math.abs(doc.ocr_data.amount);
                const diff = Math.abs(txnAmount - docAmount);
                if ((diff / txnAmount) > 0.05) {
                    return { passed: false, finding: `Amount mismatch: Ledger ${txnAmount} vs Doc ${docAmount}`, impact: diff, action: 'flag' };
                }
            }
            return { passed: true };
        }
    },

    // --- ALLOWABILITY RULES ---
    {
        code: 'ALLOW_001',
        name: 'Personal Expense',
        description: 'Personal expenses are not allowable.',
        severity: 'critical',
        legalRef: 'PITA S20',
        check: (txn) => {
            const keywords = ['personal', 'family', 'school fees', 'groceries', 'gym'];
            if (keywords.some(k => txn.description.toLowerCase().includes(k))) {
                return { passed: false, finding: 'Potential personal expense detected', impact: Math.abs(txn.amount), action: 'disallow' };
            }
            return { passed: true };
        }
    },
    {
        code: 'ALLOW_002',
        name: 'Capital Expenditure Reclassification',
        description: 'Items > N100k like machinery should be capitalized.',
        severity: 'warning',
        legalRef: 'CITA Second Sched',
        check: (txn) => {
            const capKeywords = ['generator', 'macbook', 'laptop', 'machinery', 'building', 'furniture', 'renovation'];
            if (Math.abs(txn.amount) > 100000 && capKeywords.some(k => txn.description.toLowerCase().includes(k)) && !(txn.category_name || '').toLowerCase().includes('asset')) {
                return { passed: false, finding: 'Large asset purchase expensed instead of capitalized', impact: Math.abs(txn.amount), action: 'reclassify_asset' };
            }
            return { passed: true };
        }
    },
    {
        code: 'ALLOW_003',
        name: 'Excessive Entertainment',
        description: 'Entertainment > 0.5% of Turnover (Mock: N40m).',
        severity: 'warning',
        legalRef: 'CITA S24',
        check: (txn) => {
            const MOCK_TURNOVER = 40000000;
            const threshold = MOCK_TURNOVER * 0.005; // 200,000
            if ((txn.category_name || '').toLowerCase().includes('entertainment') && Math.abs(txn.amount) > threshold) {
                return { passed: false, finding: `Entertainment expense exceeds 0.5% of turnover (${threshold})`, impact: Math.abs(txn.amount) - threshold, action: 'limit_50pct' };
            }
            return { passed: true };
        }
    },
    {
        code: 'ALLOW_004',
        name: 'Donations',
        description: 'Unapproved donations are not allowable.',
        severity: 'warning',
        legalRef: 'CITA S25',
        check: (txn) => {
            if ((txn.category_name || '').toLowerCase().includes('donation') || txn.description.toLowerCase().includes('donation')) {
                return { passed: false, finding: 'Donation may not be to approved body', impact: Math.abs(txn.amount), action: 'flag' };
            }
            return { passed: true };
        }
    },
    {
        code: 'ALLOW_005',
        name: 'Fines & Penalties',
        description: 'Fines and penalties are disallowed.',
        severity: 'critical',
        legalRef: 'CITA S27',
        check: (txn) => {
            const keywords = ['fine', 'penalty', 'traffic offense', 'lastma', 'frsc'];
            if (keywords.some(k => txn.description.toLowerCase().includes(k))) {
                return { passed: false, finding: 'Fines and penalties are strictly disallowed', impact: Math.abs(txn.amount), action: 'disallow' };
            }
            return { passed: true };
        }
    },

    // --- VAT RULES ---
    {
        code: 'VAT_001',
        name: 'Unclaimed VAT',
        description: 'VATable expenses without proper Tax Tag.',
        severity: 'info',
        legalRef: 'VATA S13',
        check: (txn) => {
            if (!txn.tax_tag && Math.abs(txn.amount) > 1000 && txn.description.toLowerCase().includes('vat')) {
                return { passed: false, finding: 'Likely VAT expense missing tax tag', impact: 0, action: 'flag' };
            }
            return { passed: true };
        }
    },
    {
        code: 'VAT_003',
        name: 'No Tax Tag',
        description: 'Expense seems to be VAT inclusive but not tagged.',
        severity: 'info',
        legalRef: 'VATA',
        check: (txn) => {
            // Heuristic: Professional fees usually attract VAT
            if ((txn.category_name || '').toLowerCase().includes('professional') && !txn.tax_tag) {
                return { passed: false, finding: 'Professional fees usually require VAT tag', impact: 0, action: 'flag' };
            }
            return { passed: true };
        }
    },

    // --- WHT RULES ---
    {
        code: 'WHT_001',
        name: 'Professional Fees WHT',
        description: 'Professional fees must suffer WHT.',
        severity: 'warning',
        legalRef: 'CITA S80',
        check: (txn) => {
            if ((txn.category_name || '').toLowerCase().includes('professional') && Math.abs(txn.amount) >= 3000) {
                if (txn.tax_tag === 'WHT') return { passed: true }; // Passed if tagged
                return { passed: false, finding: 'Ensure 10% WHT was deducted on Professional Fees', impact: Math.abs(txn.amount) * 0.1, action: 'flag' };
            }
            return { passed: true };
        }
    }
];

export async function runAudit(txn: Transaction, docs: ComplianceDocument[]): Promise<{ results: AuditResult[], updates: Partial<Transaction> }> {
    const results: AuditResult[] = [];
    const updates: Partial<Transaction> = {
        audit_status: 'pass',
        allowability_status: 'allowable',
        allowable_amount: Math.abs(txn.amount)
    };

    for (const rule of AUDIT_RULES) {
        const check = rule.check(txn, docs);
        if (!check.passed) {
            results.push({
                ruleCode: rule.code,
                ruleName: rule.name,
                severity: rule.severity,
                finding: check.finding || 'Audit failure',
                impactAmount: check.impact || 0,
                autoFixed: false,
                fixAction: check.action
            });

            // Action Logic
            if (check.action === 'disallow') {
                updates.allowability_status = 'non_allowable';
                updates.allowable_amount = 0;
                updates.audit_status = 'fail';
            } else if (check.action === 'limit_50pct') {
                updates.allowability_status = 'partial';
                // Allowable is Total - Impact (Disallowed portion)
                updates.allowable_amount = Math.max(0, Math.abs(txn.amount) - (check.impact || 0));
                updates.audit_status = 'review';
            } else if (['flag', 'reclassify_asset'].includes(check.action || '')) {
                updates.audit_status = 'review';
            }
        }
    }

    if (results.length > 0) {
        // If not already failed, mark as review or fail based on severity
        if (updates.audit_status !== 'fail') {
            if (results.some(r => r.severity === 'critical')) updates.audit_status = 'fail';
            else updates.audit_status = 'review';
        }
        updates.audit_notes = results.map(r => r.finding).join('; ');
    }

    return { results, updates };
}


export async function saveAuditResults(txnId: string, companyId: string | null, results: AuditResult[]) {
    if (results.length === 0) return;

    const payload = results.map(r => ({
        transaction_id: txnId,
        company_id: companyId,
        rule_code: r.ruleCode,
        rule_name: r.ruleName,
        severity: r.severity,
        finding: r.finding,
        impact_amount: r.impactAmount,
        fix_action: r.fixAction
    }));

    await supabase.from('audit_logs').insert(payload);
}

// Stats / Scoring
export interface ComplianceStats {
    docScore: number;
    allowabilityScore: number;
    vatScore: number;
    whtScore: number;
    overallScore: number;
    status: 'compliant' | 'review_needed' | 'non_compliant';
    totalIssues: number;
}

export function calculateComplianceStats(
    txns: Transaction[],
    docs: ComplianceDocument[],
    issues: AuditResult[]
): ComplianceStats {

    // 1. Documentation Score (DOC_001)
    const txnsRequiringDocs = txns.filter(t => Math.abs(t.amount) > 10000);
    const validDocs = txnsRequiringDocs.filter(t => {
        const hasDoc = docs.some(d => d.transaction_id === t.id && d.status === 'verified');
        return hasDoc;
    }).length;

    const docScore = txnsRequiringDocs.length > 0 ? Math.round((validDocs / txnsRequiringDocs.length) * 100) : 100;

    // 2. Allowability Score
    const totalAmount = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const allowableAmount = txns.reduce((sum, t) => sum + (t.allowable_amount ?? Math.abs(t.amount)), 0);
    const allowScore = totalAmount > 0 ? Math.round((allowableAmount / totalAmount) * 100) : 100;

    // 3. VAT Score (Ref: VAT_001)
    const vatCandidates = txns.filter(t => t.description.toLowerCase().includes('vat'));
    const vatCompliant = vatCandidates.filter(t => t.tax_tag || t.audit_status === 'pass').length;
    const vatScore = vatCandidates.length > 0 ? Math.round((vatCompliant / vatCandidates.length) * 100) : 100;

    // 4. WHT Score
    const whtCandidates = txns.filter(t => t.category_name?.toLowerCase().includes('professional') || t.category_name?.toLowerCase().includes('contract'));
    // Assuming compliant if not failed audit
    const whtCompliant = whtCandidates.filter(t => t.audit_status !== 'fail').length;
    const whtScore = whtCandidates.length > 0 ? Math.round((whtCompliant / whtCandidates.length) * 100) : 100;

    // Overall
    const overall = Math.round(docScore * 0.4 + allowScore * 0.4 + vatScore * 0.1 + whtScore * 0.1);

    let status: ComplianceStats['status'] = 'non_compliant';
    if (overall >= 85) status = 'compliant';
    else if (overall >= 70) status = 'review_needed';

    return {
        docScore,
        allowabilityScore: allowScore,
        vatScore,
        whtScore,
        overallScore: overall,
        status,
        totalIssues: issues.length
    };
}
