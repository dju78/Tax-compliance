import { useState } from 'react';
import type { Company } from '../engine/types';

interface LayoutProps {
    children: React.ReactNode;
    activeView: string;
    onNavigate: (view: string) => void;
    activeCompanyId?: string;
    companies?: Company[];
    onSwitchCompany?: (id: string) => void;
    onAddCompany?: () => void;
    onLogout?: () => void;
}

export function Layout({
    children,
    activeView,
    onNavigate,
    activeCompanyId,
    companies = [],
    onSwitchCompany,
    onAddCompany,
    onLogout
}: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);

    const NavItem = ({ view, label, icon }: { view: string, label: string, icon: string }) => (
        <button
            onClick={() => onNavigate(view)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                border: 'none',
                background: activeView === view ? '#e0f2fe' : 'transparent',
                color: activeView === view ? '#0284c7' : '#64748b',
                width: '100%',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: activeView === view ? '600' : '400',
                marginBottom: '0.25rem',
                textAlign: 'left'
            }}
        >
            <span>{icon}</span>
            {sidebarOpen && <span>{label}</span>}
        </button>
    );

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
                    <NavItem view="dashboard" label="Dashboard" icon="📊" />
                    <NavItem view="upload" label="Upload Data" icon="📁" />
                    <NavItem view="transactions" label="Transactions" icon="💳" />

                    <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Analysis</div>
                    <NavItem view="analysis_pl" label="Analysis" icon="📈" />

                    <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Compliance</div>
                    <NavItem view="tax_cit" label="Tax Computation" icon="calculator" />
                    <NavItem view="filing_pack" label="Filing Pack" icon="📦" />
                    <NavItem view="reports" label="Reports" icon="📑" />
                    <NavItem view="dividend_vouchers" label="Dividend Vouchers" icon="📜" />

                    <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>System</div>
                    <NavItem view="settings" label="Settings" icon="⚙️" />

                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
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

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Company:</span>
                            <select
                                value={activeCompanyId}
                                onChange={(e) => {
                                    if (e.target.value === 'ADD_NEW') {
                                        onAddCompany?.();
                                    } else {
                                        onSwitchCompany?.(e.target.value);
                                    }
                                }}
                                style={{ background: 'transparent', border: 'none', fontWeight: '600', fontSize: '0.9rem', color: '#334155', cursor: 'pointer', outline: 'none' }}
                            >
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                                <option disabled>──────────</option>
                                <option value="ADD_NEW">+ Add Company</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
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
                                onClick={() => { setNotificationOpen(!notificationOpen); setHelpOpen(false); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', position: 'relative' }}
                                title="Notifications"
                            >
                                🔔
                                <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'red', borderRadius: '50%' }}></span>
                            </button>
                            {notificationOpen && (
                                <div style={{
                                    position: 'absolute', top: '150%', right: '0', width: '300px',
                                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50
                                }}>
                                    <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', color: '#334155' }}>Notifications</div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: '#f8fafc' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b' }}>Bank upload completed</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>158 transactions imported</div>
                                        </div>
                                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b' }}>Items need review</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>5 items need review (VAT/WHT rules)</div>
                                        </div>
                                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b' }}>Report generated successfully</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Monthly Summary ready.</div>
                                        </div>
                                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b' }}>Tax rules updated</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Rules updated for selected year.</div>
                                        </div>
                                        <div style={{ padding: '0.75rem 1rem', cursor: 'pointer' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b' }}>Reminder</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>VAT filing due in 3 days</div>
                                        </div>
                                    </div>
                                    <div style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', color: '#0284c7', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        Mark all as read
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => { setHelpOpen(!helpOpen); setNotificationOpen(false); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                title="Help"
                            >
                                ❓
                            </button>
                            {helpOpen && (
                                <div style={{
                                    position: 'absolute', top: '150%', right: '0', width: '250px',
                                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50
                                }}>
                                    <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', color: '#334155' }}>Help & Support</div>
                                    <div style={{ padding: '0.5rem 0' }}>
                                        <div style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.9rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            📚 Documentation
                                        </div>
                                        <div style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.9rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            🎥 Video Tutorials
                                        </div>
                                        <div style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.9rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            💬 Contact Support
                                        </div>
                                        <div style={{ padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.9rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            ℹ️ About DEAP v1.0
                                        </div>
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
