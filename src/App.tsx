import { useState } from 'react';
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
import type { Transaction, StatementSummary } from './engine/types';

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  // Data State
  const [statementData, setStatementData] = useState<{ transactions: Transaction[], summary: StatementSummary } | null>(null);

  // Tax State (Persisted for app lifecycle)
  const [pitInput, setPitInput] = useState<PitInput>({
    gross_income: 5000000,
    allowable_deductions: 500000,
    non_taxable_income: 0,
    actual_rent_paid: 1000000,
  });
  const [citInput, setCitInput] = useState<CitInput>({
    turnover: 120000000,
    assessable_profit: 30000000,
  });
  const [vatInput, setVatInput] = useState<VatInput>({
    output_vat: 75000,
    input_vat: 25000,
    is_registered: true
  });

  const handleStatementUpload = (data: { transactions: Transaction[], summary: StatementSummary }) => {
    setStatementData(data);

    // Auto-Estimates
    setPitInput({
      gross_income: data.summary.total_inflow,
      allowable_deductions: data.summary.total_outflow,
      non_taxable_income: 0,
      actual_rent_paid: 0 // Default
    });
    setCitInput({
      turnover: data.summary.total_inflow,
      assessable_profit: Math.max(0, data.summary.net_cash_flow)
    });

    setActiveView('transactions'); // Step 3: Categorise
  };

  const handleStatementUpdate = (updatedTxns: Transaction[]) => {
    setStatementData(prev => prev ? { ...prev, transactions: updatedTxns } : null);
  };

  // Helper for reused components
  const NoDataFallback = () => (
    <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
      <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No data available.</p>
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
    <Layout activeView={activeView} onNavigate={setActiveView}>
      {renderContent()}
    </Layout>
  );
}

export default App;
