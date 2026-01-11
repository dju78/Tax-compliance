import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { DividendVoucher, Company } from '../engine/types';

// Register standard fonts
Font.register({
    family: 'Helvetica',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v1/1PTSg8zYS_SKfqw6eTmZ0w.ttf', fontWeight: 400 },
        { src: 'https://fonts.gstatic.com/s/helveticaneue/v1/1PTSg8zYS_SKfqw6eTmZ0w.ttf', fontWeight: 700 }, // Fallback for bold if specific ttf not found, standard Helvetica is usually built-in but explicit helps
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.5,
        color: '#333'
    },
    header: {
        marginBottom: 20,
        borderBottom: '2px solid #333',
        paddingBottom: 10
    },
    companyName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center',
        textTransform: 'uppercase'
    },
    grid: {
        display: 'flex',
        flexDirection: 'row',
        marginBottom: 10
    },
    col2: {
        width: '50%'
    },
    label: {
        color: '#666',
        fontSize: 8,
        marginBottom: 2
    },
    value: {
        fontSize: 10,
        fontWeight: 'bold'
    },
    section: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f9fafb',
        borderRadius: 4
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        borderBottom: '1px solid #ddd',
        paddingBottom: 4
    },
    table: {
        width: '100%',
        marginTop: 10,
        marginBottom: 10
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 6
    },
    headerRow: {
        backgroundColor: '#f3f4f6',
        borderBottomWidth: 0
    },
    cellDesc: {
        width: '70%'
    },
    cellAmount: {
        width: '30%',
        textAlign: 'right'
    },
    totalRow: {
        flexDirection: 'row',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 2,
        borderTopColor: '#333'
    },
    signatureBlock: {
        marginTop: 40,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    signatureBox: {
        width: '45%',
        borderTop: '1px solid #333',
        paddingTop: 8
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: '#999',
        fontSize: 8,
        borderTop: '1px solid #eee',
        paddingTop: 10
    }
});

interface DividendVoucherPDFProps {
    voucher: DividendVoucher;
    company: Company;
}

export function DividendVoucherPDF({ voucher, company }: DividendVoucherPDFProps) {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.companyName}>{company.name}</Text>
                    <Text>{company.address || 'Registered Office Address not set'}</Text>
                    <Text>Reg No: {company.reg_number || 'N/A'}</Text>
                </View>

                <Text style={styles.title}>Dividend Voucher</Text>

                {/* Voucher Meta */}
                <View style={styles.grid}>
                    <View style={styles.col2}>
                        <Text style={styles.label}>Voucher Number</Text>
                        <Text style={styles.value}>{voucher.voucher_number}</Text>
                    </View>
                    <View style={styles.col2}>
                        <Text style={styles.label}>Date of Payment</Text>
                        <Text style={styles.value}>{new Date(voucher.date_of_payment).toLocaleDateString()}</Text>
                    </View>
                </View>

                <View style={styles.grid}>
                    <View style={styles.col2}>
                        <Text style={styles.label}>Tax Year</Text>
                        <Text style={styles.value}>{voucher.tax_year_label}</Text>
                    </View>
                    <View style={styles.col2}>
                        <Text style={styles.label}>Share Class</Text>
                        <Text style={styles.value}>{voucher.share_class}</Text>
                    </View>
                </View>

                {/* Shareholder */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Shareholder Details</Text>
                    <Text style={styles.label}>To:</Text>
                    <Text style={styles.value}>{voucher.shareholder_name}</Text>
                    <Text style={{ fontSize: 9, marginTop: 4 }}>{voucher.shareholder_address}</Text>
                </View>

                {/* Distribution Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Distribution Details</Text>

                    {/* Table Header */}
                    <View style={[styles.row, styles.headerRow]}>
                        <Text style={styles.cellDesc}>Description</Text>
                        <Text style={styles.cellAmount}>Amount</Text>
                    </View>

                    {/* Lines */}
                    {voucher.lines.map((line) => (
                        <View key={line.id} style={styles.row}>
                            <Text style={styles.cellDesc}>{line.description}</Text>
                            <Text style={styles.cellAmount}>
                                {`N${line.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </Text>
                        </View>
                    ))}

                    {/* Total */}
                    <View style={styles.totalRow}>
                        <Text style={[styles.cellDesc, { fontWeight: 'bold' }]}>Gross Dividend Payable</Text>
                        <Text style={[styles.cellAmount, { fontWeight: 'bold' }]}>
                            {`N${voucher.gross_dividend.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </Text>
                    </View>

                    <View style={[styles.totalRow, { borderTopWidth: 0, marginTop: 4 }]}>
                        <Text style={styles.cellDesc}>Tax Credit (Not applicable)</Text>
                        <Text style={styles.cellAmount}>
                            {`N${(0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </Text>
                    </View>
                </View>

                {/* Tax Note */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 9, fontStyle: 'italic', color: '#666' }}>
                        * Tax Credit: From 6 April 2016, the 10% dividend tax credit was abolished and replaced by a tax-free Dividend Allowance.
                        This voucher confirms the distribution made to you. You should retain this for your records.
                    </Text>
                </View>

                {/* Signatures */}
                <View style={styles.signatureBlock}>
                    <View style={styles.signatureBox}>
                        <Text style={styles.label}>Authorised By:</Text>
                        <Text style={{ marginTop: 20, fontWeight: 'bold' }}>{voucher.authorised_by_name || '____________________'}</Text>
                        <Text style={styles.label}>{voucher.authorised_by_role || 'Director'}</Text>
                    </View>

                    <View style={styles.signatureBox}>
                        <Text style={styles.label}>Received By:</Text>
                        <Text style={{ marginTop: 20, fontWeight: 'bold' }}>{voucher.received_by_name || '____________________'}</Text>
                        <Text style={styles.label}>Shareholder</Text>
                    </View>
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Generated by DEAP - Nigeria Tax Automator | {company.name} | {voucher.voucher_number}
                </Text>

            </Page>
        </Document>
    );
}
