import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

// Types from document intelligence service
export type DocumentModelType =
    | 'prebuilt-tax.us.1040'
    | 'prebuilt-tax.us.1120'
    | 'prebuilt-invoice'
    | 'prebuilt-receipt'
    | 'prebuilt-businessCard'
    | 'prebuilt-idDocument'
    | 'prebuilt-document';

interface ExtractedDocument {
    modelUsed: DocumentModelType;
    confidence: number;
    extractedAt: string;
    tax?: any;
    invoice?: any;
    receipt?: any;
    businessCard?: any;
    idDocument?: any;
    general?: any;
    rawFields?: Record<string, any>;
}

interface DocumentUploaderProps {
    onExtracted?: (result: ExtractedDocument) => void;
    onStipFulfilled?: (stipType: string, document: ExtractedDocument) => void;
    defaultModel?: DocumentModelType | 'auto';
    compact?: boolean;
}

const MODEL_OPTIONS = [
    { id: 'auto', name: 'Auto-Detect', icon: '🔍' },
    { id: 'prebuilt-tax.us.1040', name: 'Form 1040 (Personal Tax)', icon: '📋' },
    { id: 'prebuilt-tax.us.1120', name: 'Form 1120 (Corporate Tax)', icon: '🏢' },
    { id: 'prebuilt-invoice', name: 'Invoice', icon: '📄' },
    { id: 'prebuilt-receipt', name: 'Receipt', icon: '🧾' },
    { id: 'prebuilt-businessCard', name: 'Business Card', icon: '💼' },
    { id: 'prebuilt-idDocument', name: 'ID Document', icon: '🪪' },
    { id: 'prebuilt-document', name: 'General OCR', icon: '📝' },
];

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
    onExtracted,
    onStipFulfilled,
    defaultModel = 'auto',
    compact = false
}) => {
    const [selectedModel, setSelectedModel] = useState<string>(defaultModel);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<ExtractedDocument | null>(null);
    const [error, setError] = useState<string | null>(null);

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

    const uploadDocument = async (file: File) => {
        setUploading(true);
        setProgress(10);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            if (selectedModel !== 'auto') {
                formData.append('model', selectedModel);
            }

            setProgress(30);

            const response = await fetch(`${API_BASE}/api/documents/analyze`, {
                method: 'POST',
                body: formData,
            });

            setProgress(80);

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Upload failed');
            }

            const data = await response.json();
            setProgress(100);

            if (data.success && data.data) {
                setResult(data.data);
                onExtracted?.(data.data);

                // Try to match to a stip type
                const stipType = detectStipType(data.data);
                if (stipType) {
                    onStipFulfilled?.(stipType, data.data);
                }
            }
        } catch (err: any) {
            console.error('Document upload failed:', err);
            setError(err.message || 'Failed to analyze document');
        } finally {
            setUploading(false);
        }
    };

    const detectStipType = (doc: ExtractedDocument): string | null => {
        if (doc.tax) {
            if (doc.tax.formType?.includes('1040')) return 'Personal Tax Return';
            if (doc.tax.formType?.includes('1120')) return 'Corporate Tax Return';
            return 'Tax Returns';
        }
        if (doc.idDocument) return 'ID Verification';
        if (doc.invoice) return 'Invoice';
        if (doc.receipt) return 'Receipt';
        if (doc.businessCard) return 'Contact Info';
        return null;
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            uploadDocument(acceptedFiles[0]);
        }
    }, [selectedModel]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg', '.tiff', '.bmp'],
        },
        maxFiles: 1,
        disabled: uploading,
    });

    const renderExtractedFields = () => {
        if (!result) return null;

        const fields: Array<{ label: string; value: any }> = [];

        if (result.tax) {
            if (result.tax.taxYear) fields.push({ label: 'Tax Year', value: result.tax.taxYear });
            if (result.tax.totalIncome) fields.push({ label: 'Total Income', value: `$${result.tax.totalIncome.toLocaleString()}` });
            if (result.tax.wages) fields.push({ label: 'Wages', value: `$${result.tax.wages.toLocaleString()}` });
            if (result.tax.businessIncome) fields.push({ label: 'Business Income', value: `$${result.tax.businessIncome.toLocaleString()}` });
            if (result.tax.taxableIncome) fields.push({ label: 'Taxable Income', value: `$${result.tax.taxableIncome.toLocaleString()}` });
        }

        if (result.invoice) {
            if (result.invoice.vendorName) fields.push({ label: 'Vendor', value: result.invoice.vendorName });
            if (result.invoice.invoiceId) fields.push({ label: 'Invoice #', value: result.invoice.invoiceId });
            if (result.invoice.amountDue) fields.push({ label: 'Amount Due', value: `$${result.invoice.amountDue.toLocaleString()}` });
            if (result.invoice.dueDate) fields.push({ label: 'Due Date', value: result.invoice.dueDate });
        }

        if (result.receipt) {
            if (result.receipt.merchantName) fields.push({ label: 'Merchant', value: result.receipt.merchantName });
            if (result.receipt.total) fields.push({ label: 'Total', value: `$${result.receipt.total.toLocaleString()}` });
            if (result.receipt.transactionDate) fields.push({ label: 'Date', value: result.receipt.transactionDate });
        }

        if (result.businessCard) {
            const bc = result.businessCard;
            if (bc.firstName || bc.lastName) fields.push({ label: 'Name', value: `${bc.firstName || ''} ${bc.lastName || ''}`.trim() });
            if (bc.company) fields.push({ label: 'Company', value: bc.company });
            if (bc.email) fields.push({ label: 'Email', value: bc.email });
            if (bc.phone) fields.push({ label: 'Phone', value: bc.phone });
        }

        if (result.idDocument) {
            const id = result.idDocument;
            if (id.firstName || id.lastName) fields.push({ label: 'Name', value: `${id.firstName || ''} ${id.lastName || ''}`.trim() });
            if (id.documentNumber) fields.push({ label: 'ID Number', value: id.documentNumber });
            if (id.expirationDate) fields.push({ label: 'Expires', value: id.expirationDate });
        }

        if (result.general) {
            fields.push({ label: 'Pages', value: result.general.pages });
            if (result.general.tables?.length) fields.push({ label: 'Tables Found', value: result.general.tables.length });
        }

        if (fields.length === 0) {
            fields.push({ label: 'Model Used', value: result.modelUsed });
        }

        return (
            <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>✅</span>
                    <span style={{ fontWeight: 600, color: '#166534' }}>Extracted Successfully</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 'auto' }}>
                        Confidence: {(result.confidence * 100).toFixed(0)}%
                    </span>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '8px'
                }}>
                    {fields.map((f, i) => (
                        <React.Fragment key={i}>
                            <span style={{ color: '#64748b', fontWeight: 500 }}>{f.label}:</span>
                            <span style={{ color: '#1e293b' }}>{f.value}</span>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: compact ? '0.5rem' : '1rem' }}>
            {/* Model Selector */}
            {!compact && (
                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                        Document Type
                    </label>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        disabled={uploading}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.9rem',
                            cursor: 'pointer'
                        }}
                    >
                        {MODEL_OPTIONS.map(opt => (
                            <option key={opt.id} value={opt.id}>
                                {opt.icon} {opt.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Drop Zone */}
            <div
                {...getRootProps()}
                style={{
                    border: `2px dashed ${isDragActive ? '#3b82f6' : error ? '#ef4444' : '#cbd5e1'}`,
                    borderRadius: '12px',
                    padding: compact ? '1rem' : '2rem',
                    textAlign: 'center',
                    cursor: uploading ? 'wait' : 'pointer',
                    background: isDragActive ? '#eff6ff' : error ? '#fef2f2' : '#f8fafc',
                    transition: 'all 0.2s'
                }}
            >
                <input {...getInputProps()} />

                {uploading ? (
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                        <div style={{ color: '#3b82f6', fontWeight: 500 }}>Analyzing document...</div>
                        <div style={{
                            marginTop: '1rem',
                            height: '6px',
                            background: '#e2e8f0',
                            borderRadius: '3px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                                width: `${progress}%`,
                                transition: 'width 0.3s'
                            }} />
                        </div>
                    </div>
                ) : error ? (
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❌</div>
                        <div style={{ color: '#dc2626', fontWeight: 500 }}>{error}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                            Click or drag to try again
                        </div>
                    </div>
                ) : result ? (
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                        <div style={{ color: '#166534', fontWeight: 500 }}>Document Analyzed</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                            Drop another file to replace
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📤</div>
                        <div style={{ color: '#475569', fontWeight: 500 }}>
                            {isDragActive ? 'Drop the file here' : 'Drag & drop a document'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                            PDF, PNG, JPG, TIFF supported
                        </div>
                    </div>
                )}
            </div>

            {/* Results Display */}
            {result && renderExtractedFields()}
        </div>
    );
};

export default DocumentUploader;
