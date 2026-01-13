import type { Transaction } from './types';

export interface SavingsRecommendation {
    id: string;
    title: string;
    description: string;
    potentialSaving: number;
    type: 'capital_allowance' | 'optimization' | 'missing_expense';
    confidence: 'high' | 'medium' | 'low';
    actionLabel: string;
    actionData?: any;
}

export const TAX_CONSTANTS = {
    CIT_RATE: 0.30,
    WHT_DIVIDEND: 0.10,
    EDT_RATE: 0.025,
};

export function analyzeCapitalAllowances(transactions: Transaction[]): SavingsRecommendation[] {
    const recommendations: SavingsRecommendation[] = [];

    // Define asset categories with their depreciation rates (Nigerian CITA)
    const assetCategories = [
        {
            keywords: ['laptop', 'computer', 'macbook', 'dell', 'hp laptop', 'desktop', 'server'],
            category: 'Computer Equipment',
            rate: 0.25, // 25% per annum
            qualifiesForIA: true // 95% investment allowance year 1
        },
        {
            keywords: ['furniture', 'desk', 'chair', 'table', 'cabinet', 'filing'],
            category: 'Furniture & Fittings',
            rate: 0.20, // 20% per annum
            qualifiesForIA: true
        },
        {
            keywords: ['vehicle', 'car', 'toyota', 'honda', 'truck', 'van'],
            category: 'Motor Vehicles',
            rate: 0.25, // 25% per annum
            qualifiesForIA: false
        },
        {
            keywords: ['generator', 'inverter', 'solar', 'ups', 'battery'],
            category: 'Plant & Machinery',
            rate: 0.20, // 20% per annum
            qualifiesForIA: true
        },
        {
            keywords: ['building', 'construction', 'renovation'],
            category: 'Buildings',
            rate: 0.10, // 10% per annum
            qualifiesForIA: false
        }
    ];

    // Identify potential capital assets misclassified as expenses
    const potentialAssets = transactions.filter(t => {
        const amount = Math.abs(t.amount);
        const desc = t.description.toLowerCase();

        // Must be significant amount (> ₦500k)
        if (amount <= 500000) return false;

        // Must match asset keywords OR be in equipment/repair category
        const matchesKeyword = assetCategories.some(cat =>
            cat.keywords.some(kw => desc.includes(kw))
        );
        const matchesCategory = t.category_name?.toLowerCase().includes('equipment') ||
            t.category_name?.toLowerCase().includes('repair');

        return matchesKeyword || matchesCategory;
    });

    let totalUnutilizedAllowances = 0;

    potentialAssets.forEach(t => {
        const amount = Math.abs(t.amount);
        const desc = t.description.toLowerCase();

        // Find matching asset category
        const assetCat = assetCategories.find(cat =>
            cat.keywords.some(kw => desc.includes(kw))
        ) || assetCategories[3]; // Default to Plant & Machinery

        // Calculate allowances
        const annualDepreciation = amount * assetCat.rate;
        const investmentAllowance = assetCat.qualifiesForIA ? amount * 0.95 : 0;

        // Total tax shield in year 1
        const year1Allowance = annualDepreciation + investmentAllowance;
        const taxSaving = year1Allowance * TAX_CONSTANTS.CIT_RATE;

        totalUnutilizedAllowances += year1Allowance;

        const iaText = assetCat.qualifiesForIA
            ? ` Plus 95% Investment Allowance (₦${investmentAllowance.toLocaleString()}) in Year 1!`
            : '';

        recommendations.push({
            id: `cap-${t.id}`,
            title: `Unclaimed Capital Allowance: ${assetCat.category}`,
            description: `The transaction "${t.description}" (₦${amount.toLocaleString()}) appears to be a capital asset but may be expensed. 

Reclassify as ${assetCat.category} to claim:
• Annual Depreciation: ${(assetCat.rate * 100).toFixed(0)}% = ₦${annualDepreciation.toLocaleString()}/year${iaText}

**Tax Saving Year 1**: ₦${taxSaving.toLocaleString()} (30% of ₦${year1Allowance.toLocaleString()})`,
            potentialSaving: taxSaving,
            type: 'capital_allowance',
            confidence: 'high',
            actionLabel: 'Reclassify as Asset',
            actionData: {
                transactionId: t.id,
                assetCategory: assetCat.category,
                depreciationRate: assetCat.rate,
                investmentAllowance: investmentAllowance
            }
        });
    });

    // Summary recommendation if multiple assets found
    if (totalUnutilizedAllowances > 0 && potentialAssets.length > 1) {
        const totalTaxSaving = totalUnutilizedAllowances * TAX_CONSTANTS.CIT_RATE;

        recommendations.unshift({
            id: 'cap-summary',
            title: '💎 Maximize Capital Allowances',
            description: `You have **₦${totalUnutilizedAllowances.toLocaleString()} in unutilized capital allowances** across ${potentialAssets.length} potential assets.

By properly capitalizing these items and claiming depreciation + investment allowances, you could save **₦${totalTaxSaving.toLocaleString()}** in tax.

Review each item below to ensure optimal tax treatment.`,
            potentialSaving: totalTaxSaving,
            type: 'capital_allowance',
            confidence: 'high',
            actionLabel: 'Review All Assets'
        });
    }

    return recommendations;
}

