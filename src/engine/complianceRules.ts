import type { Transaction } from './types';

export interface DocumentRequest {
    transactionId: string;
    requiredDocType: string; // 'Receipt', 'Invoice', 'Contract', 'WHT Evidence'
    reason: string;
    ruleRef: string; // e.g. "CITA S24"
    status: 'missing' | 'pending' | 'verified' | 'rejected';
}

export interface ComplianceIssue {
    code: string;
    message: string;
    severity: 'warning' | 'critical';
}

export const REQUIRED_DOCS_MAP: Record<string, { type: string, reason: string, rule: string }[]> = {
    'Travel & Transport': [
        { type: 'Receipt', reason: 'Proof of travel expense', rule: 'CITA S24' }
    ],
    'Motor Vehicle Expenses': [
        { type: 'Fuel Receipt', reason: 'Fuel purchase evidence', rule: 'CITA S24' },
        { type: 'Logbook', reason: 'Business use justification', rule: 'PITA S20' }
    ],
    'Rent & Rates': [
        { type: 'Tenancy Agreement', reason: 'Proof of tenancy', rule: 'CITA S24' },
        { type: 'Payment Receipt', reason: 'Proof of payment', rule: 'CITA S24' }
    ],
    'Legal & Professional Fees': [
        { type: 'Invoice', reason: 'Service invoice', rule: 'CITA S24' },
        { type: 'WHT Receipt', reason: 'Evidence of WHT remittance', rule: 'CITA S80' }
    ],
    'Utilities': [
        { type: 'Utility Bill', reason: 'Proof of usage', rule: 'CITA S24' }
    ],
    'Repairs & Maintenance': [
        { type: 'Invoice/Receipt', reason: 'Proof of work done', rule: 'CITA S24' }
    ],
    'Equipment': [
        { type: 'Purchase Invoice', reason: 'Capital Allowance claim', rule: 'CITA Second Schedule' }
    ],
    'Entertainment': [
        { type: 'Receipt', reason: 'Expense verification', rule: 'CITA S24' }
    ]
};

export function getRequiredDocuments(transaction: Transaction): DocumentRequest[] {
    // If it's income, usually no "expense" docs needed, but maybe Invoice sent?
    if (transaction.amount > 0) return [];

    const category = transaction.category_name || 'Uncategorized';
    // Fuzzy match or direct lookup
    const requirements = REQUIRED_DOCS_MAP[category] || [];

    // Special Rules
    const specialRequests: DocumentRequest[] = [];

    // Rule: Cash > 10k needs narration/receipt strongly
    if (Math.abs(transaction.amount) > 10000 && (!transaction.description || transaction.description.length < 5)) {
        specialRequests.push({
            transactionId: transaction.id,
            requiredDocType: 'Detailed Receipt/Narration',
            reason: 'High value cash transaction needs detail',
            ruleRef: 'Audit Requirement',
            status: 'missing'
        });
    }

    // Rule: VAT claims needs VAT Invoice
    // If we had a "vat_claimed" flag, we would check it. 
    // For now, assume if tax_tag is VAT, we need it.
    if (transaction.tax_tag === 'VAT') {
        specialRequests.push({
            transactionId: transaction.id,
            requiredDocType: 'VAT Invoice',
            reason: 'Input VAT claim evidence',
            ruleRef: 'VATA S13',
            status: 'missing'
        });
    }

    const baseRequests = requirements.map(r => ({
        transactionId: transaction.id,
        requiredDocType: r.type,
        reason: r.reason,
        ruleRef: r.rule,
        status: 'missing' as const
    }));

    return [...baseRequests, ...specialRequests];
}

export function validateCompliance(transaction: Transaction, docData: {
    extractedDate?: Date,
    extractedAmount?: number,
    extractedVendor?: string
}): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];

    // 1. Date Check (tolerance 7 days)
    if (docData.extractedDate) {
        const txnDate = new Date(transaction.date);
        const diffTime = Math.abs(docData.extractedDate.getTime() - txnDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) {
            issues.push({
                code: 'DATE_MISMATCH',
                message: `Receipt date (${docData.extractedDate.toLocaleDateString()}) does not match transaction date (${txnDate.toLocaleDateString()})`,
                severity: 'warning'
            });
        }
    }

    // 2. Amount Check (tolerance 5%)
    if (docData.extractedAmount !== undefined) {
        const txnAmount = Math.abs(transaction.amount);
        const docAmount = Math.abs(docData.extractedAmount);
        const diffParams = Math.abs(txnAmount - docAmount);
        const percentDiff = (diffParams / txnAmount) * 100;

        if (percentDiff > 5) {
            issues.push({
                code: 'AMOUNT_MISMATCH',
                message: `Receipt amount (${docAmount}) differs from transaction (${txnAmount}) by ${percentDiff.toFixed(1)}%`,
                severity: 'critical'
            });
        }
    }

    return issues;
}
