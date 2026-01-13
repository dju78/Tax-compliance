import Tesseract from 'tesseract.js';

export interface OCRResult {
    text: string;
    amount?: number;
    date?: string; // ISO format YYYY-MM-DD
    merchant?: string;
    confidence: number;
    isLowConfidence: boolean;
}

export const ocrService = {
    processReceipt: async (file: File): Promise<OCRResult> => {
        const timerLabel = `OCR_Process_${Date.now()}`;
        console.time(timerLabel);
        try {
            const worker = await Tesseract.createWorker('eng');

            // Tesseract.js recognizes the file object directly in newer versions
            const result = await worker.recognize(file);
            const text = result.data.text;
            const confidence = result.data.confidence;

            await worker.terminate();

            console.timeEnd(timerLabel);
            console.log("OCR Success", { confidence, textLength: text.length });

            const isLowConfidence = confidence < 70;

            return {
                text,
                amount: extractAmount(text),
                date: extractDate(text),
                merchant: extractMerchant(text),
                confidence,
                isLowConfidence
            };
        } catch (err) {
            console.timeEnd(timerLabel);
            console.error("OCR Failed:", { error: err, fileType: file.type, fileSize: file.size });
            return {
                text: "",
                confidence: 0,
                isLowConfidence: true,
                // Fallback to manual entry if OCR completely fails
                amount: undefined,
                date: undefined
            };
        }
    }
};

// --- Regex Logic ---

function extractAmount(text: string): number | undefined {
    // Strategy:
    // 1. Look for explicit "Total", "Grand Total", "Amount Due" lines.
    // 2. If found, look for number on THAT line.
    // 3. Fallback: Find all "significant" currency-like numbers and take max.

    const lines = text.split('\n');
    const totalKeywords = ['total', 'amount due', 'grand total', 'balance due', 'to pay'];

    // 1. Context Aware Search
    for (const line of lines) {
        const lower = line.toLowerCase();
        if (totalKeywords.some(k => lower.includes(k))) {
            // Check for number on this line
            const matches = extractNumbersFromText(line);
            if (matches.length > 0) {
                // Return the largest number on the 'Total' line (ignoring small bits like '5 items')
                const valid = matches.filter(n => n > 100); // Assuming total > 100 naira usually
                if (valid.length > 0) return Math.max(...valid);
                // If only small numbers, maybe it's "Total items: 2", so ignore.
            }
        }
    }

    // 2. Fallback: Max Number in entire text
    const allNumbers = extractNumbersFromText(text);
    const significantAmounts = allNumbers.filter(a => a > 10); // Ignore tiny noise

    if (significantAmounts.length === 0) return undefined;

    // Return the largest amount (Total)
    return Math.max(...significantAmounts);
}

function extractNumbersFromText(text: string): number[] {
    // Pattern to find standard currency formats: N 1,000.00, 1,000.00, 1000.00
    const amountRegex = /(?:₦|N)?\s*([0-9,]+(?:\.[0-9]{2})?)/gi;
    const matches = [...text.matchAll(amountRegex)];

    return matches.map(match => {
        const raw = match[1].replace(/,/g, '');
        return parseFloat(raw);
    }).filter(val => !isNaN(val));
}

function extractDate(text: string): string | undefined {
    // Supported Formats:
    // DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY
    // DD MMM YYYY, DD-MMM-YYYY (12 Jan 2025)
    // YYYY-MM-DD (ISO)

    // Regex for numeric dates: 
    // Matches 01-12 or 1-31 separator 01-12 separator 20xx or 19xx
    const numericDateRegex = /\b(0?[1-9]|[12][0-9]|3[01])[-/.](0?[1-9]|1[0-2])[-/.]((?:19|20)\d{2})\b/g;

    // Regex for text months:
    // 12 Jan 2025 or 12-Jan-2025
    const textDateRegex = /\b(0?[1-9]|[12][0-9]|3[01])[-/\s](Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[-/\s]((?:19|20)\d{2})\b/gi;

    let match = numericDateRegex.exec(text);

    if (match) {
        // Return in ISO: YYYY-MM-DD
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        return `${year}-${month}-${day}`;
    }

    match = textDateRegex.exec(text);
    if (match) {
        const day = match[1].padStart(2, '0');
        const monthStr = match[2].toLowerCase();
        const year = match[3];

        const months: { [key: string]: string } = {
            jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
            jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
        };

        const month = months[monthStr.substring(0, 3)] || '01';
        return `${year}-${month}-${day}`;
    }

    return undefined;
}

function extractMerchant(text: string): string | undefined {
    const ignoreWords = ['invoice', 'receipt', 'welcome', 'tax', 'tel:', 'date:', 'time:', 'customer', 'copy', 'duplicate'];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);

    for (const line of lines) {
        const lower = line.toLowerCase();
        // Skip if line contains any ignore word
        if (ignoreWords.some(w => lower.includes(w))) continue;

        // Skip if line is mostly numbers (phone number or date)
        if (/\d{4,}/.test(line)) continue;

        // Return first clean line
        return line.substring(0, 50);
    }

    return undefined;
}