export function findMissingExpenses(transactions: Transaction[]): SavingsRecommendation[] {
    const recommendations: SavingsRecommendation[] = [];
    const currentYear = new Date().getFullYear();

    const categoryMonths = new Map<string, Set<number>>();
    const recurringCategories = ['Internet', 'Utilities', 'Rent', 'Professional Fees'];

    transactions.forEach(t => {
        const cat = t.category_name || 'Uncategorized';
        const date = new Date(t.date);
        if (date.getFullYear() === currentYear && recurringCategories.some(rc => cat.includes(rc))) {
            if (!categoryMonths.has(cat)) categoryMonths.set(cat, new Set());
            categoryMonths.get(cat)?.add(date.getMonth());
        }
    });

    recurringCategories.forEach(cat => {
        const months = categoryMonths.get(cat);
        if (months && months.size > 0 && months.size < 10) {
            recommendations.push({
                id: `miss-${cat}`,
                title: `Missing ${cat} Expenses`,
                description: `You have logged ${cat} for only ${months.size} months this year. Are you missing receipts for the other months?`,
                potentialSaving: 0,
                type: 'missing_expense',
                confidence: 'medium',
                actionLabel: 'Review Ledger'
            });
        }
    });

    return recommendations;
}

export function optimizeSalaryDividend(companyProfit: number, ownerNeeds: number): SavingsRecommendation[] {
    if (ownerNeeds <= 0) return [];

    // Test different salary/dividend mixes to find optimal
    const scenarios: Array<{ salary: number, dividend: number, totalTax: number }> = [];

    // Test increments of 500k
    for (let salary = 0; salary <= ownerNeeds; salary += 500000) {
        const dividend = ownerNeeds - salary;

        // Individual side: Tax on salary (PAYE) + Tax on dividend (10% WHT)
        const payeTax = calculatePAYE(salary);
        const dividendTax = dividend * 0.10; // 10% WHT on dividends
        const individualTax = payeTax + dividendTax;

        // Company side: CIT on profit
        // Salary is deductible, so reduces taxable profit
        // Dividends are NOT deductible
        const taxableProfit = Math.max(0, companyProfit - salary);
        const companyCIT = taxableProfit * TAX_CONSTANTS.CIT_RATE;

        const totalTax = individualTax + companyCIT;

        scenarios.push({ salary, dividend, totalTax });
    }

    // Find the scenario with lowest total tax
    scenarios.sort((a, b) => a.totalTax - b.totalTax);
    const optimal = scenarios[0];

    // Compare with extremes for demonstration
    const allSalaryScenario = scenarios.find(s => s.salary === ownerNeeds) || scenarios[0];
    const allDividendScenario = scenarios.find(s => s.dividend === ownerNeeds) || scenarios[0];

    const savingsVsAllSalary = allSalaryScenario.totalTax - optimal.totalTax;
    const savingsVsAllDividend = allDividendScenario.totalTax - optimal.totalTax;

    if (savingsVsAllSalary > 10000 || savingsVsAllDividend > 10000) {
        const maxSavings = Math.max(savingsVsAllSalary, savingsVsAllDividend);

        return [{
            id: 'opt-sal-div-mix',
            title: 'Salary vs. Dividend Optimization',
            description: `For a withdrawal of ₦${ownerNeeds.toLocaleString()}, the optimal mix is:

**Optimal Strategy**:
• Salary: ₦${optimal.salary.toLocaleString()}
• Dividend: ₦${optimal.dividend.toLocaleString()}
• **Total Tax**: ₦${optimal.totalTax.toLocaleString()}

**Comparison**:
• All Salary: ₦${allSalaryScenario.totalTax.toLocaleString()} tax
• All Dividend: ₦${allDividendScenario.totalTax.toLocaleString()} tax
• **Savings with Optimal Mix**: ₦${maxSavings.toLocaleString()}

**Why This Works**:
- Salary is deductible for the company (reduces CIT by 30%)
- But salary attracts progressive PAYE (up to 24%)
- Dividends have flat 10% WHT but no company deduction
- The optimal mix balances these trade-offs`,
            potentialSaving: maxSavings,
            type: 'optimization',
            confidence: 'high',
            actionLabel: 'View Detailed Analysis',
            actionData: {
                optimalSalary: optimal.salary,
                optimalDividend: optimal.dividend,
                totalTax: optimal.totalTax,
                allSalaryTax: allSalaryScenario.totalTax,
                allDividendTax: allDividendScenario.totalTax
            }
        }];
    }

    return [];
}

