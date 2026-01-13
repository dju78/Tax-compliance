import type { AuditResult } from './auditRisk';
import type { AuditInputs } from './auditRisk';
import { EXPENSE_CHECKLIST_SOLE, EXPENSE_CHECKLIST_LTD } from '../data/expenseChecklists';
import { calculateTaxSavings } from './taxSavings';

export function generateExpenseRiskReportHTML(
  riskResult: AuditResult,
  inputs: AuditInputs,
  lastYearExpenses: number
) {
  const checklist = inputs.type === 'SOLE' ? EXPENSE_CHECKLIST_SOLE : EXPENSE_CHECKLIST_LTD;
  const taxSavings = calculateTaxSavings(inputs.turnover || 0, inputs.totalExpenses || 0, inputs.type === 'SOLE' ? 'SOLE' : 'LTD');
  const date = new Date().toLocaleDateString('en-NG');

  // Generate Expense Rows
  let expenseRows = '';
  checklist.forEach(cat => {
    cat.items.forEach(item => {
      if (inputs.selectedItems.includes(item.id)) {
        // We don't have individual item amounts or receipt status in current AuditInputs implementation
        // We will use placeholders or mock data relative to the category unless we extend inputs.
        // For this strictly requested report, we'll mark as "Not Specified" if missing.
        const amount = 'N/A';
        const hasReceipt = inputs.receiptMissing ? '✗' : '✓'; // Global override for now
        const status = item.isDisallowed ? '<span style="color:red">✗ Disallowed</span>' : '<span style="color:green">✓ Allowed</span>';

        expenseRows += `<tr><td>${cat.title}</td><td>${item.label}</td><td style="text-align:right">${amount}</td><td>${hasReceipt}</td><td>${status}</td></tr>`;
      }
    });
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>DEAP Tax & Risk Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; max-width: 900px; margin: 0 auto; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #059669; padding-bottom: 20px; }
    .header h1 { color: #059669; margin: 0; font-size: 28px; }
    .section { margin: 30px 0; background: #fff; }
    .section h2 { color: #059669; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; font-size: 20px; margin-bottom: 20px; }
    
    .risk-box { padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; border: 2px solid; }
    .risk-HIGH { background: #fef2f2; border-color: #dc2626; color: #b91c1c; }
    .risk-MEDIUM { background: #fffbeb; border-color: #f59e0b; color: #b45309; }
    .risk-LOW { background: #f0fdf4; border-color: #166534; color: #166534; }
    
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f9fafb; font-weight: 600; color: #374151; }
    
    .warning { background: #fff5f5; padding: 12px; margin: 10px 0; border-left: 4px solid #f87171; color: #991b1b; font-size: 14px; }
    
    .savings-container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .savings-box { padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
    .savings-banner { background: linear-gradient(135deg, #059669, #3b82f6); color: white; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    
    @media print {
        body { padding: 0; }
        .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 DEAP AUDIT & RISK REPORT</h1>
    <p>Smart Legal/Tax Compliance Check - Finance Act 2025</p>
    <p><strong>Date:</strong> ${date}</p>
  </div>
  
  <div class="section">
    <h2>1. Business Profile</h2>
    <table>
      <tr><th width="30%">Entity Type</th><td>${inputs.type === 'SOLE' ? 'Individual / Sole Trader' : 'Limited Company (LTD)'}</td></tr>
      <tr><th>Annual Turnover</th><td>₦${(inputs.turnover || 0).toLocaleString()}</td></tr>
      <tr><th>Declared Expenses</th><td>₦${(inputs.totalExpenses || 0).toLocaleString()}</td></tr>
      <tr><th>Net Profit (Est.)</th><td>₦${Math.max((inputs.turnover || 0) - (inputs.totalExpenses || 0), 0).toLocaleString()}</td></tr>
      <tr><th>Last Year Expenses</th><td>₦${lastYearExpenses.toLocaleString()}</td></tr>
    </table>
  </div>
  
  <div class="section">
    <h2>2. Audit Risk Assessment</h2>
    <div class="risk-box risk-${riskResult.level}">
        <div style="font-size: 48px; margin-bottom: 10px;">
            ${riskResult.level === 'HIGH' ? '🔴' : riskResult.level === 'MEDIUM' ? '🟡' : '🟢'}
        </div>
        <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">${riskResult.level} RISK</div>
        <div style="font-size: 18px; opacity: 0.9;">Compliance Score: ${riskResult.score}/100</div>
    </div>
    
    ${riskResult.riskDrivers.length > 0 ?
      '<h3>🚩 Key Risk Factors</h3>' +
      riskResult.riskDrivers.map(d => `<div class="warning"><strong>Risk Driver:</strong> ${d}</div>`).join('')
      : '<p style="color:green;font-style:italic;text-align:center">No major risk factors detected.</p>'
    }
    
    ${riskResult.warnings.length > 0 ?
      '<h3>⚠️ Specific Compliance Issues</h3>' +
      riskResult.warnings.map(w => `<div class="warning">${w}</div>`).join('')
      : ''
    }
  </div>
  
  <div class="section">
    <h2>3. Expense Breakdown</h2>
    <table>
      <thead><tr><th>Category</th><th>Item</th><th>Amount (Est)</th><th>Receipt</th><th>Compliance</th></tr></thead>
      <tbody>${expenseRows || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#9ca3af">No expenses selected</td></tr>'}</tbody>
    </table>
  </div>
  
  <div class="section">
    <h2>4. Tax Savings Projection</h2>
    <div class="savings-container">
      <div class="savings-box" style="background:#fee2e2; border-color:#fca5a5;">
        <div style="font-size:14px; color:#991b1b; margin-bottom:5px">Tax Liability WITHOUT Deductions</div>
        <div style="font-size:24px; font-weight:bold; color:#b91c1c">₦${taxSavings.taxWithoutExpenses.toLocaleString()}</div>
      </div>
      <div class="savings-box" style="background:#dcfce7; border-color:#86efac;">
        <div style="font-size:14px; color:#166534; margin-bottom:5px">Tax Liability WITH Deductions</div>
        <div style="font-size:24px; font-weight:bold; color:#15803d">₦${taxSavings.taxWithExpenses.toLocaleString()}</div>
      </div>
    </div>
    <div class="savings-banner">
      <div style="font-size:18px; margin-bottom:10px; opacity:0.9">POTENTIAL TAX SAVINGS</div>
      <div style="font-size:42px; font-weight:bold">₦${taxSavings.savings.toLocaleString()}</div>
      <div style="font-size:14px; margin-top:10px; opacity:0.8">Legally saved by claiming valid business expenses</div>
    </div>
  </div>

  <div style="margin-top: 50px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
    Generated by DEAP Compliance Engine. This report is for guidance only and does not constitute a Tax Clearance Certificate.
  </div>
</body>
</html>`;

  // Download Logic
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `DEAP-Risk-Report-${date.replace(/\//g, '-')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
