import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PitResult, PitInput } from './pit';
import type { CitResult, CitInput } from './cit';
import type { VatResult, VatInput } from './vat';
import type { CgtResult, CgtInput } from './cgt'; // Note: Only Types here, calculateCGT for Excel
import type { WhtInput } from './wht';
import type { StatementSummary } from './types';

// Extend jsPDF type to include autoTable
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: { finalY: number };
}

interface ReportData {
    type: 'PIT' | 'CIT' | 'VAT' | 'SUMMARY';
    pitResult?: PitResult;
    citResult?: CitResult;
    cgtResult?: CgtResult;
    vatResult?: VatResult;
    statementSummary?: StatementSummary;
    date: Date;
    // For SUMMARY
    pit?: PitInput;
    cit?: CitInput;
    cgt?: CgtInput;
    wht?: WhtInput;
    vat?: VatInput;
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

    if (data.type === 'SUMMARY') {
        doc.text("2. Executive Tax Summary", 14, finalY);
        finalY += 10;

        // Use inputs to estimate if no result provided, or use results if we had them.
        // For simplicity, just listing available figures.

        const summaryBody = [];
        if (data.pit) summaryBody.push(['PIT (Personal Income Tax)', `Gross: N${data.pit.gross_income.toLocaleString()}`]);
        if (data.cit) summaryBody.push(['CIT (Company Income Tax)', `Profit: N${data.cit.assessable_profit.toLocaleString()}`]);
        if (data.cgt) summaryBody.push(['CGT (Capital Gains Tax)', `Gain: N${data.cgt.gain_amount.toLocaleString()}`]);
        if (data.wht) summaryBody.push(['WHT (Withholding Tax)', `Payable: N${data.wht.wht_payable.toLocaleString()} | Credit: N${data.wht.wht_receivable.toLocaleString()}`]);
        if (data.vat) summaryBody.push(['VAT (Value Added Tax)', `Net: N${(data.vat.output_vat - data.vat.input_vat).toLocaleString()}`]);

        autoTable(doc, {
            startY: finalY,
            head: [['Tax Head', 'Key Figures']],
            body: summaryBody,
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66] }
        });

    } else {
        doc.text("2. Tax Liability Assessment", 14, finalY);
        finalY += 5;

        if (data.type === 'PIT' && data.pitResult) {
            const res = data.pitResult;
            autoTable(doc, {
                startY: finalY,
                head: [['Item', 'Value']],
                body: [
                    ['Gross Income', `N${res.gross_income.toLocaleString()}`],
                    ['Total Reliefs (Inc. Rent/CRA)', `(N${res.reliefs.toLocaleString()})`],
                    ['Taxable Income', `N${res.taxable_income.toLocaleString()}`],
                    ['Effective Tax Rate', `${(res.effective_rate * 100).toFixed(2)}%`],
                    ['Total PIT Payable', `N${res.tax_payable.toLocaleString()}`]
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
                    ['Assessable Profit', `N${res.assessable_profit.toLocaleString()}`],
                    ['CIT Rate', `${res.tax_rate * 100}%`],
                    ['CIT Payable', `N${res.tax_payable.toLocaleString()}`],
                    ['Development Levy (4%)', `N${res.development_levy.toLocaleString()}`],
                    ['Total Tax Liability', `N${(res.tax_payable + res.development_levy).toLocaleString()}`]
                ],
                theme: 'striped',
                headStyles: { fillColor: [21, 101, 192] } // Blue for CIT
            });
        }
    }

    // Footer / Disclaimer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setTextColor(150);
    const disclaimer = "Disclaimer: This document is an estimate based on provided inputs. It does not constitute a legal tax assessment receipt from NRS/JTB. Consult a chartered accountant for filing.";
    const splitText = doc.splitTextToSize(disclaimer, pageWidth - 30);
    // Use doc.text for footer, ensure it's at bottom
    doc.text(splitText, 14, pageHeight - 20);

    // Save
    doc.save(`${data.type}_Assessment_Report.pdf`);
}

import * as XLSX from 'xlsx';
import type { Transaction } from './types';
import { calculateCIT } from './cit';
import { calculateCGT } from './cgt';

interface ExcelData {
    transactions: Transaction[];
    summary: StatementSummary;
    pit: PitInput;
    cit: CitInput;
    cgt: CgtInput;
    wht: WhtInput;
    vat: VatInput;
}