export function analyzeTaxTimingStrategies(
    transactions: Transaction[],
    currentProfit: number,
    currentDate: Date = new Date()
): SavingsRecommendation[] {
    const recommendations: SavingsRecommendation[] = [];
    const currentMonth = currentDate.getMonth();
    const isNearYearEnd = currentMonth >= 9; // Oct-Dec (months 9-11)

    // Only suggest timing strategies if near year-end
    if (!isNearYearEnd) return recommendations;

    // 1. Prepay Expenses Strategy (if profit is high)
    if (currentProfit > 5000000) { // If profit > ₦5m
        const suggestedPrepayment = Math.min(currentProfit * 0.20, 2000000); // Suggest prepaying up to 20% or ₦2m max
        const taxSaving = suggestedPrepayment * TAX_CONSTANTS.CIT_RATE;

        recommendations.push({
            id: 'timing-prepay-expenses',
            title: '⏰ Prepay Expenses Before Year-End',
            description: `Your current profit is ₦${currentProfit.toLocaleString()}. Consider prepaying allowable expenses before December 31st to reduce this year's taxable profit.

**Strategy**:
• Prepay recurring expenses (rent, subscriptions, insurance) for next year
• Suggested prepayment: ₦${suggestedPrepayment.toLocaleString()}
• **Tax Saving This Year**: ₦${taxSaving.toLocaleString()} (30% of prepaid amount)

**Examples**:
- Pay 12 months rent in advance
- Prepay annual software subscriptions
- Pay insurance premiums for next year

**Note**: Expenses must be genuinely incurred and commercially reasonable.`,
            potentialSaving: taxSaving,
            type: 'optimization',
            confidence: 'high',
            actionLabel: 'Review Recurring Expenses'
        });
    }

    // 2. Defer Income Strategy (if close to small business threshold)
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const SMALL_BIZ_THRESHOLD = 25000000; // ₦25m
    const WARNING_THRESHOLD = 22500000; // 90% of ₦25m

    if (totalIncome > WARNING_THRESHOLD && totalIncome < SMALL_BIZ_THRESHOLD) {
        const excessAmount = totalIncome - WARNING_THRESHOLD;
        const potentialCIT = currentProfit * TAX_CONSTANTS.CIT_RATE;

        recommendations.push({
            id: 'timing-defer-income',
            title: '⏰ Defer Income to Maintain Small Business Status',
            description: `Your turnover is ₦${totalIncome.toLocaleString()}, approaching the ₦25m Small Business Exemption threshold.

**Strategy**:
• Delay issuing invoices for completed work until January
• Defer ₦${excessAmount.toLocaleString()} in revenue to next year
• **Benefit**: Maintain 0% CIT rate (save ₦${potentialCIT.toLocaleString()} this year)

**⚠️ IMPORTANT - Eligibility Requirements**:
Eligibility for Small Business Relief depends on additional statutory conditions:
- Turnover ≤ ₦25m ✓ (verified from records)
- Total assets ≤ ₦25m (verify independently)
- Not in excluded sectors (Banking, Insurance, etc.)
- Employment structure within limits
Verify all criteria before relying on this relief.

**Warning**: 
- Only defer genuine unbilled work or pending payments
- Do not manipulate actual received income
- Consider multi-year impact (you'll pay tax next year)`,
            potentialSaving: potentialCIT,
            type: 'optimization',
            confidence: 'medium',
            actionLabel: 'Review Pending Invoices'
        });
    }

    // 3. Capital Expenditure Timing
    const recentLargeExpenses = transactions.filter(t => {
        const txnDate = new Date(t.date);
        const isRecent = txnDate.getMonth() >= 6; // Jul-Dec
        return Math.abs(t.amount) > 500000 && isRecent;
    });

    if (recentLargeExpenses.length > 0 && currentMonth < 11) {
        const totalCapEx = Math.abs(recentLargeExpenses.reduce((sum, t) => sum + t.amount, 0));
        const investmentAllowance = totalCapEx * 0.95; // 95% IA
        const annualDepreciation = totalCapEx * 0.25; // Assume 25% rate
        const year1Allowance = investmentAllowance + annualDepreciation;
        const taxSaving = year1Allowance * TAX_CONSTANTS.CIT_RATE;

        recommendations.push({
            id: 'timing-capex',
            title: '⏰ Accelerate Capital Purchases',
            description: `You have ₦${totalCapEx.toLocaleString()} in recent capital-like expenses. If these are assets, ensure they're capitalized and claimed THIS year.

**Strategy**:
• Complete planned equipment purchases before Dec 31
• Claim 95% Investment Allowance + 25% depreciation in Year 1
• **Total Year 1 Allowance**: ₦${year1Allowance.toLocaleString()}
• **Tax Saving**: ₦${taxSaving.toLocaleString()}

**Vs. Buying Next Year**:
If you defer to next year, you lose this year's tax benefit and spread the allowance over future years.`,
            potentialSaving: taxSaving,
            type: 'capital_allowance',
            confidence: 'high',
            actionLabel: 'Review Capital Plans'
        });
    }

    return recommendations;
}

