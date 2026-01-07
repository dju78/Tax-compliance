import { useState, useCallback } from 'react';
import { parseCSV } from '../engine/parser';
import type { Transaction, StatementSummary } from '../engine/types';

interface Props {
    onUpload: (data: { transactions: Transaction[], summary: StatementSummary }) => void;
}

export function UploadZone({ onUpload }: Props) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const processFile = (file: File) => {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            setError('Please upload a valid CSV file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            try {
                const result = parseCSV(text);
                if (result.transactions.length === 0) {
                    setError('No valid transactions found. Check CSV format.');
                } else {
                    setError(null);
                    onUpload(result);
                }
            } catch (err) {
                setError('Failed to parse CSV.');
            }
        };
        reader.readAsText(file);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    }, []);

    return (
        <div
            className={`upload-zone ${isDragging ? 'dragging' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
                border: '2px dashed var(--color-primary-light)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem',
                textAlign: 'center',
                background: isDragging ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
            }}
        >
            <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                id="fileInput"
                onChange={(e) => e.target.files && processFile(e.target.files[0])}
            />
            <label htmlFor="fileInput" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                <h3 style={{ color: 'var(--color-primary)' }}>Drag & Drop Bank Statement (CSV)</h3>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>or click to browse</p>
            </label>
            {error && <p style={{ color: 'var(--color-error)', marginTop: '1rem' }}>{error}</p>}
        </div>
    );
}
