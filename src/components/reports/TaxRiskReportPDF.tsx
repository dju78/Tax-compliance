import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { TaxAtRiskResult } from '../../engine/taxSavings';

interface TaxRiskReportData {
    companyName: string;
    period: string;
    taxAtRisk: TaxAtRiskResult;
    generatedDate: string;
}

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10
    },
    header: {
        marginBottom: 30,
        borderBottom: '2pt solid #1e3a8a',
        paddingBottom: 15
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 5
    },
    subtitle: {
        fontSize: 14,
        color: '#475569',
        marginBottom: 3
    },
    date: {
        fontSize: 9,
        color: '#94a3b8'
    },
    summaryCard: {
        backgroundColor: '#fee2e2',
        padding: 20,
        borderRadius: 8,
        marginBottom: 25,
        border: '2pt solid #dc2626'
    },
    largeAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#dc2626',
        marginBottom: 5
    },
    label: {
        fontSize: 11,
        color: '#7f1d1d',
        fontWeight: 'bold'
    },
    section: {
        marginBottom: 25
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e3a8a',
        marginBottom: 12,
        borderBottom: '1pt solid #cbd5e1',
        paddingBottom: 5
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    statBox: {
        flex: 1,
        padding: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 6,
        marginHorizontal: 5
    },
    statLabel: {
        fontSize: 9,
        color: '#64748b',
        marginBottom: 4
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b'
    },
    table: {
        marginTop: 10
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#e5e7eb',
        padding: 10,
        borderRadius: 4,
        fontWeight: 'bold'
    },
    tableRow: {
        flexDirection: 'row',
        padding: 10,
        borderBottom: '1pt solid #f1f5f9'
    },
    tableRowAlt: {
        flexDirection: 'row',
        padding: 10,
        backgroundColor: '#f9fafb',
        borderBottom: '1pt solid #f1f5f9'
    },
    tableCell: {
        flex: 1,
        fontSize: 9
    },
    tableCellBold: {
        flex: 1,
        fontSize: 9,
        fontWeight: 'bold'
    },
    tableCellRed: {
        flex: 1,
        fontSize: 9,
        fontWeight: 'bold',
        color: '#dc2626'
    },
    comparisonBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15
    },
    comparisonItem: {
        flex: 1,
        padding: 15,
        marginHorizontal: 5,
        borderRadius: 6
    },
    comparisonCurrent: {
        backgroundColor: '#fee2e2',
        border: '1pt solid #fca5a5'
    },
    comparisonOptimized: {
        backgroundColor: '#d1fae5',
        border: '1pt solid #6ee7b7'
    },
    comparisonLabel: {
        fontSize: 9,
        marginBottom: 5,
        color: '#64748b'
    },
    comparisonAmount: {
        fontSize: 20,
        fontWeight: 'bold'
    },
    savingsBox: {
        backgroundColor: '#dbeafe',
        padding: 15,
        borderRadius: 6,
        textAlign: 'center'
    },
    savingsAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1e40af',
        marginBottom: 5
    },
    savingsLabel: {
        fontSize: 10,
        color: '#1e40af'
    },
    recommendationCard: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#f8fafc',
        borderLeft: '4pt solid #3b82f6',
        borderRadius: 4
    },
    recommendationTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8
    },
    recommendationText: {
        fontSize: 9,
        color: '#475569',
        lineHeight: 1.5,
        marginBottom: 6
    },
    priorityBadge: {
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '4pt 8pt',
        borderRadius: 3,
        fontSize: 8,
        fontWeight: 'bold',
        alignSelf: 'flex-start'
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        fontSize: 8,
        color: '#94a3b8',
        borderTop: '1pt solid #e2e8f0',
        paddingTop: 10
    },
    disclaimer: {
        backgroundColor: '#fef3c7',
        padding: 15,
        borderRadius: 6,
        border: '1pt solid #f59e0b',
        marginTop: 20
    },
    disclaimerTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#92400e',
        marginBottom: 6
    },
    disclaimerText: {
        fontSize: 8,
        color: '#78350f',
        lineHeight: 1.4
    },
    confidenceBadge: {
        padding: '3pt 6pt',
        borderRadius: 3,
        fontSize: 7,
        fontWeight: 'bold'
    },
    confidenceHigh: {
        backgroundColor: '#d1fae5',
        color: '#065f46'
    },
    confidenceMedium: {
        backgroundColor: '#fef3c7',
        color: '#92400e'
    },
    confidenceLow: {
        backgroundColor: '#fee2e2',
        color: '#991b1b'
    }
});