export function analyzeBusinessStructure(
    currentStructure: 'sole_trader' | 'ltd' | 'partnership',
    revenue: number,
    profit: number,
    numberOfVentures: number = 1
): SavingsRecommendation[] {
    const recommendations: SavingsRecommendation[] = [];

    // 1. Sole Trader → Limited Company Analysis
    if (currentStructure === 'sole_trader' && profit > 3000000) {
        // Sole trader: All profit taxed as personal income via PIT
        const pitTax = calculatePAYE(profit);

        // Limited company: CIT + Dividend WHT
        // If profit allows, owner can take optimal salary/dividend mix
        const optimalSalary = Math.min(profit, 5000000); // Take ₦5m as salary (deductible)
        const remainingProfit = profit - optimalSalary;
        const cit = remainingProfit * TAX_CONSTANTS.CIT_RATE;
        const afterTaxProfit = remainingProfit - cit;
        const dividendWHT = afterTaxProfit * 0.10;
        const salaryPAYE = calculatePAYE(optimalSalary);

        const totalLtdTax = cit + dividendWHT + salaryPAYE;
        const savings = pitTax - totalLtdTax;

        if (savings > 100000) {
            recommendations.push({
                id: 'structure-incorporate',
                title: '🏢 Consider Incorporating as a Limited Company',
                description: `As a sole trader with ₦${profit.toLocaleString()} profit, you're paying ₦${pitTax.toLocaleString()} in PIT.

**If You Incorporate**:
• Company pays CIT: ₦${cit.toLocaleString()} (30% on ₦${remainingProfit.toLocaleString()})
• You take salary: ₦${optimalSalary.toLocaleString()} (PAYE: ₦${salaryPAYE.toLocaleString()})
• Remaining as dividend: ₦${afterTaxProfit.toLocaleString()} (WHT: ₦${dividendWHT.toLocaleString()})
• **Total Tax**: ₦${totalLtdTax.toLocaleString()} vs ₦${pitTax.toLocaleString()}
• **Annual Savings**: ₦${savings.toLocaleString()}

**Additional Benefits**:
- Limited liability protection
- Professional image
- Easier to attract investment
- Better access to business loans

**Next Steps**: Consult a lawyer for incorporation (CAC registration)`,
                potentialSaving: savings,
                type: 'optimization',
                confidence: 'high',
                actionLabel: 'Learn About Incorporation'
            });
        }
    }

    // 2. Small Business Exemption Opportunity (for LTDs)
    if (currentStructure === 'ltd' && revenue <= 25000000 && profit > 5000000) {
        // Currently paying 30% CIT, could pay 0% with proper planning
        const currentCIT = profit * TAX_CONSTANTS.CIT_RATE;
        const savingsIfExempt = currentCIT;

        recommendations.push({
            id: 'structure-small-biz',
            title: '🎯 Leverage Small Business Exemption',
            description: `Your revenue (₦${revenue.toLocaleString()}) qualifies for 0% CIT under the Small Business Exemption.

**Current Tax**: ₦${currentCIT.toLocaleString()} (30% on ₦${profit.toLocaleString()})
**If Qualified**: ₦0 CIT
**Potential Savings**: ₦${savingsIfExempt.toLocaleString()}/year

**Requirements**:
- Turnover ≤ ₦25m ✅ (You're at ₦${revenue.toLocaleString()})
- Total assets ≤ ₦25m (verify this)
- Not in excluded sectors (Banking, Insurance, etc.)

**Action**: Ensure you meet all criteria and file for exemption`,
            potentialSaving: savingsIfExempt,
            type: 'optimization',
            confidence: 'high',
            actionLabel: 'Check Full Criteria'
        });
    }

    // 3. Multiple Ventures → Holding Structure (if numberOfVentures > 1)
    if (currentStructure === 'ltd' && numberOfVentures > 1 && revenue > 50000000) {
        const estimatedGroupReliefBenefit = profit * 0.10; // Conservative 10% estimate

        recommendations.push({
            id: 'structure-holding',
            title: '🏛️ Consider a Holding Company Structure',
            description: `With ${numberOfVentures} business ventures and revenue over ₦50m, a holding structure may provide tax benefits.

**Potential Benefits**:
- **Group Relief**: Offset losses in one company against profits in another
- **Dividend Tax Efficiency**: Inter-company dividends may be exempt from WHT
- **Asset Protection**: Separate operating risk from asset ownership
- **Estate Planning**: Easier to transfer ownership

**Estimated Annual Benefit**: ₦${estimatedGroupReliefBenefit.toLocaleString()}

**Structure Example**:
- Parent HoldCo (owns all subsidiaries)
- OpCo 1, OpCo 2, OpCo 3 (separate operating companies)
- PropCo (holds properties/assets)

**Complexity**: Requires professional structuring and higher compliance costs

**Next Steps**: Consult a tax advisor for detailed feasibility analysis`,
            potentialSaving: estimatedGroupReliefBenefit,
            type: 'optimization',
            confidence: 'medium',
            actionLabel: 'Contact Tax Advisor'
        });
    }

    // 4. Partnership → LTD (if applicable)
    if (currentStructure === 'partnership' && profit > 5000000) {
        recommendations.push({
            id: 'structure-partnership-to-ltd',
            title: '🤝 Convert Partnership to Limited Company',
            description: `Partnerships face challenges with liability and tax efficiency.

**Benefits of Converting to LTD**:
- Limited liability for all partners
- Clearer ownership structure (shares vs. partnership interest)
- Easier exit/entry of partners
- Better tax planning flexibility

**Consideration**: Consult partners and legal advisor for conversion process`,
            potentialSaving: 0, // No direct tax saving, but structural benefits
            type: 'optimization',
            confidence: 'medium',
            actionLabel: 'Discuss with Partners'
        });
    }

    return recommendations;
}

