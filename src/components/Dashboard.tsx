import type { StatementSummary, Transaction } from '../engine/types';

export function Dashboard({ summary, transactions, onNavigate }: { summary: StatementSummary | null, transactions: Transaction[], onNavigate: (view: string) => void }) {

    if (!summary) {
        return (
            <div style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>Welcome to DEAP</h2>
                <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '2.5rem' }}>Simplified Nigerian Tax Compliance for Modern Businesses.</p>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ padding: '2rem', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', maxWidth: '400px', width: '100%' }} onClick={() => onNavigate('settings')}>
                        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🏢</span>
                        <h3 style={{ margin: '0 0 0.5rem', color: '#334155' }}>Create Company / Profile</h3>
                        <p style={{ color: '#94a3b8', margin: 0 }}>Set up your profile and tax details.</p>
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

    // Recent Activity (Last 5 transactions)
    const recentActivity = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Business at a Glance</h2>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => onNavigate('upload')} style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: '600', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📂</span> Upload
                    </button>
                    <button onClick={() => onNavigate('reports')} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', border: 'none', borderRadius: '6px', fontWeight: '600', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📑</span> Reports
                    </button>
                </div>
            </div>

            {/* Top Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <SummaryCard title="Total Revenue" value={`₦${totalIncome.toLocaleString()}`} color="#10b981" icon="💰" />
                <SummaryCard title="Total Expenses" value={`₦${totalExpenses.toLocaleString()}`} color="#ef4444" icon="💸" />
                <SummaryCard title="Est. Tax Liability" value={`₦${estTaxLiability.toLocaleString()}`} color="#f59e0b" subtitle="Based on 30% CIT Rate" icon="🏛️" />
                <SummaryCard title="Net Profit" value={`₦${netIncome.toLocaleString()}`} color={netIncome >= 0 ? "#6366f1" : "#ef4444"} subtitle="Before Tax" icon="📊" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>

                {/* Left Column: Activity & Alerts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Tax Status */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#334155', marginBottom: '1rem' }}>Compliance Status</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <StatusCard title="PIT Filing" status="Review Needed" statusColor="orange" onClick={() => onNavigate('tax_pit')} />
                            <StatusCard title="CIT Filing" status="Incomplete" statusColor="red" onClick={() => onNavigate('tax_cit')} />
                            <StatusCard title="CGT Filing" status="Review Needed" statusColor="orange" onClick={() => onNavigate('tax_cgt')} />
                            <StatusCard title="VAT Filing" status="Due Soon" statusColor="orange" onClick={() => onNavigate('tax_vat')} />
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#334155', marginBottom: '1rem' }}>Recent Activity</h3>
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            {recentActivity.length > 0 ? (
                                recentActivity.map(t => (
                                    <div key={t.id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: t.amount > 0 ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.amount > 0 ? '#166534' : '#991b1b', fontSize: '1.2rem', flexShrink: 0 }}>
                                                {t.amount > 0 ? '↙' : '↗'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.95rem' }}>{t.description}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(t.date).toLocaleDateString()} • {t.category_name || 'Uncategorized'}</div>
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 'bold', color: t.amount > 0 ? '#10b981' : '#1e293b' }}>
                                            {t.amount > 0 ? '+' : ''}₦{Math.abs(t.amount).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No recent activity found.</div>
                            )}
                            <div
                                onClick={() => onNavigate('transactions')}
                                style={{ padding: '0.75rem', textAlign: 'center', background: '#f8fafc', color: '#64748b', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', borderTop: '1px solid #e2e8f0' }}
                            >
                                View All Transactions →
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Alerts & Quick Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Action Items */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#334155', marginBottom: '1rem' }}>Action Items</h3>
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            {summary.transaction_count > 0 && <AlertItem text={`${summary.transaction_count} Uncategorised transactions`} action="Fix" onClick={() => onNavigate('transactions')} />}
                            <AlertItem text="Director's Loan Account reconciliation" action="Review" onClick={() => onNavigate('analysis_dla')} />
                            <AlertItem text="Expense Checklist incomplete" action="Complete" onClick={() => onNavigate('expense_checklist')} />
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div style={{ background: '#f0f9ff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                        <h4 style={{ margin: '0 0 0.5rem', color: '#0369a1', fontSize: '1rem', fontWeight: 'bold' }}>Did you know?</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#0c4a6e', lineHeight: '1.5' }}>
                            You can tag transactions as "Personal" to automatically exclude them from tax calculations. Check the "Smart Ledger" for details.
                        </p>
                    </div>

                </div>

            </div>
        </div>
    );
}

function SummaryCard({ title, value, color, subtitle, icon }: { title: string, value: string, color: string, subtitle?: string, icon?: string }) {
    return (
        <div className="glass-panel" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600', margin: 0 }}>{title}</p>
                {icon && <span style={{ fontSize: '1.5rem', opacity: 0.8 }}>{icon}</span>}
            </div>
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: color, margin: 0 }}>{value}</p>
            {subtitle && <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', margin: 0 }}>{subtitle}</p>}
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
        <div onClick={onClick} className="glass-panel" style={{ background: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: onClick ? 'pointer' : 'default' }}>
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