const getConfidenceStyle = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
        case 'high': return [styles.confidenceBadge, styles.confidenceHigh];
        case 'medium': return [styles.confidenceBadge, styles.confidenceMedium];
        case 'low': return [styles.confidenceBadge, styles.confidenceLow];
    }
};

export const TaxRiskReportPDF = ({ companyName, period, taxAtRisk, generatedDate }: TaxRiskReportData) => (
    <Document>
        {/* Page 1: Executive Summary */}
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Tax Risk Report</Text>
                <Text style={styles.subtitle}>{companyName}</Text>
                <Text style={styles.date}>Period: {period}</Text>
            </View>

            <View style={styles.summaryCard}>
                <Text style={styles.largeAmount}>₦{taxAtRisk.totalAtRisk.toLocaleString()}</Text>
                <Text style={styles.label}>TOTAL TAX AT RISK</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Executive Summary</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Compliance Issues</Text>
                        <Text style={styles.statValue}>{taxAtRisk.progressMetrics.totalIssues}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Resolved</Text>
                        <Text style={styles.statValue}>{taxAtRisk.progressMetrics.resolvedIssues}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Progress</Text>
                        <Text style={styles.statValue}>{Math.round(taxAtRisk.progressMetrics.percentageResolved)}%</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Severity</Text>
                        <Text style={styles.statValue}>{taxAtRisk.severityLevel.toUpperCase()}</Text>
                    </View>
                </View>
            </View>

            {/* Legal Disclaimer */}
            <View style={styles.disclaimer}>
                <Text style={styles.disclaimerTitle}>⚠️ IMPORTANT DISCLAIMER</Text>
                <Text style={styles.disclaimerText}>
                    Tax estimates are based on provided records and uploaded evidence. Actual tax liability may vary. Upload additional documentation to increase confidence and accuracy. Consult a qualified tax professional for final determination. This report is for informational purposes only and does not constitute professional tax advice.
                </Text>
            </View>

            <View style={styles.footer}>
                <Text>Generated by DEAP Tax Compliance System</Text>
                <Text>{generatedDate}</Text>
                <Text>Page 1</Text>
            </View>
        </Page>

        {/* Page 2: Tax at Risk Breakdown */}
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Tax at Risk Breakdown</Text>
                <Text style={styles.subtitle}>{companyName}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Breakdown by Issue Category</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.tableCellBold}>Category</Text>
                        <Text style={styles.tableCellBold}>Disallowed</Text>
                        <Text style={styles.tableCellBold}>Tax at Risk</Text>
                        <Text style={styles.tableCellBold}>Evidence</Text>
                        <Text style={styles.tableCellBold}>Confidence</Text>
                    </View>
                    {taxAtRisk.breakdown.map((item, idx) => (
                        <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                            <Text style={styles.tableCell}>{item.category}</Text>
                            <Text style={styles.tableCell}>₦{item.disallowedAmount.toLocaleString()}</Text>
                            <Text style={styles.tableCellRed}>₦{item.taxAtRisk.toLocaleString()}</Text>
                            <Text style={styles.tableCell}>{item.documentCount}/{item.affectedTransactions.length}</Text>
                            <View style={getConfidenceStyle(item.confidenceLevel)}>
                                <Text>{item.confidenceLevel.toUpperCase()}</Text>
                            </View>
                        </View>
                    ))}
                </View>
            </View>

            {taxAtRisk.estimatedPenalties > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Additional Penalties</Text>
                    <Text style={styles.recommendationText}>
                        Estimated penalties for late WHT remittance: ₦{taxAtRisk.estimatedPenalties.toLocaleString()}
                    </Text>
                </View>
            )}

            <View style={styles.footer}>
                <Text>Generated by DEAP Tax Compliance System</Text>
                <Text>{generatedDate}</Text>
                <Text>Page 2</Text>
            </View>
        </Page>

        {/* Page 3: Before/After Comparison */}
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Tax Liability Comparison</Text>
                <Text style={styles.subtitle}>{companyName}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Before vs After Optimization</Text>

                <View style={styles.comparisonBox}>
                    <View style={[styles.comparisonItem, styles.comparisonCurrent]}>
                        <Text style={styles.comparisonLabel}>Current Tax Liability</Text>
                        <Text style={[styles.comparisonAmount, { color: '#dc2626' }]}>
                            ₦{taxAtRisk.currentTaxLiability.toLocaleString()}
                        </Text>
                    </View>

                    <View style={[styles.comparisonItem, styles.comparisonOptimized]}>
                        <Text style={styles.comparisonLabel}>Optimized Tax Liability</Text>
                        <Text style={[styles.comparisonAmount, { color: '#059669' }]}>
                            ₦{taxAtRisk.potentialTaxLiability.toLocaleString()}
                        </Text>
                    </View>
                </View>

                <View style={styles.savingsBox}>
                    <Text style={styles.savingsAmount}>
                        ₦{(taxAtRisk.potentialTaxLiability - taxAtRisk.currentTaxLiability).toLocaleString()}
                    </Text>
                    <Text style={styles.savingsLabel}>ADDITIONAL TAX IF ISSUES NOT RESOLVED</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Impact Analysis</Text>
                <Text style={styles.recommendationText}>
                    • Resolving all compliance issues will prevent ₦{taxAtRisk.totalAtRisk.toLocaleString()} in additional tax liability
                </Text>
                <Text style={styles.recommendationText}>
                    • Current compliance progress: {Math.round(taxAtRisk.progressMetrics.percentageResolved)}% of issues resolved
                </Text>
                <Text style={styles.recommendationText}>
                    • Remaining issues: {taxAtRisk.progressMetrics.totalIssues} transactions requiring attention
                </Text>
            </View>

            <View style={styles.footer}>
                <Text>Generated by DEAP Tax Compliance System</Text>
                <Text>{generatedDate}</Text>
                <Text>Page 3</Text>
            </View>
        </Page>

        {/* Page 4+: Detailed Recommendations */}
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>Detailed Recommendations</Text>
                <Text style={styles.subtitle}>{companyName}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Action Items by Priority</Text>

                {taxAtRisk.breakdown.map((item, idx) => (
                    <View key={idx} style={styles.recommendationCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={styles.recommendationTitle}>{item.category} Issues</Text>
                            <View style={styles.priorityBadge}>
                                <Text>HIGH PRIORITY</Text>
                            </View>
                        </View>

                        <Text style={styles.recommendationText}>
                            <Text style={{ fontWeight: 'bold' }}>Issue: </Text>
                            {item.actionableInsight}
                        </Text>

                        <Text style={styles.recommendationText}>
                            <Text style={{ fontWeight: 'bold' }}>Tax Impact: </Text>
                            ₦{item.taxAtRisk.toLocaleString()}
                        </Text>

                        <Text style={styles.recommendationText}>
                            <Text style={{ fontWeight: 'bold' }}>Affected Transactions: </Text>
                            {item.affectedTransactions.length} transaction(s)
                        </Text>

                        <Text style={styles.recommendationText}>
                            <Text style={{ fontWeight: 'bold' }}>Recommended Action: </Text>
                            {item.category === 'Documentation' && 'Upload missing receipts and supporting documents'}
                            {item.category === 'Allowability' && 'Reclassify personal expenses or remove non-allowable items'}
                            {item.category === 'VAT' && 'Obtain and upload VAT invoices from suppliers'}
                            {item.category === 'WHT' && 'Request WHT certificates from vendors'}
                        </Text>
                    </View>
                ))}
            </View>

            <View style={styles.footer}>
                <Text>Generated by DEAP Tax Compliance System</Text>
                <Text>{generatedDate}</Text>
                <Text>Page 4</Text>
            </View>
        </Page>
    </Document>
);