export function calculateTaxSavings(turnover: number, expenses: number, type: 'SOLE' | 'LTD'): { taxWithoutExpenses: number, taxWithExpenses: number, savings: number } {
    let taxWithoutExpenses = 0;
    let taxWithExpenses = 0;
    const profit = Math.max(0, turnover - expenses);

    if (type === 'LTD') {
        taxWithoutExpenses = turnover * 0.30;
        taxWithExpenses = profit * 0.30;
    } else {
        taxWithoutExpenses = calculatePAYE(turnover);
        taxWithExpenses = calculatePAYE(profit);
    }

    return {
        taxWithoutExpenses,
        taxWithExpenses,
        savings: taxWithoutExpenses - taxWithExpenses
    };
}

export function calculatePAYE(annualGross: number): number {
    // 2024? Using standard bands (PITA 2011)
    // Consolidated Relief Allowance (CRA): Higher of 200k or 1% Gross + 20% Gross
    const cra = Math.max(200000, annualGross * 0.01) + (annualGross * 0.20);
    const taxable = Math.max(0, annualGross - cra);

    let tax = 0;
    let remainder = taxable;

    // Bands
    const bands = [
        { limit: 300000, rate: 0.07 },
        { limit: 300000, rate: 0.11 },
        { limit: 500000, rate: 0.15 },
        { limit: 500000, rate: 0.19 },
        { limit: 1600000, rate: 0.21 },
        { limit: Infinity, rate: 0.24 }
    ];

    for (const band of bands) {
        if (remainder <= 0) break;
        const taxableAmount = Math.min(remainder, band.limit);
        tax += taxableAmount * band.rate;
        remainder -= taxableAmount;
    }

    return tax;
}

export interface ReliefEligibility {
    turnover: number;
    totalAssets: number;
    sector?: string;
    profit: number;
}

export interface TaxAtRiskBreakdown {
    category: 'Documentation' | 'Allowability' | 'VAT' | 'WHT';
    disallowedAmount: number;
    taxAtRisk: number;
    affectedTransactions: string[];
    actionableInsight: string;
    // Evidence-driven enforcement
    evidenceStatus: 'complete' | 'partial' | 'missing';
    documentCount: number;
    ruleTriggered: string;
    confidenceLevel: 'high' | 'medium' | 'low';
}

export interface TaxAtRiskResult {
    totalAtRisk: number;
    breakdown: TaxAtRiskBreakdown[];
    currentTaxLiability: number;
    potentialTaxLiability: number;
    progressMetrics: {
        totalIssues: number;
        resolvedIssues: number;
        percentageResolved: number;
    };
    severityLevel: 'low' | 'medium' | 'high' | 'critical';
    estimatedPenalties: number;
}

