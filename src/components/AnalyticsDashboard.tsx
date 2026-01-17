import { useMemo } from 'react';
// TEMPORARY: Recharts imports commented out until package is installed
// Uncomment these after running: npm install recharts
/*
import {
    LineChart, Line, AreaChart, Area, PieChart, Pie, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
*/
import type { Transaction, StatementSummary } from '../engine/types';
import {
    calculateFinancialHealth,
    getHealthRating
} from '../engine/financialHealth';

interface AnalyticsDashboardProps {
    summary: StatementSummary;
    transactions: Transaction[];
    companyName?: string;
}

// DateRange type will be used when recharts is installed
// type DateRange = '30d' | '90d' | '6m' | '1y' | 'all';

export function AnalyticsDashboard({ summary, transactions }: AnalyticsDashboardProps) {

    // Calculate financial health
    const healthScore = useMemo(() =>
        calculateFinancialHealth(summary, transactions),
        [summary, transactions]
    );

    // Insights will be used when recharts is installed
    // const insights = useMemo(() =>
    //     generateHealthInsights(healthScore, summary, transactions),
    //     [healthScore, summary, transactions]
    // );

    const rating = getHealthRating(healthScore.overall);

    // These will be used when recharts is installed
    // const [dateRange, setDateRange] = useState<DateRange>('6m');
    // const filteredTransactions = useMemo(() => { ... }, [transactions, dateRange]);
    // const monthlyData = useMemo(() => { ... }, [filteredTransactions]);
    // const expenseBreakdown = useMemo(() => { ... }, [filteredTransactions]);
    // const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    // TEMPORARY: Show installation message until recharts is installed
    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            <div style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                borderRadius: '16px',
                padding: '3rem',
                color: 'white',
                textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    📊 Analytics Dashboard
                </h1>
                <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
                    Interactive charts and financial insights
                </p>

                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '2rem',
                    marginTop: '2rem',
                    backdropFilter: 'blur(10px)'
                }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚙️ Installation Required</h2>
                    <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                        To use the Analytics Dashboard, please install the required dependency:
                    </p>

                    <div style={{
                        background: '#1e293b',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '1rem',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ marginBottom: '0.5rem', color: '#10b981' }}>
                            # Run PowerShell as Administrator
                        </div>
                        <div style={{ marginBottom: '0.5rem', color: '#f59e0b' }}>
                            Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
                        </div>
                        <div style={{ marginBottom: '0.5rem', color: '#3b82f6' }}>
                            cd c:\Users\Inspiron\OneDrive\Desktop\workpalace\deab7
                        </div>
                        <div style={{ color: '#ec4899' }}>
                            npm install recharts
                        </div>
                    </div>

                    <p style={{ fontSize: '0.95rem', opacity: 0.9 }}>
                        After installation, refresh the page to see your analytics dashboard with:
                    </p>
                    <ul style={{
                        listStyle: 'none',
                        padding: 0,
                        marginTop: '1rem',
                        display: 'grid',
                        gap: '0.5rem'
                    }}>
                        <li>📈 Revenue vs Expenses Trends</li>
                        <li>🥧 Expense Breakdown by Category</li>
                        <li>💰 Monthly Profit Analysis</li>
                        <li>🎯 Financial Health Score (0-100)</li>
                        <li>💡 Automated Insights & Recommendations</li>
                    </ul>
                </div>

                <div style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8 }}>
                    Current Financial Health Score: <strong>{healthScore.overall}/100</strong> - {rating.label}
                </div>
            </div>
        </div>
    );
}

// These component functions will be used when recharts is installed
/*
function ScoreBar({ label, score, weight }: { label: string; score: number; weight: string }) {
    const getColor = (s: number) => {
        if (s >= 80) return '#10b981';
        if (s >= 60) return '#3b82f6';
        if (s >= 40) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span>{label} <span style={{ opacity: 0.7 }}>({weight})</span></span>
                <span style={{ fontWeight: 'bold' }}>{score}/100</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                    width: `${score}%`,
                    height: '100%',
                    background: getColor(score),
                    borderRadius: '99px',
                    transition: 'width 0.5s ease'
                }} />
            </div>
        </div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>
                {title}
            </h3>
            {children}
        </div>
    );
}

function InsightCard({ insight }: { insight: { category: string; message: string; severity: string; recommendation?: string } }) {
    const getStyles = (severity: string) => {
        switch (severity) {
            case 'positive':
                return { bg: '#dcfce7', border: '#10b981', text: '#166534', icon: '✅' };
            case 'warning':
                return { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '⚠️' };
            case 'critical':
                return { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: '🚨' };
            default:
                return { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569', icon: 'ℹ️' };
        }
    };

    const styles = getStyles(insight.severity);

    return (
        <div style={{
            background: styles.bg,
            border: `1px solid ${styles.border}`,
            borderLeft: `4px solid ${styles.border}`,
            borderRadius: '8px',
            padding: '1rem 1.5rem'
        }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                <span style={{ fontSize: '1.5rem' }}>{styles.icon}</span>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: styles.text, marginBottom: '0.25rem' }}>
                        {insight.category}
                    </div>
                    <div style={{ color: styles.text, fontSize: '0.95rem', marginBottom: insight.recommendation ? '0.5rem' : 0 }}>
                        {insight.message}
                    </div>
                    {insight.recommendation && (
                        <div style={{ color: styles.text, fontSize: '0.9rem', opacity: 0.9, fontStyle: 'italic' }}>
                            💡 {insight.recommendation}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
*/
