import { useState, useEffect } from 'react';

// Types
interface ComplianceItem {
    id: string;
    type: 'PAYE' | 'PENCOM' | 'CAC' | 'NSITF' | 'NHF' | 'ITF';
    title: string;
    description: string;
    frequency: 'monthly' | 'quarterly' | 'annual';
    nextDueDate: Date;
    lastFiledDate?: Date;
    status: 'COMPLIANT' | 'DUE_SOON' | 'OVERDUE' | 'NOT_APPLICABLE';
    amount?: number;
    reference?: string;
    notes?: string;
}

interface ComplianceTrackerProps {
    companyId?: string;
    isPersonal?: boolean;
}

export function ComplianceTracker({ companyId, isPersonal }: ComplianceTrackerProps) {
    const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
    const [selectedType, setSelectedType] = useState<string>('ALL');

    useEffect(() => {
        // Initialize compliance items with Nigerian regulatory requirements
        const items = generateComplianceItems(isPersonal);
        setComplianceItems(items);
    }, [isPersonal]);

    const getStatusColor = (status: ComplianceItem['status']) => {
        switch (status) {
            case 'COMPLIANT': return '#10b981';
            case 'DUE_SOON': return '#f59e0b';
            case 'OVERDUE': return '#ef4444';
            case 'NOT_APPLICABLE': return '#9ca3af';
            default: return '#64748b';
        }
    };

    const getStatusIcon = (status: ComplianceItem['status']) => {
        switch (status) {
            case 'COMPLIANT': return '✅';
            case 'DUE_SOON': return '⚠️';
            case 'OVERDUE': return '🚨';
            case 'NOT_APPLICABLE': return '➖';
            default: return '❓';
        }
    };

    const getDaysUntilDue = (dueDate: Date) => {
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const filteredItems = selectedType === 'ALL'
        ? complianceItems
        : complianceItems.filter(item => item.type === selectedType);

    const overdueCount = complianceItems.filter(i => i.status === 'OVERDUE').length;
    const dueSoonCount = complianceItems.filter(i => i.status === 'DUE_SOON').length;

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
                    🇳🇬 Compliance Tracker
                </h1>
                <p style={{ color: '#64748b' }}>
                    Track Nigerian regulatory deadlines and stay compliant
                </p>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{
                    background: overdueCount > 0 ? '#fef2f2' : '#f0fdf4',
                    border: `2px solid ${overdueCount > 0 ? '#fecaca' : '#bbf7d0'}`,
                    borderRadius: '12px',
                    padding: '1.5rem'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        {overdueCount > 0 ? '🚨' : '✅'}
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: overdueCount > 0 ? '#dc2626' : '#16a34a' }}>
                        {overdueCount}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Overdue Items</div>
                </div>

                <div style={{
                    background: '#fef3c7',
                    border: '2px solid #fde68a',
                    borderRadius: '12px',
                    padding: '1.5rem'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d97706' }}>
                        {dueSoonCount}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Due Soon (30 days)</div>
                </div>

                <div style={{
                    background: '#eff6ff',
                    border: '2px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '1.5rem'
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' }}>
                        {complianceItems.filter(i => i.status !== 'NOT_APPLICABLE').length}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Active Requirements</div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {['ALL', 'PAYE', 'PENCOM', 'CAC', 'NSITF', 'NHF', 'ITF'].map(type => (
                    <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: selectedType === type ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                            background: selectedType === type ? '#eff6ff' : 'white',
                            color: selectedType === type ? '#1e40af' : '#64748b',
                            cursor: 'pointer',
                            fontWeight: selectedType === type ? 'bold' : 'normal'
                        }}
                    >
                        {type}
                    </button>
                ))}
            </div>

            {/* Compliance Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredItems.map(item => {
                    const daysUntil = getDaysUntilDue(item.nextDueDate);

                    return (
                        <div
                            key={item.id}
                            style={{
                                background: 'white',
                                border: `2px solid ${getStatusColor(item.status)}`,
                                borderRadius: '12px',
                                padding: '1.5rem',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '1.5rem' }}>{getStatusIcon(item.status)}</span>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                                            {item.title}
                                        </h3>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '12px',
                                            background: '#f1f5f9',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            color: '#64748b'
                                        }}>
                                            {item.type}
                                        </span>
                                    </div>
                                    <p style={{ color: '#64748b', margin: '0.5rem 0' }}>{item.description}</p>
                                </div>

                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '8px',
                                    background: getStatusColor(item.status) + '20',
                                    textAlign: 'center',
                                    minWidth: '120px'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                        {item.status === 'OVERDUE' ? 'OVERDUE BY' : 'DUE IN'}
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getStatusColor(item.status) }}>
                                        {Math.abs(daysUntil)} days
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Frequency</div>
                                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                                        {item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Next Due Date</div>
                                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                                        {item.nextDueDate.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </div>
                                </div>
                                {item.lastFiledDate && (
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Last Filed</div>
                                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                                            {item.lastFiledDate.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                )}
                                {item.reference && (
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Reference</div>
                                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{item.reference}</div>
                                    </div>
                                )}
                            </div>

                            {item.notes && (
                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>Notes</div>
                                    <div style={{ fontSize: '0.9rem', color: '#475569' }}>{item.notes}</div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {filteredItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>No compliance items</div>
                    <div>No {selectedType === 'ALL' ? '' : selectedType} compliance requirements found</div>
                </div>
            )}
        </div>
    );
}

// Helper function to generate compliance items
function generateComplianceItems(isPersonal?: boolean): ComplianceItem[] {
    const today = new Date();
    const items: ComplianceItem[] = [];

    if (!isPersonal) {
        // PAYE - Monthly (Due 21st of following month)
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 21);
        items.push({
            id: 'paye-monthly',
            type: 'PAYE',
            title: 'PAYE Remittance',
            description: 'Monthly Pay-As-You-Earn tax remittance to FIRS. Due on the 21st of the following month.',
            frequency: 'monthly',
            nextDueDate: nextMonth,
            status: getDaysUntilDue(nextMonth) < 0 ? 'OVERDUE' : getDaysUntilDue(nextMonth) <= 30 ? 'DUE_SOON' : 'COMPLIANT',
            notes: 'Submit monthly PAYE returns and remit deductions to FIRS'
        });

        // PenCom - Quarterly
        const nextQuarter = getNextQuarterEnd();
        items.push({
            id: 'pencom-quarterly',
            type: 'PENCOM',
            title: 'PenCom Pension Contribution',
            description: 'Quarterly pension contribution remittance (8% employer + 10% employee).',
            frequency: 'quarterly',
            nextDueDate: nextQuarter,
            status: getDaysUntilDue(nextQuarter) < 0 ? 'OVERDUE' : getDaysUntilDue(nextQuarter) <= 30 ? 'DUE_SOON' : 'COMPLIANT',
            notes: 'Remit pension contributions to approved PFA within 7 days of month end'
        });

        // CAC - Annual
        const nextYear = new Date(today.getFullYear() + 1, 0, 31); // January 31st
        items.push({
            id: 'cac-annual',
            type: 'CAC',
            title: 'CAC Annual Returns',
            description: 'Corporate Affairs Commission annual returns filing.',
            frequency: 'annual',
            nextDueDate: nextYear,
            status: getDaysUntilDue(nextYear) < 0 ? 'OVERDUE' : getDaysUntilDue(nextYear) <= 60 ? 'DUE_SOON' : 'COMPLIANT',
            notes: 'File annual returns within 18 months of incorporation or last filing'
        });

        // NSITF - Annual
        const nsitfDue = new Date(today.getFullYear(), 11, 31); // December 31st
        items.push({
            id: 'nsitf-annual',
            type: 'NSITF',
            title: 'NSITF Contribution',
            description: 'Nigeria Social Insurance Trust Fund - Employee Compensation Scheme (1% of total payroll).',
            frequency: 'annual',
            nextDueDate: nsitfDue,
            status: getDaysUntilDue(nsitfDue) < 0 ? 'OVERDUE' : getDaysUntilDue(nsitfDue) <= 60 ? 'DUE_SOON' : 'COMPLIANT',
            notes: 'Annual contribution for employee compensation insurance'
        });

        // NHF - Monthly
        const nhfDue = new Date(today.getFullYear(), today.getMonth() + 1, 7);
        items.push({
            id: 'nhf-monthly',
            type: 'NHF',
            title: 'NHF Contribution',
            description: 'National Housing Fund - 2.5% of basic salary for employees earning above ₦3,000/month.',
            frequency: 'monthly',
            nextDueDate: nhfDue,
            status: getDaysUntilDue(nhfDue) < 0 ? 'OVERDUE' : getDaysUntilDue(nhfDue) <= 30 ? 'DUE_SOON' : 'COMPLIANT',
            notes: 'Deduct and remit 2.5% of basic salary monthly'
        });

        // ITF - Annual
        const itfDue = new Date(today.getFullYear(), 2, 31); // March 31st
        items.push({
            id: 'itf-annual',
            type: 'ITF',
            title: 'ITF Contribution',
            description: 'Industrial Training Fund - 1% of annual payroll for companies with 5+ employees.',
            frequency: 'annual',
            nextDueDate: itfDue,
            status: getDaysUntilDue(itfDue) < 0 ? 'OVERDUE' : getDaysUntilDue(itfDue) <= 60 ? 'DUE_SOON' : 'COMPLIANT',
            notes: 'Annual contribution based on total payroll'
        });
    }

    return items;
}

function getDaysUntilDue(dueDate: Date): number {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getNextQuarterEnd(): Date {
    const today = new Date();
    const month = today.getMonth();

    // Q1: March 31, Q2: June 30, Q3: Sept 30, Q4: Dec 31
    if (month < 3) return new Date(today.getFullYear(), 2, 31);
    if (month < 6) return new Date(today.getFullYear(), 5, 30);
    if (month < 9) return new Date(today.getFullYear(), 8, 30);
    return new Date(today.getFullYear(), 11, 31);
}