export function calculateTaxAtRisk(transactions: Transaction[]): TaxAtRiskResult {
    const breakdown: TaxAtRiskBreakdown[] = [];

    // Exclude Personal tagged transactions from tax risk calculations
    // Personal expenses should not be included in business tax calculations
    const businessTransactions = transactions.filter(t => t.tax_tag !== 'Personal');

    // Filter transactions with compliance issues
    const documentationIssues = businessTransactions.filter(t =>
        t.audit_status === 'fail' || t.audit_status === 'review' ||
        t.allowability_status === 'pending'
    );

    const allowabilityIssues = businessTransactions.filter(t =>
        t.allowability_status === 'non_allowable' || t.allowability_status === 'partial'
    );

    const vatIssues = businessTransactions.filter(t =>
        t.tax_tag === 'VAT' && (t.audit_status === 'fail' || !t.preview_url)
    );

    const whtIssues = businessTransactions.filter(t =>
        t.tax_tag === 'WHT' && (t.audit_status === 'fail' || !t.preview_url)
    );

    // Documentation Issues (missing receipts)
    if (documentationIssues.length > 0) {
        const totalDisallowed = Math.abs(documentationIssues.reduce((sum, t) => sum + t.amount, 0));
        const taxAtRisk = totalDisallowed * TAX_CONSTANTS.CIT_RATE;

        // Count documents
        const withEvidence = documentationIssues.filter(t => t.preview_url).length;
        const documentCount = withEvidence;
        const evidenceStatus: 'complete' | 'partial' | 'missing' =
            withEvidence === documentationIssues.length ? 'complete' :
                withEvidence > 0 ? 'partial' : 'missing';

        // Confidence based on evidence
        const confidenceLevel: 'high' | 'medium' | 'low' =
            evidenceStatus === 'complete' ? 'high' :
                evidenceStatus === 'partial' ? 'medium' : 'low';

        breakdown.push({
            category: 'Documentation',
            disallowedAmount: totalDisallowed,
            taxAtRisk,
            affectedTransactions: documentationIssues.map(t => t.id),
            actionableInsight: `Upload missing receipts to save ₦${taxAtRisk.toLocaleString()} in tax`,
            evidenceStatus,
            documentCount,
            ruleTriggered: 'CITA_S24_DOCUMENTATION_REQUIRED',
            confidenceLevel
        });
    }

    // Allowability Issues (personal expenses, excess entertainment)
    if (allowabilityIssues.length > 0) {
        const totalDisallowed = Math.abs(allowabilityIssues.reduce((sum, t) => {
            if (t.allowability_status === 'partial' && t.allowable_amount) {
                return sum + (t.amount - t.allowable_amount);
            }
            return sum + t.amount;
        }, 0));
        const taxAtRisk = totalDisallowed * TAX_CONSTANTS.CIT_RATE;

        const withEvidence = allowabilityIssues.filter(t => t.preview_url).length;
        const evidenceStatus: 'complete' | 'partial' | 'missing' =
            withEvidence === allowabilityIssues.length ? 'complete' :
                withEvidence > 0 ? 'partial' : 'missing';
        const confidenceLevel: 'high' | 'medium' | 'low' =
            evidenceStatus === 'complete' ? 'high' : 'medium';

        breakdown.push({
            category: 'Allowability',
            disallowedAmount: totalDisallowed,
            taxAtRisk,
            affectedTransactions: allowabilityIssues.map(t => t.id),
            actionableInsight: `Reclassify personal expenses to save ₦${taxAtRisk.toLocaleString()}`,
            evidenceStatus,
            documentCount: withEvidence,
            ruleTriggered: 'CITA_S25_ALLOWABILITY_TEST',
            confidenceLevel
        });
    }

    // VAT Issues
    if (vatIssues.length > 0) {
        const totalDisallowed = Math.abs(vatIssues.reduce((sum, t) => sum + t.amount, 0));
        const vatAtRisk = totalDisallowed * 0.075; // 7.5% VAT rate

        const withVATInvoice = vatIssues.filter(t => t.preview_url).length;
        const evidenceStatus: 'complete' | 'partial' | 'missing' =
            withVATInvoice === vatIssues.length ? 'complete' :
                withVATInvoice > 0 ? 'partial' : 'missing';
        const confidenceLevel: 'high' | 'medium' | 'low' =
            evidenceStatus === 'complete' ? 'high' : 'low';

        breakdown.push({
            category: 'VAT',
            disallowedAmount: totalDisallowed,
            taxAtRisk: vatAtRisk,
            affectedTransactions: vatIssues.map(t => t.id),
            actionableInsight: `Upload VAT invoices to claim ₦${vatAtRisk.toLocaleString()} input VAT`,
            evidenceStatus,
            documentCount: withVATInvoice,
            ruleTriggered: 'VAT_ACT_S17_INPUT_TAX_CLAIM',
            confidenceLevel
        });
    }

    // WHT Issues
    if (whtIssues.length > 0) {
        const totalDisallowed = Math.abs(whtIssues.reduce((sum, t) => sum + t.amount, 0));
        const whtAtRisk = totalDisallowed * 0.10; // Assuming 10% WHT rate (common)

        const withWHTCert = whtIssues.filter(t => t.preview_url).length;
        const evidenceStatus: 'complete' | 'partial' | 'missing' =
            withWHTCert === whtIssues.length ? 'complete' :
                withWHTCert > 0 ? 'partial' : 'missing';
        const confidenceLevel: 'high' | 'medium' | 'low' =
            evidenceStatus === 'complete' ? 'high' : 'low';

        breakdown.push({
            category: 'WHT',
            disallowedAmount: totalDisallowed,
            taxAtRisk: whtAtRisk,
            affectedTransactions: whtIssues.map(t => t.id),
            actionableInsight: `Request WHT certificates to claim ₦${whtAtRisk.toLocaleString()} credit`,
            evidenceStatus,
            documentCount: withWHTCert,
            ruleTriggered: 'CITA_S78_WHT_CREDIT_CLAIM',
            confidenceLevel
        });
    }

    const totalAtRisk = breakdown.reduce((sum, b) => sum + b.taxAtRisk, 0);

    // Calculate tax liabilities (simplified - assumes profit calculation exists elsewhere)
    const totalExpenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
    const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const profit = totalIncome - totalExpenses;
    const currentTaxLiability = Math.max(0, profit * TAX_CONSTANTS.CIT_RATE);
    const potentialTaxLiability = currentTaxLiability + totalAtRisk;

    // Progress metrics
    const allIssues = [...documentationIssues, ...allowabilityIssues, ...vatIssues, ...whtIssues];
    const uniqueIssueIds = new Set(allIssues.map(t => t.id));
    const totalIssues = uniqueIssueIds.size; // Count of unique transactions with issues
    const resolvedTransactions = transactions.filter(t => t.audit_status === 'pass');
    const resolvedIssues = resolvedTransactions.length; // Count of transactions marked as 'pass'

    // The percentageResolved formula provided in the instruction is `resolved / (resolved + unresolved)`.
    // If `totalIssues` represents unresolved issues, then `resolvedIssues` represents resolved issues.
    // So, `percentageResolved = resolvedIssues / (resolvedIssues + totalIssues)`
    const percentageResolved = (resolvedIssues + totalIssues) > 0 ? (resolvedIssues / (resolvedIssues + totalIssues)) * 100 : 100;

    // Severity level
    let severityLevel: 'low' | 'medium' | 'high' | 'critical';
    if (totalAtRisk < 100000) severityLevel = 'low';
    else if (totalAtRisk < 500000) severityLevel = 'medium';
    else if (totalAtRisk < 1000000) severityLevel = 'high';
    else severityLevel = 'critical';

    // Estimated penalties (10% on WHT)
    const whtCategory = breakdown.find(b => b.category === 'WHT');
    const estimatedPenalties = whtCategory ? whtCategory.taxAtRisk * 0.10 : 0;

    return {
        totalAtRisk,
        breakdown,
        currentTaxLiability,
        potentialTaxLiability,
        progressMetrics: {
            totalIssues,
            resolvedIssues,
            percentageResolved
        },
        severityLevel,
        estimatedPenalties
    };
}

