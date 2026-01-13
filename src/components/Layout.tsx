import { useState } from 'react';
import type { Company } from '../engine/types';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
    children: React.ReactNode;
    mode: 'personal' | 'business';
    activeCompanyId?: string;
    companies?: Company[];
    onSwitchCompany?: (id: string) => void;
    onAddCompany?: () => void;
    onLogout?: () => void;
    onSwitchMode: (mode: 'personal' | 'business') => void;
}

export function Layout({
    children,
    mode,
    activeCompanyId,
    companies = [],
    onSwitchCompany,
    onAddCompany,
    onLogout,
    onSwitchMode
}: LayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showNotifications, setShowNotifications] = useState(false);
    // Navigation Helper
    const handleNavigate = (view: string) => {
        // Map "view" names to Routes based on Mode
        if (mode === 'personal') {
            if (view === 'dashboard') navigate('/personal/dashboard');
            else if (view === 'upload') navigate('/personal/upload');
            else if (view === 'transactions') navigate('/personal/transactions');
            else if (view === 'tax_pit') navigate('/personal/tax/pit');
            else if (view === 'filing_pack') navigate('/personal/filing');
            else if (view === 'settings') navigate('/personal/settings');
            else if (view === 'help') navigate('/personal/help');
        } else {
            // Business Mode
            const prefix = `/companies/${activeCompanyId}`;
            if (view === 'dashboard') navigate(`${prefix}/dashboard`);
            else if (view === 'upload') navigate(`${prefix}/upload`);
            else if (view === 'transactions') navigate(`${prefix}/transactions`);
            else if (view === 'tax_cit') navigate(`${prefix}/tax/cit`);
            else if (view === 'tax_vat') navigate(`${prefix}/tax/vat`);
            else if (view === 'tax_wht') navigate(`${prefix}/tax/wht`);
            else if (view === 'tax_cgt') navigate(`${prefix}/tax/cgt`);
            else if (view === 'filing_pack') navigate(`${prefix}/filing`);
            else if (view === 'analysis_pl') navigate(`${prefix}/analysis`);
            else if (view === 'dividend_vouchers') navigate(`${prefix}/dividends`);
            else if (view === 'expense_checklist') navigate(`${prefix}/compliance`);
            else if (view === 'settings') navigate(`${prefix}/settings`);
            else if (view === 'help') navigate(`${prefix}/help`);
        }

    };



    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* Sidebar */}
            <aside style={{
                width: sidebarOpen ? '260px' : '72px',
                background: 'white',
                borderRight: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s ease',
                flexShrink: 0
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src="/deap-logo.png" alt="DEAP Logo" style={{ height: '40px', objectFit: 'contain' }} />
                    {sidebarOpen && (
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e293b' }}>DEAP</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Nigeria Tax Automator</div>
                        </div>
                    )}
                </div>

                <nav style={{ flex: 1, padding: '1.5rem 1rem', overflowY: 'auto' }}>

                    {/* Common Items */}
                    <NavItem label="Dashboard" icon="📊" active={location.pathname.includes('dashboard')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('dashboard')} />
                    <NavItem label="Upload Data" icon="📁" active={location.pathname.includes('upload')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('upload')} />
                    <NavItem label="Transactions" icon="💳" active={location.pathname.includes('transactions')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('transactions')} />

                    <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>
                        {mode === 'personal' ? 'Personal Finance' : 'Business Finance'}
                    </div>

                    {mode === 'personal' ? (
                        <>
                            {/* Personal Specific */}
                            <NavItem label="PIT Computation" icon="🧮" active={location.pathname.includes('tax/pit')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('tax_pit')} />
                            <NavItem label="WHT (Withholding)" icon="📉" active={location.pathname.includes('tax/wht')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('tax_wht')} />
                            <NavItem label="CGT (Capital Gains)" icon="📈" active={location.pathname.includes('tax/cgt')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('tax_cgt')} />
                            <NavItem label="Filing Pack" icon="📦" active={location.pathname.includes('filing')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('filing_pack')} />
                        </>
                    ) : (
                        <>
                            {/* Business Specific */}
                            <NavItem label="Analysis" icon="📈" active={location.pathname.includes('analysis')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('analysis_pl')} />
                            <NavItem label="CIT Computation" icon="🏢" active={location.pathname.includes('tax/cit')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('tax_cit')} />
                            <NavItem label="WHT (Withholding)" icon="📉" active={location.pathname.includes('tax/wht')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('tax_wht')} />
                            <NavItem label="CGT (Capital Gains)" icon="📈" active={location.pathname.includes('tax/cgt')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('tax_cgt')} />
                            <NavItem label="VAT Returns" icon="🛒" active={location.pathname.includes('tax/vat')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('tax_vat')} />
                            <NavItem label="Filing Pack" icon="📦" active={location.pathname.includes('filing')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('filing_pack')} />
                            <NavItem label="Dividend Vouchers" icon="📜" active={location.pathname.includes('dividends')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('dividend_vouchers')} />
                            <NavItem label="Expense Checklist" icon="✅" active={location.pathname.includes('checklist')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('expense_checklist')} />
                        </>
                    )}

                    <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>System</div>
                    <NavItem label="Settings" icon="⚙️" active={location.pathname.includes('settings')} sidebarOpen={sidebarOpen} onClick={() => handleNavigate('settings')} />

                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {/* Switch Mode Button */}
                        <button
                            onClick={() => onSwitchMode(mode === 'personal' ? 'business' : 'personal')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                                border: '1px solid #cbd5e1', background: '#f1f5f9', color: '#475569', width: '100%',
                                borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '600', marginBottom: '0.5rem'
                            }}
                        >
                            <span>⇄</span>
                            {sidebarOpen && <span>Switch to {mode === 'personal' ? 'Business' : 'Personal'}</span>}
                        </button>

                        <button
                            onClick={() => handleNavigate('help')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                                border: 'none', background: 'transparent', color: '#64748b', width: '100%',
                                borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500'
                            }}
                        >
                            <span>❓</span>
                            {sidebarOpen && <span>Help & Support</span>}
                        </button>
                        <button
                            onClick={onLogout}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                                border: 'none', background: 'transparent', color: '#ef4444', width: '100%',
                                borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500'
                            }}
                        >
                            <span>🚪</span>
                            {sidebarOpen && <span>Sign Out</span>}
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100vh', overflow: 'hidden', background: '#f1f5f9' }}>

                {/* Top App Bar */}
                <header style={{ height: '64px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>☰</button>

                        {mode === 'personal' ? (
                            <div style={{ background: '#dbeafe', color: '#1e40af', padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                Mode: Personal Profile
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.4rem 1rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                    Mode: Business
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Company:</span>
                                    <select
                                        value={activeCompanyId || ''}
                                        onChange={(e) => {
                                            if (e.target.value === 'ADD_NEW') {
                                                onAddCompany?.();
                                            } else {
                                                onSwitchCompany?.(e.target.value);
                                            }
                                        }}
                                        style={{ background: 'transparent', border: 'none', fontWeight: '600', fontSize: '0.9rem', color: '#334155', cursor: 'pointer', outline: 'none' }}
                                    >
                                        <option value="" disabled>Select Company</option>
                                        {companies.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                        <option disabled>──────────</option>
                                        <option value="ADD_NEW">+ Add Company</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', marginLeft: mode === 'personal' ? '1rem' : 0 }}>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Year:</span>
                            <select style={{ background: 'transparent', border: 'none', fontWeight: '600', fontSize: '0.9rem', color: '#334155', cursor: 'pointer', outline: 'none' }}>
                                <option>2025 (Jan-Dec)</option>
                                <option>2024 (Jan-Dec)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', position: 'relative' }}
                                title="Notifications"
                            >
                                🔔
                                <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', fontSize: '0.6rem', padding: '1px 5px', borderRadius: '10px', fontWeight: 'bold' }}>3</span>
                            </button>

                            {showNotifications && (
                                <div style={{
                                    position: 'absolute', top: '120%', right: 0, width: '300px',
                                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 50, overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b' }}>
                                        Notifications
                                    </div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <NotificationItem text="Welcome to DEAP! Complete your profile to get started." time="Just now" isNew={true} />
                                        <NotificationItem text="Tax deadline approaching: VAT returns due soon." time="2 hours ago" isNew={true} />
                                        <NotificationItem text="System maintenance scheduled for weekend." time="1 day ago" isNew={false} />
                                    </div>
                                    <div style={{ padding: '0.5rem', textAlign: 'center', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                                        <button onClick={() => setShowNotifications(false)} style={{ border: 'none', background: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer' }}>Close</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Scrollable View Area */}
                <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}

function NavItem({ label, icon, active, sidebarOpen, onClick }: { label: string, icon: string, active: boolean, sidebarOpen: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                border: 'none',
                background: active ? '#e0f2fe' : 'transparent',
                color: active ? '#0284c7' : '#64748b',
                width: '100%',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: active ? '600' : '400',
                marginBottom: '0.25rem',
                textAlign: 'left'
            }}
        >
            {/* <span style={{ fontSize: '1.2rem' }}>{icon}</span> */}
            <span>{icon}</span>
            {sidebarOpen && <span>{label}</span>}
        </button>
    );
}

function NotificationItem({ text, time, isNew }: { text: string, time: string, isNew: boolean }) {
    return (
        <div style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', background: isNew ? '#f0f9ff' : 'white' }}>
            <div style={{ fontSize: '0.85rem', color: '#334155', marginBottom: '0.25rem' }}>{text}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{time}</div>
        </div>
    );
}
