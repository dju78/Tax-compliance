import type { AuditResult } from '../engine/auditRisk';

interface AuditRiskReportProps {
    result: AuditResult;
}

export function AuditRiskReport({ result }: AuditRiskReportProps) {
    const { score, level, warnings, riskDrivers, suggestions } = result;

    const getColor = (level: string) => {
        switch (level) {
            case 'LOW': return '#22c55e'; // Green
            case 'MEDIUM': return '#eab308'; // Yellow/Orange
            case 'HIGH': return '#ef4444'; // Red
            default: return '#94a3b8';
        }
    };

    const color = getColor(level);

    return (
        <div className="glass-panel" style={{ background: 'white', borderRadius: '12px', border: `1px solid ${color}`, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ padding: '1.5rem', background: `${color}10`, borderBottom: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Audit Risk Report</h3>
                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>FIRS Compliance Probability</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '800', color: color }}>
                        {level} RISK
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b' }}>
                        Score: {score}/100
                    </div>
                </div>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Risk Drivers */}
                {riskDrivers.length > 0 && (
                    <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#475569', textTransform: 'uppercase', marginBottom: '0.75rem' }}>⚠️ Main Risk Drivers</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {riskDrivers.map((driver, idx) => (
                                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', color: '#334155' }}>
                                    <span style={{ color: '#ef4444' }}>•</span> {driver}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Warnings (Disallowed Items) */}
                {warnings.length > 0 && (
                    <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#dc2626', textTransform: 'uppercase', marginBottom: '0.75rem' }}>🚫 Compliance Warnings</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {warnings.map((warning, idx) => (
                                <div key={idx} style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '6px', fontSize: '0.9rem', color: '#b91c1c' }}>
                                    {warning}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                    <div>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#15803d', textTransform: 'uppercase', marginBottom: '0.75rem' }}>💡 Suggested Fixes</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {suggestions.map((suggestion, idx) => (
                                <div key={idx} style={{ padding: '0.75rem', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '6px', fontSize: '0.9rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>✅</span> {suggestion}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {riskDrivers.length === 0 && warnings.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#64748b', fontStyle: 'italic' }}>
                        No major audit risks detected based on current inputs.
                    </div>
                )}
            </div>
        </div>
    );
}