export function checkReliefEligibility(eligibility: ReliefEligibility): SavingsRecommendation[] {
    const recommendations: SavingsRecommendation[] = [];
    const { turnover, totalAssets, sector, profit } = eligibility;

    // Excluded sectors (Finance Act)
    const excludedSectors = ['banking', 'insurance', 'aviation', 'marine', 'bureau de change'];
    const isExcluded = sector && excludedSectors.some(ex => sector.toLowerCase().includes(ex));

    const THRESHOLD = 25000000; // ₦25m
    const WARNING_THRESHOLD = 22500000; // 90% of ₦25m

    // Small Business Relief Check
    if (!isExcluded && turnover <= THRESHOLD && totalAssets <= THRESHOLD) {
        const standardCIT = profit * TAX_CONSTANTS.CIT_RATE;
        const savingsAmount = standardCIT; // Saving 30% vs 0%

        recommendations.push({
            id: 'relief-small-business',
            title: 'Small Business Exemption (Finance Act)',
            description: `Your company qualifies for the 0% CIT rate! With turnover of ₦${turnover.toLocaleString()} and assets of ₦${totalAssets.toLocaleString()}, both under ₦25m, you are exempt from paying Corporate Income Tax.`,
            potentialSaving: savingsAmount,
            type: 'optimization',
            confidence: 'high',
            actionLabel: 'Learn More',
            actionData: { type: 'small_business_relief', turnover, totalAssets, profit }
        });
    } else if (!isExcluded && (turnover > WARNING_THRESHOLD || totalAssets > WARNING_THRESHOLD)) {
        // Warning: Approaching threshold
        const closerValue = Math.max(turnover, totalAssets);
        const percentOfLimit = (closerValue / THRESHOLD) * 100;

        recommendations.push({
            id: 'relief-warning',
            title: '⚠️ Approaching Small Business Threshold',
            description: `You are at ${percentOfLimit.toFixed(0)}% of the ₦25m limit (Turnover: ₦${turnover.toLocaleString()}, Assets: ₦${totalAssets.toLocaleString()}). Consider tax planning to maintain eligibility for 0% CIT.`,
            potentialSaving: 0,
            type: 'optimization',
            confidence: 'medium',
            actionLabel: 'View Strategies'
        });
    } else if (isExcluded) {
        recommendations.push({
            id: 'relief-excluded',
            title: 'Small Business Relief: Not Eligible',
            description: `Your sector (${sector}) is excluded from the Small Business Exemption under the Finance Act. Standard CIT rates apply.`,
            potentialSaving: 0,
            type: 'optimization',
            confidence: 'high',
            actionLabel: 'Explore Alternatives'
        });
    }

    // Industry-Specific Incentives (Carefully worded - these require formal applications)
    if (sector) {
        const sectorLower = sector.toLowerCase();

        // Pioneer Status (NIPC Approval Required)
        const pioneerEligibleSectors = ['manufacturing', 'agriculture', 'mining', 'solid minerals', 'petrochemical'];
        if (pioneerEligibleSectors.some(s => sectorLower.includes(s))) {
            recommendations.push({
                id: 'incentive-pioneer',
                title: 'Pioneer Status - Potential Eligibility',
                description: `Your sector (${sector}) suggests you MAY be eligible for Pioneer Status tax holiday (3-5 years). This requires:
• Product must be on NIPC Pioneer Status List
• Manufacturing in Nigeria (not trading)
• Minimum investment thresholds met
• Formal NIPC application (6-12 month process)

This is NOT automatic - only NIPC can approve after detailed review.`,
                potentialSaving: 0,
                type: 'optimization',
                confidence: 'low',
                actionLabel: 'Learn About NIPC Process',
                actionData: {
                    type: 'pioneer_status',
                    nipc_url: 'https://nipc.gov.ng',
                    timeline: '6-12 months'
                }
            });
        }

        // Export Expansion Grant (EEG)
        if (sectorLower.includes('export') || sectorLower.includes('manufacturing')) {
            recommendations.push({
                id: 'incentive-eeg',
                title: 'Export Expansion Grant (EEG)',
                description: `If you export manufactured goods, you may qualify for EEG - a tax credit of 30-50% of export proceeds. Requires Nigerian Export Promotion Council (NEPC) certification and minimum export thresholds.`,
                potentialSaving: 0,
                type: 'optimization',
                confidence: 'low',
                actionLabel: 'Check NEPC Requirements'
            });
        }

        // Investment Tax Credit (ITC)
        if (sectorLower.includes('manufacturing')) {
            recommendations.push({
                id: 'incentive-itc',
                title: 'Investment Tax Credit (ITC)',
                description: `Manufacturing companies with significant local content may claim Investment Tax Credit. Check if your equipment/materials qualify for 10-15% tax credits. Requires NIPC pre-approval.`,
                potentialSaving: 0,
                type: 'optimization',
                confidence: 'medium',
                actionLabel: 'Explore ITC Criteria'
            });
        }

        // Gas Utilization Incentive
        if (sectorLower.includes('gas') || sectorLower.includes('energy')) {
            recommendations.push({
                id: 'incentive-gas',
                title: 'Gas Utilization (Downstream) Incentive',
                description: `Downstream gas utilization projects may qualify for tax holidays and capital allowances. Requires DPR certification and minimum investment of ₦500m+.`,
                potentialSaving: 0,
                type: 'optimization',
                confidence: 'low',
                actionLabel: 'Contact Tax Advisor'
            });
        }
    }

    return recommendations;
}