export function generateExcelWorkbook(data: ExcelData) {
    const wb = XLSX.utils.book_new();
    const citResult = calculateCIT(data.cit);
    const cgtResult = calculateCGT(data.cgt);
    const vatPayable = data.vat.output_vat - data.vat.input_vat;

    // Sheet 1: Executive Summary
    const summaryData = [
        ["DEAP Tax Filing Pack", ""],
        ["Generated Date", new Date().toLocaleDateString()],
        ["", ""],
        ["Financial Summary", ""],
        ["Total Inflow", data.summary.total_inflow],
        ["Total Outflow", data.summary.total_outflow],
        ["Net Cash Flow", data.summary.net_cash_flow],
        ["Transaction Count", data.summary.transaction_count],
        ["", ""],
        ["CIT Computation", ""],
        ["Turnover", data.cit.turnover],
        ["Assessable Profit", data.cit.assessable_profit],
        ["Total CIT Payable", citResult.tax_payable],
        ["", ""],
        ["CGT Computation", ""],
        ["Total Gain", data.cgt.gain_amount],
        ["CGT Payable", cgtResult.tax_payable],
        ["", ""],
        ["", ""],
        ["WHT Position", ""],
        ["WHT Payable (Liability)", data.wht.wht_payable],
        ["WHT Credit (Asset)", data.wht.wht_receivable],
        ["", ""],
        ["VAT Return", ""],
        ["Total VAT Due", vatPayable]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Sheet 2: Transactions
    const txnData = data.transactions.map(t => ({
        Date: new Date(t.date).toLocaleDateString(),
        Description: t.description,
        Amount: t.amount,
        Category: t.category_name || 'Uncategorized',
        "Tax Tag": t.tax_tag || 'None',
        "Source": t.source_type || 'Manual'
    }));
    const wsTxns = XLSX.utils.json_to_sheet(txnData);
    XLSX.utils.book_append_sheet(wb, wsTxns, "Transactions");

    // Sheet 3: CIT Details
    const citData = [
        ["Field", "Value"],
        ["Turnover", data.cit.turnover],
        ["Assessable Profit", data.cit.assessable_profit],
        ["Category", citResult.category],
        ["CIT Rate", `${citResult.tax_rate * 100}%`],
        ["Total CIT Payable", citResult.tax_payable]
    ];
    const wsCit = XLSX.utils.aoa_to_sheet(citData);
    XLSX.utils.book_append_sheet(wb, wsCit, "CIT Computation");

    // Sheet 4: CGT Details
    const cgtData = [
        ["Field", "Value"],
        ["Entity Type", data.cgt.entity_type],
        ["Turnover (Ref)", data.cgt.turnover],
        ["Total Gain Amount", data.cgt.gain_amount],
        ["Rate Applied", cgtResult.rate_description],
        ["CGT Payable", cgtResult.tax_payable]
    ];
    const wsCgt = XLSX.utils.aoa_to_sheet(cgtData);
    XLSX.utils.book_append_sheet(wb, wsCgt, "CGT Computation");

    // Sheet 5: VAT Details
    const vatData = [
        ["Field", "Value"],
        ["Sales (Vatable Estimate)", data.vat.output_vat / 0.075],
        ["Output VAT", data.vat.output_vat],
        ["Purchases (Vatable Estimate)", data.vat.input_vat / 0.075],
        ["Input VAT", data.vat.input_vat],
        ["Net VAT Payable", vatPayable]
    ];
    const wsVat = XLSX.utils.aoa_to_sheet(vatData);
    XLSX.utils.book_append_sheet(wb, wsVat, "VAT Return");

    // Sheet 6: WHT Schedule
    const whtData = [
        ["Field", "Value"],
        ["Total WHT Payable (Liability)", data.wht.wht_payable],
        ["Total WHT Receivable (Notes)", data.wht.wht_receivable],
        ["Notes / Breakdown", data.wht.notes || '']
    ];
    const wsWht = XLSX.utils.aoa_to_sheet(whtData);
    XLSX.utils.book_append_sheet(wb, wsWht, "WHT Schedule");

    // Save File
    XLSX.writeFile(wb, `DEAP_Filing_Pack_${new Date().toISOString().split('T')[0]}.xlsx`);
}
