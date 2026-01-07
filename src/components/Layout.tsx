import { useState } from 'react';

interface LayoutProps {
    children: React.ReactNode;
    activeView: string;
    onNavigate: (view: string) => void;
}

export function Layout({ children, activeView, onNavigate }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const NavItem = ({ view, label, icon, subItems }: { view?: string, label: string, icon: string, subItems?: { view: string, label: string }[] }) => {
        const isActive = view === activeView || subItems?.some(i => i.view === activeView);
        const [expanded, setExpanded] = useState(isActive);

        const handleClick = () => {
            if (subItems) {
                setExpanded(!expanded);
            } else if (view) {
                onNavigate(view);
            }
        };

        return (
            <div style={{ marginBottom: '0.25rem' }}>
                <div
                    onClick={handleClick}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        cursor: 'pointer',
                        background: (view && activeView === view) ? '#eff6ff' : 'transparent',
                        color: (view && activeView === view) ? 'var(--color-primary)' : '#475569',
                        borderRight: (view && activeView === view) ? '3px solid var(--color-primary)' : '3px solid transparent',
                        fontWeight: (view && activeView === view) ? 600 : 500,
                        transition: 'all 0.2s'
                    }}
                >
                    <span style={{ marginRight: '0.75rem', fontSize: '1.1rem' }}>{icon}</span>
                    <span style={{ flex: 1 }}>{label}</span>
                    {subItems && (
                        <span style={{ fontSize: '0.8rem', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
                    )}
                </div>
                {subItems && expanded && (
                    <div style={{ paddingLeft: '2.5rem', background: '#f8fafc' }}>
                        {subItems.map(sub => (
                            <div
                                key={sub.view}
                                onClick={() => onNavigate(sub.view)}
                                style={{
                                    padding: '0.5rem 0.5rem 0.5rem 0',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    color: activeView === sub.view ? 'var(--color-primary)' : '#64748b',
                                    fontWeight: activeView === sub.view ? 600 : 400
                                }}
                            >
                                {sub.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: sidebarOpen ? '250px 1fr' : '0px 1fr', height: '100vh', overflow: 'hidden', transition: 'grid-template-columns 0.3s' }}>

            {/* Sidebar */}
            <aside style={{ background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--color-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>D</div>
                    <div>
                        <h1 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: '#1e293b' }}>DEAP</h1>
                        <p style={{ fontSize: '0.7rem', color: '#94a3b8', margin: 0 }}>Nigeria Tax Automator</p>
                    </div>
                </div>

                <nav style={{ padding: '1rem 0', flex: 1 }}>
                    <NavItem view="dashboard" label="Dashboard" icon="📊" />
                    <NavItem view="upload" label="Upload Data" icon="📂" />
                    <NavItem view="transactions" label="Transactions" icon="💳" />

                    <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Analysis</div>
                    <NavItem label="Analysis" icon="📈" subItems={[
                        { view: 'analysis_pl', label: 'Profit & Loss' },
                        { view: 'analysis_tax_year', label: 'Tax Year Split' },
                        { view: 'analysis_dla', label: 'Owner / Director Loan' }
                    ]} />

                    <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Compliance</div>
                    <NavItem label="Tax Computation" icon="calculator" subItems={[
                        { view: 'tax_pit', label: 'Personal Income Tax (PIT)' },
                        { view: 'tax_cit', label: 'Company Income Tax (CIT)' },
                        { view: 'tax_vat', label: 'Value Added Tax (VAT)' }
                    ]} />
                    <NavItem view="filing_pack" label="Filing Pack" icon="📦" />
                    <NavItem view="reports" label="Reports" icon="📑" />

                    <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>System</div>
                    <NavItem view="settings" label="Settings" icon="⚙️" />
                </nav>

                <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ffedd5', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>JA</div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Daramola Omoyele</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Admin</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#f1f5f9' }}>

                {/* Top App Bar */}
                <header style={{ height: '64px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>☰</button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Company:</span>
                            <select style={{ background: 'transparent', border: 'none', fontWeight: '600', fontSize: '0.9rem', color: '#334155', cursor: 'pointer', outline: 'none' }}>
                                <option>Univelcity Ltd</option>
                                <option>Personal Accounts</option>
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
