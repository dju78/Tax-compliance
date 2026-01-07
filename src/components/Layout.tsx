import { useState } from 'react';

interface LayoutProps {
    children: React.ReactNode;
    activeView: string;
    onNavigate: (view: string) => void;
}

export function Layout({ children, activeView, onNavigate }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

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
                    <div style={{ width: '32px', height: '32px', background: '#0f172a', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>D</div>
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

                    <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>System</div>
                    <NavItem view="settings" label="Settings" icon="⚙️" />
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

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Notifications">🔔</button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }} title="Help">❓</button>
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
