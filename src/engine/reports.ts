import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PitResult } from './pit';
import type { CitResult } from './cit';
import type { VatResult } from './vat';
import type { StatementSummary } from './types';

// Extend jsPDF type to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
}

interface ReportData {
    type: 'PIT' | 'CIT' | 'VAT';
    pitResult?: PitResult;
    citResult?: CitResult;
    vatResult?: VatResult;
    statementSummary?: StatementSummary;
    date: Date;
}

export function generatePDFReport(data: ReportData) {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(40, 44, 52);
    doc.text("Nigeria Tax Assessment", pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Generated: ${data.date.toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });
    doc.text("Finance Act 2025 Compliant", pageWidth / 2, 34, { align: 'center' });

    let finalY = 45;

    // Section 1: Statement Summary (if available)
    if (data.statementSummary) {
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("1. Financial Statement Summary", 14, finalY);

        autoTable(doc, {
            startY: finalY + 5,
            head: [['Metric', 'Amount (₦)']],
            body: [
                ['Total Inflow (Credits)', data.statementSummary.total_inflow.toLocaleString()],
                ['Total Outflow (Debits)', data.statementSummary.total_outflow.toLocaleString()],
                ['Net Cash Flow', data.statementSummary.net_cash_flow.toLocaleString()],
                ['Transaction Count', data.statementSummary.transaction_count.toString()]
            ],
            theme: 'grid',
            headStyles: { fillColor: [20, 25, 40] }
        });

        finalY = doc.lastAutoTable.finalY + 15;
    }

    // Section 2: Tax Computation
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("2. Tax Liability Assessment", 14, finalY);
    finalY += 5;

    if (data.type === 'PIT' && data.pitResult) {
        const res = data.pitResult;
        autoTable(doc, {
            startY: finalY,
            head: [['Item', 'Value']],
            body: [
                ['Gross Income', `₦${res.gross_income.toLocaleString()}`],
                // Note: Using reliefs from result
                ['Total Reliefs (Inc. Rent/CRA)', `(₦${res.reliefs.toLocaleString()})`],
                ['Taxable Income', `₦${res.taxable_income.toLocaleString()}`],
                ['Effective Tax Rate', `${(res.effective_rate * 100).toFixed(2)}%`],
                ['Total PIT Payable', `₦${res.tax_payable.toLocaleString()}`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [46, 125, 50] } // Green for PIT
        });
    } else if (data.type === 'CIT' && data.citResult) {
        const res = data.citResult;
        autoTable(doc, {
            startY: finalY,
            head: [['Item', 'Value']],
            body: [
                ['Assessed Category', `${res.category} Company`],
                ['Assessable Profit', `₦${res.assessable_profit.toLocaleString()}`],
                ['CIT Rate', `${res.tax_rate * 100}%`],
                ['CIT Payable', `₦${res.tax_payable.toLocaleString()}`],
                ['Development Levy (4%)', `₦${res.development_levy.toLocaleString()}`],
                ['Total Tax Liability', `₦${(res.tax_payable + res.development_levy).toLocaleString()}`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [21, 101, 192] } // Blue for CIT
        });
    }

    // Footer / Disclaimer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setTextColor(150);
    const disclaimer = "Disclaimer: This document is an estimate based on provided inputs. It does not constitute a legal tax assessment receipt from FIRS/JTB. Consult a chartered accountant for filing.";
    const splitText = doc.splitTextToSize(disclaimer, pageWidth - 30);
    doc.text(splitText, 14, pageHeight - 20);

    // Save
    doc.save(`${data.type}_Assessment_Report.pdf`);
}
