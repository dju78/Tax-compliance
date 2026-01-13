import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabase';
import type { Transaction } from '../engine/types';
import { calculateTaxAtRisk, type TaxAtRiskResult } from '../engine/taxSavings';

export function TaxAtRiskWidget({ companyId }: { companyId: string }) {
    const [taxRisk, setTaxRisk] = useState<TaxAtRiskResult | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        loadTaxRisk();
    }, [companyId]);

    const loadTaxRisk = async () => {
        setLoading(true);
        try {
            const { data } = await supabase.from('transactions')
                .select('*')
                .eq('company_id', companyId);

            if (data) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const txns = data as any[] as Transaction[];
                const risk = calculateTaxAtRisk(txns);
                setTaxRisk(risk);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getSeverityConfig = (severity: 'low' | 'medium' | 'high' | 'critical') => {
        switch (severity) {
            case 'critical':
                return { gradient: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)', icon: '🚨' };
            case 'high':
                return { gradient: 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)', icon: '⚠️' };
            case 'medium':
                return { gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', icon: '⚡' };
            case 'low':
                return { gradient: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)', icon: '💡' };
        }
    };

    if (loading) {
        return (
            <div style={{
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                textAlign: 'center',
                color: '#64748b'
            }}>
                Loading tax risk data...
            </div>
        );
    }

    if (!taxRisk || taxRisk.totalAtRisk === 0) {
        return (
            <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                color: 'white'
            }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>No Tax Risk Detected</h3>
                <p style={{ opacity: 0.9 }}>Your compliance is on track!</p>
            </div>
        );
    }

    const severityConfig = getSeverityConfig(taxRisk.severityLevel);

    return (
        <div className="glass-panel" style={{
            background: severityConfig.gradient,
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            color: 'white',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                {/* Left: Amount at Risk */}
                <div style={{ flex: '1', minWidth: '200px' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        {severityConfig.icon} Tax at Risk
                    </div>
                    <div style={{ fontSize: '3.5rem', fontWeight: 'bold', lineHeight: '1.2' }}>
                        ₦{taxRisk.totalAtRisk.toLocaleString()}
                    </div>
                    <p style={{ opacity: 0.9, marginTop: '0.5rem', fontSize: '0.95rem' }}>
                        {taxRisk.progressMetrics.totalIssues} compliance issue{taxRisk.progressMetrics.totalIssues !== 1 ? 's' : ''} found
                    </p>
                </div>

                {/* Right: Progress Indicator */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'conic-gradient(white 0%, white ' + taxRisk.progressMetrics.percentageResolved + '%, rgba(255,255,255,0.3) ' + taxRisk.progressMetrics.percentageResolved + '%, rgba(255,255,255,0.3) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        position: 'relative',
                        margin: '0 auto'
                    }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: severityConfig.gradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {Math.round(taxRisk.progressMetrics.percentageResolved)}%
                        </div>
                    </div>
                    <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', opacity: 0.9 }}>
                        {taxRisk.progressMetrics.resolvedIssues} of {taxRisk.progressMetrics.resolvedIssues + taxRisk.progressMetrics.totalIssues} Resolved
                    </p>
                </div>
            </div>

            {/* Action Button - Only show if not already on compliance page */}
            {!location.pathname.includes('/compliance') && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('🔍 Tax at Risk button clicked!');
                        console.log('Current path:', location.pathname);
                        // Determine prefix based on current path
                        const pathParts = location.pathname.split('/');
                        const prefix = pathParts[1] === 'personal' ? '/personal' : `/companies/${companyId}`;
                        const targetPath = `${prefix}/compliance`;
                        console.log('Navigating to:', targetPath);
                        navigate(targetPath);
                    }}
                    style={{
                        display: 'inline-block',
                        marginTop: '1.5rem',
                        padding: '0.875rem 2rem',
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        borderRadius: '8px',
                        fontWeight: '600',
                        border: '2px solid white',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
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
                    View Full Analysis & Fix Issues →
                </button>
            )}
        </div>
    );
}
