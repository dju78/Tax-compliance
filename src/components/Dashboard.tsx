import { StatementSummary } from '../engine/types';

interface DashboardProps {
    summary: StatementSummary | null;
}

export function Dashboard({ summary, onNavigate }: { summary: StatementSummary | null, onNavigate: (view: string) => void }) {

    if (!summary) {
        return (
            <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>Welcome to DEAP</h2>
                <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '2.5rem' }}>Simplified Nigerian Tax Compliance for Modern Businesses.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div style={{ padding: '2rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => onNavigate('settings')}>
                        <span style={{ fontSize: '3rem' }}>🏢</span>
                        <h3 style={{ margin: '1rem 0 0.5rem' }}>1. Create Company</h3>
                        <p style={{ color: '#94a3b8' }}>Set up your profile and tax details.</p>
                    </div>

                    <div style={{ padding: '2rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => onNavigate('upload')}>
                        <span style={{ fontSize: '3rem' }}>📂</span>
                        <h3 style={{ margin: '1rem 0 0.5rem' }}>2. Upload Data</h3>
                        <p style={{ color: '#94a3b8' }}>Import bank statements to begin.</p>
                    </div>
                </div>
            </div>
        )
    }

    const totalIncome = summary.total_inflow;
    const totalExpenses = summary.total_outflow;
    const netIncome = summary.net_cash_flow;

    // Rough Estimates
    const estTaxLiability = Math.max(0, netIncome * 0.3); // 30% CIT placeholder
    const effectiveTaxRate = totalIncome > 0 ? (estTaxLiability / totalIncome) * 100 : 0;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>Compliance Overview</h2>

            {/* Top Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <SummaryCard title="Total Income" value={`₦${totalIncome.toLocaleString()}`} color="#10b981" />
                <SummaryCard title="Total Expenses" value={`₦${totalExpenses.toLocaleString()}`} color="#ef4444" />
                <SummaryCard title="Est. Tax Liability" value={`₦${estTaxLiability.toLocaleString()}`} color="#f59e0b" subtitle="Based on 30% CIT Rate" />
                <SummaryCard title="Effective Tax Rate" value={`${effectiveTaxRate.toFixed(1)}%`} color="#6366f1" subtitle="Of Gross Income" />
            </div>

            {/* Middle Section: Tax Status */}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#334155', marginBottom: '1rem' }}>Tax Filing Status</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <StatusCard title="Personal Income Tax (PIT)" status="Needs Review" statusColor="orange" onClick={() => onNavigate('tax_pit')} />
                <StatusCard title="Company Income Tax (CIT)" status="Incomplete Data" statusColor="red" onClick={() => onNavigate('tax_cit')} />
                <StatusCard title="Value Added Tax (VAT)" status="Filing Due Soon" statusColor="orange" onClick={() => onNavigate('tax_vat')} />
            </div>

            {/* Bottom Section: Alerts */}
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#334155', marginBottom: '1rem' }}>Alerts & Action Items</h3>
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <AlertItem text={`${summary.transaction_count} Uncategorised transactions detected.`} action="Categorize Now" onClick={() => onNavigate('transactions')} />
                <AlertItem text="Director's Loan Account requires reconciliation." action="Review Ledger" onClick={() => onNavigate('analysis_dla')} />
            </div>

        </div>
    );
}

function SummaryCard({ title, value, color, subtitle }: { title: string, value: string, color: string, subtitle?: string }) {
    return (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem' }}>{title}</p>
            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: color }}>{value}</p>
            {subtitle && <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>{subtitle}</p>}
        </div>
    );
}

function StatusCard({ title, status, statusColor, onClick }: { title: string, status: string, statusColor: string, onClick?: () => void }) {
    const colors: Record<string, string> = {
        green: '#dcfce7', textGreen: '#166534',
        orange: '#ffedd5', textOrange: '#c2410c',
        red: '#fee2e2', textRed: '#dc2626',
        gray: '#f1f5f9', textGray: '#475569'
    };

    const bg = colors[statusColor] || colors.gray;
    const tx = colors['text' + statusColor.charAt(0).toUpperCase() + statusColor.slice(1)] || colors.textGray;

    return (
        <div onClick={onClick} style={{ background: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: onClick ? 'pointer' : 'default' }}>
            <span style={{ fontWeight: '600', color: '#334155' }}>{title}</span>
            <span style={{ background: bg, color: tx, padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {status}
            </span>
        </div>
    );
}

function AlertItem({ text, action, onClick }: { text: string, action: string, onClick?: () => void }) {
    return (
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#475569' }}>⚠️ {text}</span>
            <button onClick={onClick} style={{ color: 'var(--color-primary)', background: 'none', border: 'none', fontWeight: '600', cursor: 'pointer' }}>{action} →</button>
        </div>
    )
}
