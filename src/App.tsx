import { useState, useMemo } from 'react';
import type { Transaction, StatementSummary, Company } from './engine/types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { UploadZone } from './components/UploadZone';
import { SmartLedger } from './components/SmartLedger';
import { ProfitLossAnalysis } from './components/ProfitLossAnalysis';
import { TaxYearSplit } from './components/TaxYearSplit';
import { DirectorLoanAccount } from './components/DirectorLoanAccount';
import { TaxPIT } from './components/TaxPIT';
import { TaxCIT } from './components/TaxCIT';
import { TaxVAT } from './components/TaxVAT';
import { Reports } from './components/Reports';
import { FilingPack } from './components/FilingPack';
import { Settings } from './components/Settings'; // New

// Engine
import type { PitInput } from './engine/pit';
import { type CitInput } from './engine/cit';
import { type VatInput } from './engine/vat';
import { generateExcelWorkbook } from './engine/excel';
// Multi-Company State
function App() {
  const [activeView, setActiveView] = useState('dashboard');
  interface CompanySession {
    company: Company;
    statementData: { transactions: Transaction[], summary: StatementSummary } | null;
    pitInput: PitInput;
    citInput: CitInput;
    vatInput: VatInput;
  }

  const defaultPit: PitInput = { gross_income: 5000000, allowable_deductions: 500000, non_taxable_income: 0, actual_rent_paid: 1000000 };
  const defaultCit: CitInput = { turnover: 120000000, assessable_profit: 30000000 };
  const defaultVat: VatInput = { output_vat: 75000, input_vat: 25000, is_registered: true };

  const [activeCompanyId, setActiveCompanyId] = useState<string>('default');
  const [sessions, setSessions] = useState<Record<string, CompanySession>>({
    'default': {
      company: { id: 'default', name: 'Univelcity Ltd' },
      statementData: null,
      pitInput: defaultPit,
      citInput: defaultCit,
      vatInput: defaultVat
    }
  });

  const activeSession = sessions[activeCompanyId];

  // Helper setters for active session
  const updateSession = (updater: (prev: CompanySession) => CompanySession) => {
    setSessions(prev => ({
      ...prev,
      [activeCompanyId]: updater(prev[activeCompanyId])
    }));
  };

  const setStatementData = (data: { transactions: Transaction[], summary: StatementSummary } | null) =>
    updateSession(s => ({ ...s, statementData: data }));

  const setPitInput = (input: PitInput | ((prev: PitInput) => PitInput)) =>
    updateSession(s => ({ ...s, pitInput: typeof input === 'function' ? input(s.pitInput) : input }));

  const setCitInput = (input: CitInput | ((prev: CitInput) => CitInput)) =>
    updateSession(s => ({ ...s, citInput: typeof input === 'function' ? input(s.citInput) : input }));

  const setVatInput = (input: VatInput | ((prev: VatInput) => VatInput)) =>
    updateSession(s => ({ ...s, vatInput: typeof input === 'function' ? input(s.vatInput) : input }));

  const handleAddCompany = () => {
    const name = prompt("Enter new company name:");
    if (!name) return;
    const id = `comp_${Date.now()}`;
    setSessions(prev => ({
      ...prev,
      [id]: {
        company: { id, name },
        statementData: null,
        pitInput: defaultPit,
        citInput: defaultCit,
        vatInput: defaultVat
      }
    }));
    setActiveCompanyId(id);
    setActiveView('dashboard');
  };

  const handleStatementUpload = (data: { transactions: Transaction[], summary: StatementSummary }) => {
    // Inject company_id into transactions
    const taggedTransactions = data.transactions.map(t => ({ ...t, company_id: activeCompanyId }));
    const taggedData = { ...data, transactions: taggedTransactions };

    updateSession(s => ({
      ...s,
      statementData: taggedData,
      pitInput: {
        ...s.pitInput,
        gross_income: data.summary.total_inflow,
        allowable_deductions: data.summary.total_outflow,
      },
      citInput: {
        ...s.citInput,
        turnover: data.summary.total_inflow,
        assessable_profit: Math.max(0, data.summary.net_cash_flow)
      }
    }));

    setActiveView('transactions');
  };

  const handleStatementUpdate = (updatedTxns: Transaction[]) => {
    setStatementData(prev => prev ? { ...prev, transactions: updatedTxns } : null);
  };

  // Helper for reused components
  const NoDataFallback = () => (
    <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
      <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No data available for {activeSession.company.name}.</p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          onClick={() => setActiveView('settings')}
          style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: 'white' }}
        >
          1. Create Company
        </button>
        <button
          onClick={() => setActiveView('upload')}
          style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          2. Upload Data
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    const { statementData, pitInput, citInput, vatInput } = activeSession;

    switch (activeView) {
      case 'dashboard':
        return <Dashboard summary={statementData?.summary || null} onNavigate={setActiveView} />;

      case 'upload':
        return (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1rem', color: '#1e293b' }}>Upload Bank Statement</h2>
            <UploadZone onUpload={handleStatementUpload} />
          </div>
        );

      case 'transactions':
        return statementData ? (
          <SmartLedger
            transactions={statementData.transactions}
            onUpdate={handleStatementUpdate}
            onNavigate={setActiveView}
            onDownloadExcel={handleDownloadExcel}
          />
        ) : <NoDataFallback />;

      case 'analysis_pl':
        return statementData ? (
          <ProfitLossAnalysis
            transactions={statementData.transactions}
            onNavigate={setActiveView}
          />
        ) : <NoDataFallback />;

      case 'analysis_tax_year': return statementData ? <TaxYearSplit transactions={statementData.transactions} /> : <NoDataFallback />;
      case 'analysis_dla': return statementData ? <DirectorLoanAccount transactions={statementData.transactions} /> : <NoDataFallback />;

      case 'tax_pit': return <TaxPIT transactions={statementData?.transactions || []} savedInput={pitInput} onSave={setPitInput} onNavigate={setActiveView} />;
      case 'tax_cit': return <TaxCIT transactions={statementData?.transactions || []} savedInput={citInput} onSave={setCitInput} onNavigate={setActiveView} />;
      case 'tax_vat': return <TaxVAT transactions={statementData?.transactions || []} savedInput={vatInput} onSave={setVatInput} onNavigate={setActiveView} />;

      case 'reports':
        // Switching to Reports component which is more general
        return statementData ? (
          <Reports
            transactions={statementData.transactions}
            summary={statementData.summary}
            pitInput={pitInput}
            citInput={citInput}
            vatInput={vatInput}
          />
        ) : <NoDataFallback />;

      case 'filing': // Keeping FilingPack accessible if needed via explicit route, though default nav goes here
        return statementData ? (
          <FilingPack
            transactions={statementData.transactions}
            summary={statementData.summary}
            pitInput={pitInput}
            citInput={citInput}
            vatInput={vatInput}
          />
        ) : <NoDataFallback />;

      case 'settings':
        return <Settings />;

      default: return <div>Under Construction</div>;
    }
  };

  return (
    <Layout
      activeView={activeView}
      onNavigate={setActiveView}
      activeCompanyId={activeCompanyId}
      companies={Object.values(sessions).map(s => s.company)}
      onSwitchCompany={setActiveCompanyId}
      onAddCompany={handleAddCompany}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
