import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { Transaction, Company } from '../engine/types';
import {
    analyzeCapitalAllowances,
    findMissingExpenses,
    optimizeSalaryDividend,
    checkReliefEligibility,
    calculateTaxAtRisk,
    analyzeTaxTimingStrategies,
    analyzeBusinessStructure,
    type SavingsRecommendation,
    type ReliefEligibility,
    type TaxAtRiskResult
} from '../engine/taxSavings';
import { pdf } from '@react-pdf/renderer';
import { TaxRiskReportPDF } from './reports/TaxRiskReportPDF';

export function TaxSavings({ companyId }: { companyId: string }) {
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [company, setCompany] = useState<Company | null>(null);
    const [taxAtRisk, setTaxAtRisk] = useState<TaxAtRiskResult | null>(null);
    const [recommendations, setRecommendations] = useState<SavingsRecommendation[]>([]);

    // State for mobile collapsible sections
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // Scenario Inputs
    const [profit, setProfit] = useState(10000000); // Default 10m
    const [ownerNeeds, setOwnerNeeds] = useState(3000000); // Default 3m withdrawal
    const [turnover, setTurnover] = useState(20000000); // Default 20m
    const [totalAssets, setTotalAssets] = useState(15000000); // Default 15m

    useEffect(() => {
        loadData();
    }, [companyId]);

    // Re-run optimization when scenario changes
    useEffect(() => {
        if (!loading && company) {
            runEngine(transactions, company);
        }
    }, [profit, ownerNeeds, turnover, totalAssets]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch company data
            const { data: companyData } = await supabase.from('companies')
                .select('*')
                .eq('id', companyId)
                .single();

            let comp: Company | null = null;
            if (companyData) {
                comp = { ...companyData, name: companyData.legal_name || companyData.display_name || 'Unnamed' } as Company;
                setCompany(comp);
            }

            // Fetch transactions
            const { data } = await supabase.from('transactions')
                .select('*')
                .eq('company_id', companyId)  // Filter by company for RLS
                .lt('amount', 0); // Expenses only for analysis (mostly)

            if (data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const txns = data as any[] as Transaction[];
                setTransactions(txns);
                if (comp) runEngine(txns, comp);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const runEngine = (txns: Transaction[], comp: Company) => {
        const caps = analyzeCapitalAllowances(txns);
        const missing = findMissingExpenses(txns);

        // Calculate profit for salary/dividend optimization
        const totalIncome = txns.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = Math.abs(txns.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
        const calculatedProfit = totalIncome - totalExpenses;
        const profitToUse = calculatedProfit > 0 ? calculatedProfit : profit; // Use calculated or user input

        const opts = optimizeSalaryDividend(profitToUse, ownerNeeds);

        // Tax at Risk Calculation
        const taxRisk = calculateTaxAtRisk(txns);
        setTaxAtRisk(taxRisk);

        // Tax Timing Strategies
        const timing = analyzeTaxTimingStrategies(txns, profitToUse);

        // Small Business Relief Check
        const reliefEligibility: ReliefEligibility = {
            turnover,
            totalAssets,
            sector: comp.sector,
            profit
        };
        const reliefs = checkReliefEligibility(reliefEligibility);

        // Business Structure Analysis
        const structure = analyzeBusinessStructure(
            comp.entity_type,
            totalIncome,
            profitToUse,
            1 // numberOfVentures - could be enhanced to detect multiple ventures
        );

        // Combine all recommendations with unique IDs
        const allRecommendations = [
            ...reliefs.map((r, i) => ({ ...r, id: `relief-${i}-${r.id}` })),
            ...timing.map((r, i) => ({ ...r, id: `timing-${i}-${r.id}` })),
            ...structure.map((r, i) => ({ ...r, id: `structure-${i}-${r.id}` })),
            ...caps.map((r, i) => ({ ...r, id: `cap-${i}-${r.id}` })),
            ...missing.map((r, i) => ({ ...r, id: `missing-${i}-${r.id}` })),
            ...opts.map((r, i) => ({ ...r, id: `opt-${i}-${r.id}` }))
        ];
        setRecommendations(allRecommendations);
    };

    const totalPotentialSavings = recommendations.reduce((acc, r) => acc + r.potentialSaving, 0);

    const handleDownloadPDFReport = async () => {
        if (!taxAtRisk || !company) return;

        try {
            const currentYear = new Date().getFullYear();
            const blob = await pdf(
                <TaxRiskReportPDF
                    companyName={company.name}
                    period={`January - December ${currentYear}`}
                    taxAtRisk={taxAtRisk}
                    generatedDate={new Date().toLocaleString()}
                />
            ).toBlob();

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tax-risk-report-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Failed to generate PDF report. Please try again.');
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Analyzing Finances...</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b' }}>Tax Optimization</h1>
                <p style={{ color: '#64748b' }}>Legal strategies to minimize tax liability based on your data.</p>
            </div>

            {/* Savings Hero */}
            <div className="glass-panel" style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                padding: '2rem', borderRadius: '16px', color: 'white', marginBottom: '2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
                <div>
                    <h2 style={{ fontSize: '1rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px' }}>Potential Savings Identified</h2>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
                        ₦{totalPotentialSavings.toLocaleString()}
                    </div>
                </div>
                <div style={{ textAlign: 'right', display: 'none' }}>
                    {/* Placeholder for chart or breakdown */}
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Across {recommendations.length} opportunities</div>
                </div>
            </div>

            {/* Tax at Risk Alert */}
            {taxAtRisk && taxAtRisk.totalAtRisk > 0 && (
                <div className="glass-panel" style={{
                    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                    padding: '2rem', borderRadius: '16px', color: 'white', marginBottom: '2rem',
                    boxShadow: '0 10px 40px rgba(220, 38, 38, 0.3)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1rem', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>⚠️ Tax at Risk</h2>
                            <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
                                ₦{taxAtRisk.totalAtRisk.toLocaleString()}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '4px' }}>If Resolved:</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#86efac' }}>₦{taxAtRisk.currentTaxLiability.toLocaleString()}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>vs ₦{taxAtRisk.potentialTaxLiability.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Breakdown Table */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', opacity: 0.9 }}>Breakdown by Issue Type</h3>

                        {/* Mobile: Collapsible */}
                        <div className="mobile-breakdown" style={{ display: 'grid', gap: '0.75rem' }}>
                            {taxAtRisk.breakdown.map(item => (
                                <div key={`mobile-${item.category}`} style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    overflow: 'hidden'
                                }}>
                                    {/* Header - Always Visible */}
                                    <button
                                        onClick={() => setExpandedCategory(
                                            expandedCategory === item.category ? null : item.category
                                        )}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'white',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '0.95rem',
                                            fontWeight: '600'
                                        }}
                                    >
                                        <div>
                                            <div>{item.category}</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fef3c7', marginTop: '4px' }}>
                                                ₦{item.taxAtRisk.toLocaleString()}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '1.5rem', transition: 'transform 0.2s', transform: expandedCategory === item.category ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                            ▼
                                        </span>
                                    </button>

                                    {/* Details - Collapsible */}
                                    {expandedCategory === item.category && (
                                        <div style={{
                                            padding: '1rem',
                                            paddingTop: '0',
                                            fontSize: '0.9rem',
                                            opacity: 0.95
                                        }}>
                                            <div style={{ marginBottom: '0.75rem' }}>
                                                <strong>Disallowed Amount:</strong> ₦{item.disallowedAmount.toLocaleString()}
                                            </div>
                                            <div style={{ marginBottom: '0.75rem' }}>
                                                <strong>Action:</strong> {item.actionableInsight}
                                            </div>
                                            <div>
                                                <strong>Affected Transactions:</strong> {item.affectedTransactions.length}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Desktop: Table View (hidden on mobile) */}
                        <div className="desktop-breakdown" style={{ display: 'none' }}>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {taxAtRisk.breakdown.map(item => (
                                    <div key={`desktop-${item.category}`} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '120px 1fr 150px 150px',
                                        alignItems: 'center',
                                        padding: '0.75rem',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.category}</div>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{item.actionableInsight}</div>
                                        <div style={{ fontSize: '0.9rem', textAlign: 'right' }}>₦{item.disallowedAmount.toLocaleString()}</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 'bold', textAlign: 'right', color: '#fef3c7' }}>₦{item.taxAtRisk.toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Download PDF Button */}
                    <button
                        onClick={handleDownloadPDFReport}
                        style={{
                            marginTop: '1.5rem',
                            padding: '0.875rem 2rem',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            borderRadius: '8px',
                            border: '2px solid white',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.color = '#dc2626';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                            e.currentTarget.style.color = 'white';
                        }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>📥</span>
                        Download Tax Risk Report
                    </button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>

                {/* Simulation Control Panel */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#334155' }}>Scenario Planner</h3>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>Projected Annual Profit</label>
                        <input
                            type="number"
                            value={profit}
                            onChange={(e) => setProfit(Number(e.target.value))}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>Annual Turnover</label>
                        <input
                            type="number"
                            value={turnover}
                            onChange={(e) => setTurnover(Number(e.target.value))}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>Total Assets</label>
                        <input
                            type="number"
                            value={totalAssets}
                            onChange={(e) => setTotalAssets(Number(e.target.value))}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
                            Used to check Small Business Exemption (≤ ₦25m)
                        </p>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>Owner's Cash Needs (Net)</label>
                        <input
                            type="number"
                            value={ownerNeeds}
                            onChange={(e) => setOwnerNeeds(Number(e.target.value))}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
                            Adjust this to see how changing your personal withdrawal strategy affects total tax.
                        </p>
                    </div>
                </div>

                {/* Recommendations List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#334155' }}>Actionable Insights</h3>

                    {recommendations.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'white', borderRadius: '12px' }}>
                            No optimization opportunities found yet. Keep tracking your expenses!
                        </div>
                    ) : (
                        recommendations.map(rec => (
                            <RecommendationCard key={rec.id} item={rec} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function RecommendationCard({ item }: { item: SavingsRecommendation }) {
    const isHighConf = item.confidence === 'high';
    const borderColor = isHighConf ? '#22c55e' : item.confidence === 'medium' ? '#f59e0b' : '#cbd5e1';

    return (
        <div style={{
            background: 'white', borderRadius: '12px', padding: '1.5rem',
            borderLeft: `5px solid ${borderColor}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                    <div style={{
                        fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px',
                        display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        {item.type === 'capital_allowance' && '🏗️ Capital Allowance'}
                        {item.type === 'optimization' && '💡 Strategy'}
                        {item.type === 'missing_expense' && '🔍 Missing Data'}

                        <span style={{
                            background: isHighConf ? '#dcfce7' : '#fef3c7',
                            color: isHighConf ? '#166534' : '#b45309',
                            padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem'
                        }}>
                            {item.confidence.toUpperCase()} CONFIDENCE
                        </span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>{item.title}</h3>
                </div>
                {item.potentialSaving > 0 && (
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#166534' }}>
                            +₦{item.potentialSaving.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>est. saving</div>
                    </div>
                )}
            </div>

            <p style={{ color: '#475569', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                {item.description}
            </p>

            {item.actionData?.salaryTax && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Option A: Salary Tax</span>
                        <span style={{ fontWeight: '600' }}>₦{item.actionData.salaryTax.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Option B: Dividend Tax</span>
                        <span style={{ fontWeight: '600', color: '#166534' }}>₦{item.actionData.dividendTax.toLocaleString()}</span>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{
                    background: isHighConf ? '#22c55e' : '#3b82f6',
                    color: 'white', border: 'none', padding: '0.7rem 1.4rem',
                    borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                    transition: 'opacity 0.2s'
                }}>
                    {item.actionLabel}
                </button>
            </div>
        </div>
    );
}
