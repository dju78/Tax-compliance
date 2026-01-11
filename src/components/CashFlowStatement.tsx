import type { Transaction } from '../engine/types';

interface Props {
    transactions: Transaction[];
}

export function CashFlowStatement({ transactions }: Props) {
    // Simple categorization Logic
    const categorize = (t: Transaction) => {
        const desc = t.description.toLowerCase();
        if (desc.includes('equity') || desc.includes('loan') || desc.includes('capital')) return 'financing';
        if (desc.includes('asset') || desc.includes('equipment') || desc.includes('property') || desc.includes('vehicle')) return 'investing';
        return 'operating';
    };

    const activities = {
        operating: [] as Transaction[],
        investing: [] as Transaction[],
        financing: [] as Transaction[]
    };

    transactions.forEach(t => {
        activities[categorize(t)].push(t);
    });

    const sumNet = (txns: Transaction[]) => {
        return txns.reduce((acc, t) => acc + (t.type === 'credit' ? t.amount : -t.amount), 0);
    };

    const netOperating = sumNet(activities.operating);
    const netInvesting = sumNet(activities.investing);
    const netFinancing = sumNet(activities.financing);
    const netCashChange = netOperating + netInvesting + netFinancing;



    return (
        <div className="card" style={{ marginTop: '1rem', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Statement of Cash Flows (IAS 7)</h3>

            <Section title="Operating Activities" txns={activities.operating} net={netOperating} />
            <Section title="Investing Activities" txns={activities.investing} net={netInvesting} />
            <Section title="Financing Activities" txns={activities.financing} net={netFinancing} />

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>Net Increase / (Decrease) in Cash</strong>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: netCashChange >= 0 ? '#10b981' : '#ef4444' }}>
                    ₦{netCashChange.toLocaleString()}
                </span>
            </div>
        </div>
    );
}

const Section = ({ title, txns, net }: { title: string, txns: Transaction[], net: number }) => (
    <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{title}</h4>
        {txns.length === 0 ? (
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontStyle: 'italic' }}>No transactions</p>
        ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {txns.map(t => (
                    <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.25rem 0', borderBottom: '1px dashed #f1f5f9' }}>
                        <span>{t.description}</span>
                        <span style={{ color: t.type === 'credit' ? '#10b981' : '#ef4444' }}>
                            {t.type === 'credit' ? '+' : '-'} ₦{t.amount.toLocaleString()}
                        </span>
                    </li>
                ))}
            </ul>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontWeight: 'bold', fontSize: '0.95rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
            <span>Net Cash from {title}</span>
            <span style={{ color: net >= 0 ? '#334155' : '#ef4444' }}>₦{net.toLocaleString()}</span>
        </div>
    </div>
);
