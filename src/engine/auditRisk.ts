import type { ChecklistCategory } from '../data/expenseChecklists';

export interface AuditInputs {
    type: 'SOLE' | 'LTD';
    turnover: number;
    totalExpenses?: number;
    profit?: number; // Optional, needed for LTD director remuneration check
    selectedItems: string[]; // IDs of selected checklist items
    receiptMissing?: boolean;
    cashOver500k?: boolean; // LTD specific
    noWHT?: boolean; // LTD specific
    noSeparateAccount?: boolean; // Sole specific
    repeatedLosses?: boolean;
    suddenSpike?: boolean; // >40% vs last year
    // Category specific totals for ratio checks (optional but recommended for accuracy)
    transportTotal?: number;
    marketingTotal?: number;
    directorRemuneration?: number;
    phoneInternetTotal?: number; // Sole specific
    isReviewed?: boolean;
}

export interface AuditResult {
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    warnings: string[];
    riskDrivers: string[];
    suggestions: string[];
}

export function calculateAuditRisk(inputs: AuditInputs, checklist: ChecklistCategory[]): AuditResult {
    let score = 0;
    const warnings: string[] = [];
    const riskDrivers: string[] = [];
    const suggestions: string[] = [];

    // 1. Base Risk Weights from Selected Categories
    const selectedCategoryIds = new Set<string>();

    // Flatten items to find selected ones
    checklist.forEach(category => {
        const hasSelected = category.items.some(item => inputs.selectedItems.includes(item.id));
        if (hasSelected) {
            score += category.riskWeight;
            selectedCategoryIds.add(category.id);
        }
        // Check for specific disallowed items selected
        category.items.forEach(item => {
            if (inputs.selectedItems.includes(item.id)) {
                if (item.isDisallowed) {
                    warnings.push(`DISALLOWED: ${item.label} (${item.warning})`);
                    score += 10; // Heavy penalty for selecting a disallowed item
                }
                if (item.isCapitalAsset) {
                    warnings.push(`CAPITAL ASSET: ${item.label} should be claimed via Capital Allowance, not expensed.`);
                    suggestions.push(`Move ${item.label} to Capital Assets schedule.`);
                }
            }
        });
    });

    // 2. Penalties & Red Flags (Specific to Type)

    if (inputs.type === 'LTD') {
        // LTD Specific Rules
        if (inputs.receiptMissing) {
            score += 10;
            riskDrivers.push('Missing receipts/invoices');
            suggestions.push('Upload missing receipts.');
        }
        if (inputs.cashOver500k) {
            score += 8;
            riskDrivers.push('Cash payment > ₦500,000');
        }
        if (inputs.noWHT) {
            score += 10;
            riskDrivers.push('No WHT deducted');
            suggestions.push('Deduct WHT and refile.');
        }

        // Proportion Tests
        if (inputs.turnover > 0) {
            // Assuming totalExpenses is roughly sum of category totals if not provided
            // For strict check we need explicit totals
            if (inputs.transportTotal && (inputs.transportTotal / inputs.turnover > 0.20)) {
                score += 8;
                riskDrivers.push('Transport > 20% of turnover');
            }
            if (inputs.marketingTotal && (inputs.marketingTotal / inputs.turnover > 0.25)) {
                score += 8;
                riskDrivers.push('Marketing > 25% of turnover');
            }
        }
        if (inputs.profit && inputs.profit > 0 && inputs.directorRemuneration) {
            if (inputs.directorRemuneration / inputs.profit > 0.15) {
                score += 10;
                riskDrivers.push('Director remuneration > 15% of profit');
                suggestions.push('Reclassify director expenses or reduce.');
            }
        }

    } else {
        // SOLE PROPRIETOR Specific Rules
        if (inputs.noSeparateAccount) {
            score += 10;
            riskDrivers.push('No separate business account');
            suggestions.push('Open a dedicated business bank account.');
        }
        if (inputs.receiptMissing) {
            score += 8; // Slightly lower for sole? Prompt says 8
            riskDrivers.push('Missing receipts/invoices');
        }

        // Proportion Tests
        if (inputs.turnover > 0) {
            if (inputs.totalExpenses && (inputs.totalExpenses / inputs.turnover > 0.70)) {
                score += 10;
                riskDrivers.push('Total expenses > 70% of turnover');
            }
            if (inputs.transportTotal && (inputs.transportTotal / inputs.turnover > 0.25)) {
                score += 8;
                riskDrivers.push('Transport > 25% of turnover');
                suggestions.push('Reduce fuel claim to business use only.');
            }
            if (inputs.phoneInternetTotal && (inputs.phoneInternetTotal / inputs.turnover > 0.15)) {
                score += 6;
                riskDrivers.push('Phone/Internet > 15% of turnover');
                suggestions.push('Apply percentage apportionment (e.g., 40%).');
            }
        }
    }

    // Common Behavioural Red Flags
    if (inputs.repeatedLosses) {
        score += (inputs.type === 'LTD' ? 10 : 8);
        riskDrivers.push('Repeated business losses');
    }
    if (inputs.suddenSpike) {
        score += (inputs.type === 'LTD' ? 8 : 6);
        riskDrivers.push('Sudden expense spike (>40%)');
    }


    // 3. Determine Level
    let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (inputs.type === 'LTD') {
        if (score >= 46) level = 'HIGH';
        else if (score >= 21) level = 'MEDIUM';
    } else {
        // SOLE
        if (score >= 36) level = 'HIGH';
        else if (score >= 16) level = 'MEDIUM';
    }

    return { score, level, warnings, riskDrivers, suggestions };
}
