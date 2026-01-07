import { useState } from 'react';
import { calculatePIT, type PitInput } from './engine/pit';
import { calculateCIT, type CitInput } from './engine/cit';
import { calculateVAT, type VatInput } from './engine/vat';
import { Questionnaire } from './components/Questionnaire';
import { UploadZone } from './components/UploadZone';
import { PIT_FLOW, CIT_FLOW } from './engine/questionnaire';
import type { StatementSummary, Transaction } from './engine/types';

import { StatementOfAccount } from './components/StatementOfAccount';
import { CashFlowStatement } from './components/CashFlowStatement';
import { generatePDFReport } from './engine/reports';

function App() {
  const [activeTab, setActiveTab] = useState<'Statement' | 'PIT' | 'CIT' | 'VAT'>('Statement');
  const [mode, setMode] = useState<'calculator' | 'guided'>('calculator');
  const [statementData, setStatementData] = useState<{ transactions: Transaction[], summary: StatementSummary } | null>(null);
  const [statementView, setStatementView] = useState<'upload' | 'ledger' | 'cashflow'>('upload');

  // PIT State
  const [pitInput, setPitInput] = useState<PitInput>({
    gross_income: 5000000,
    allowable_deductions: 500000,
    non_taxable_income: 0,
    actual_rent_paid: 1000000,
  });

  // CIT State
  const [citInput, setCitInput] = useState<CitInput>({
    turnover: 120000000,
    assessable_profit: 30000000,
  });

  const handleStatementUpload = (data: { transactions: Transaction[], summary: StatementSummary }) => {
    setStatementData(data);

    // Auto-Populate Estimates based on Statement
    // PIT: Gross = Inflow
    setPitInput(prev => ({
      ...prev,
      gross_income: data.summary.total_inflow,
      allowable_deductions: data.summary.total_outflow // Rough estimate
    }));

    // CIT: Turnover = Inflow, Profit = Net Cash Flow (Approximation)
    setCitInput(prev => ({
      ...prev,
      turnover: data.summary.total_inflow,
      assessable_profit: Math.max(0, data.summary.net_cash_flow)
    }));

    alert(`Statement Processed! Found ${data.summary.transaction_count} transactions. Tax inputs updated.`);
  };

  const handleGuidedComplete = (answers: Record<string, any>) => {
    if (activeTab === 'PIT') {
      // Map Answers to PIT Input
      const newInput: PitInput = {
        gross_income: Number(answers['gross_income'] || 0),
        allowable_deductions: Number(answers['expenses'] || 0),
        non_taxable_income: 0,
        actual_rent_paid: answers['pays_rent'] === 'yes' ? Number(answers['rent_amount'] || 0) : 0
      };
      setPitInput(newInput);
    } else if (activeTab === 'CIT') {
      // Map Answers to CIT Input
      const turnover = Number(answers['turnover'] || 0);
      const expenses = Number(answers['expenses'] || 0);
      const newInput: CitInput = {
        turnover,
        assessable_profit: Math.max(0, turnover - expenses)
      };
      setCitInput(newInput);
    }
    setMode('calculator');
  };

  const handleDownloadReport = () => {
    if (activeTab === 'Statement') return;

    // Gather latest calculation results
    // Ideally we recalculate or store last result. Recalculating for freshness:
    const pitRes = calculatePIT(pitInput);
    const citRes = calculateCIT(citInput);

    generatePDFReport({
      type: asTabType(activeTab),
      pitResult: activeTab === 'PIT' ? pitRes : undefined,
      citResult: activeTab === 'CIT' ? citRes : undefined,
      statementSummary: statementData?.summary, // Include if uploaded
      date: new Date()
    });
  };

  const asTabType = (t: string): 'PIT' | 'CIT' | 'VAT' => {
    if (t === 'PIT' || t === 'CIT' || t === 'VAT') return t;
    return 'PIT'; // default
  }

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
          Nigeria Tax <span style={{ color: 'var(--color-accent)' }}>Automator</span>
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#475569', marginBottom: '0.25rem', fontWeight: '500' }}>
          For Individuals, SMEs, and Tax Practitioners
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Finance Act 2025 Compliant Engine</p>

        {activeTab !== 'Statement' && (
          <button
            onClick={handleDownloadReport}
            style={{
              marginTop: '1rem',
              background: 'transparent',
              border: '1px solid var(--color-primary)',
              color: 'var(--color-primary)',
              padding: '0.4rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            📄 Download Tax Computation Summary (PDF)
          </button>
        )}
      </header>

      {mode === 'guided' ? (
        <Questionnaire
          flow={activeTab === 'PIT' ? PIT_FLOW : CIT_FLOW}
          onComplete={handleGuidedComplete}
          onCancel={() => setMode('calculator')}
        />
      ) : (
        <div className="glass-panel" style={{ maxWidth: '800px', margin: '0 auto', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            <nav style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
              {['Statement', 'PIT', 'CIT', 'VAT'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  style={{
                    padding: '0.5rem 1.5rem',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: activeTab === tab ? '2px solid var(--color-accent)' : 'none',
                    fontWeight: activeTab === tab ? 'bold' : 'normal',
                    color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab === 'Statement' ? '📂 Upload' : `${tab} Calc`}
                </button>
              ))}
            </nav>
            {activeTab !== 'VAT' && activeTab !== 'Statement' && (
              <button
                onClick={() => setMode('guided')}
                style={{
                  background: 'var(--color-primary)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '2rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
              >
                <span>✨ Wizard</span>
              </button>
            )}
          </div>

          {activeTab === 'Statement' && (
            <div>
              {/* Statement Sub-Navigation */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem', width: 'fit-content' }}>
                {['upload', 'ledger', 'cashflow'].map(view => (
                  <button
                    key={view}
                    onClick={() => setStatementView(view as any)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      background: statementView === view ? 'white' : 'transparent',
                      color: statementView === view ? 'var(--color-primary)' : '#64748b',
                      boxShadow: statementView === view ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      fontWeight: '500'
                    }}
                  >
                    {view === 'upload' ? 'Upload / Summary' : view === 'ledger' ? 'Statement of Account' : 'Cash Flow'}
                  </button>
                ))}
              </div>

              {statementView === 'upload' && (
                <>
                  <UploadZone onUpload={handleStatementUpload} />
                  {statementData && (
                    <div className="card" style={{ marginTop: '1rem', background: 'var(--color-bg)' }}>
                      <h3>Statement Summary</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                          <small>Total Inflow</small>
                          <p style={{ fontSize: '1.25rem', color: 'var(--color-success)' }}>₦{statementData.summary.total_inflow.toLocaleString()}</p>
                        </div>
                        <div>
                          <small>Total Outflow</small>
                          <p style={{ fontSize: '1.25rem', color: 'var(--color-error)' }}>₦{statementData.summary.total_outflow.toLocaleString()}</p>
                        </div>
                      </div>
                      <p style={{ marginTop: '1rem', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
                        inputs have been auto-filled in PIT/CIT tabs.
                      </p>
                    </div>
                  )}
                </>
              )}

              {statementView === 'ledger' && statementData && (
                <StatementOfAccount transactions={statementData.transactions} />
              )}

              {statementView === 'cashflow' && statementData && (
                <CashFlowStatement transactions={statementData.transactions} />
              )}

              {(statementView === 'ledger' || statementView === 'cashflow') && !statementData && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <p>No statement data found.</p>
                  <button
                    onClick={() => setStatementView('upload')}
                    style={{ marginTop: '1rem', color: 'var(--color-primary)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Go to Upload
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'PIT' && <PitCalculator input={pitInput} setInput={setPitInput} />}
          {activeTab === 'CIT' && <CitCalculator input={citInput} setInput={setCitInput} />}
          {activeTab === 'VAT' && <VatCalculator />}
        </div>
      )}
    </div>
  );
}

function PitCalculator({ input, setInput }: { input: PitInput, setInput: (v: PitInput) => void }) {
  const result = calculatePIT(input);

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Personal Income Tax (Finance Act 2025)</h2>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Gross Income (₦)</label>
          <input
            type="number"
            value={input.gross_income}
            onChange={e => setInput({ ...input, gross_income: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Business Expenses (₦)</label>
          <input
            type="number"
            value={input.allowable_deductions}
            onChange={e => setInput({ ...input, allowable_deductions: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Actual Rent Paid (₦)</label>
          <input
            type="number"
            value={input.actual_rent_paid}
            onChange={e => setInput({ ...input, actual_rent_paid: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginTop: '0.5rem', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--color-primary)' }}>
        Note: Rent Deduction is Lower of Actual Rent Paid OR (20% of Gross, Max 500k).
      </div>

      <div className="card" style={{ marginTop: '2rem', background: 'var(--color-bg)' }}>
        <h3 style={{ borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Results</h3>
        {result.is_exempt ? (
          <p style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '1.1rem' }}>✅ EXEMPT (Income ≤ ₦800,000)</p>
        ) : (
          <>
            <p><strong>Rent Relief Used:</strong> ₦{result.reliefs.toLocaleString()}</p>
            <p><strong>Taxable Income:</strong> ₦{result.taxable_income.toLocaleString()}</p>
            <p style={{ marginTop: '1rem', fontSize: '1.25rem' }}>
              <strong>Tax Payable:</strong> <span style={{ color: 'var(--color-primary)' }}>₦{result.tax_payable.toLocaleString()}</span>
            </p>
            <small style={{ color: 'var(--color-text-muted)' }}>Effective Rate: {(result.effective_rate * 100).toFixed(2)}%</small>
          </>
        )}
      </div>
    </div>
  );
}

function CitCalculator({ input, setInput }: { input: CitInput, setInput: (v: CitInput) => void }) {
  const result = calculateCIT(input);

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Company Income Tax (Finance Act 2025)</h2>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Turnover (₦)</label>
          <input
            type="number"
            value={input.turnover}
            onChange={e => setInput({ ...input, turnover: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Assessable Profit (₦)</label>
          <input
            type="number"
            value={input.assessable_profit}
            onChange={e => setInput({ ...input, assessable_profit: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem', background: 'var(--color-bg)' }}>
        <h3>Results</h3>
        <p><strong>Category:</strong> {result.category} Company</p>
        <p><strong>CIT Rate:</strong> {(result.tax_rate * 100)}%</p>
        <p><strong>CIT Payable:</strong> ₦{result.tax_payable.toLocaleString()}</p>
        <p><strong>Development Levy (4%):</strong> ₦{result.development_levy.toLocaleString()}</p>
        <p style={{ marginTop: '1rem', fontSize: '1.25rem' }}>
          <strong>Total Due:</strong> <span style={{ color: 'var(--color-primary)' }}>₦{(result.tax_payable + result.development_levy).toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
}

function VatCalculator() {
  const [input, setInput] = useState<VatInput>({
    output_vat: 75000,
    input_vat: 25000,
    is_registered: true
  });

  const result = calculateVAT(input);

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Value Added Tax (VAT)</h2>
      <div style={{ marginBottom: '1rem' }}>
        <label>
          <input
            type="checkbox"
            checked={input.is_registered}
            onChange={e => setInput({ ...input, is_registered: e.target.checked })}
          /> VAT Registered?
        </label>
      </div>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Output VAT (Collected)</label>
          <input
            type="number"
            value={input.output_vat}
            onChange={e => setInput({ ...input, output_vat: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label>Input VAT (Paid)</label>
          <input
            type="number"
            value={input.input_vat}
            onChange={e => setInput({ ...input, input_vat: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>
      </div>

      <div className="card" style={{ marginTop: '2rem', background: 'var(--color-bg)' }}>
        <h3>result</h3>
        <p><strong>Status:</strong> {result.status}</p>
        <p style={{ marginTop: '1rem', fontSize: '1.25rem' }}>
          <strong>Net Payable:</strong> <span style={{ color: 'var(--color-primary)' }}>₦{result.vat_payable.toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: '0.75rem',
  borderRadius: '0.375rem',
  border: '1px solid #cbd5e1',
  marginTop: '0.25rem',
  fontSize: '1rem'
};

export default App;
