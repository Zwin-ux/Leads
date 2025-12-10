import React, { useState } from 'react';
import type { Stipulation } from '../../services/underwritingService';
import { DocumentUploader } from './DocumentUploader';

interface UploadedDoc {
    stipId: string;
    fileName: string;
    extractedAt: string;
    confidence: number;
    summary: string;
}

interface StipsTrackerProps {
    stips: Stipulation[];
    onUpdate: (id: string, status: Stipulation['status']) => void;
}

export const StipsTracker: React.FC<StipsTrackerProps> = ({ stips, onUpdate }) => {
    const [uploadingStipId, setUploadingStipId] = useState<string | null>(null);
    const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc>>({});

    const handleDocumentExtracted = (stipId: string, result: any) => {
        // Store the uploaded document info
        const summary = getSummary(result);
        setUploadedDocs(prev => ({
            ...prev,
            [stipId]: {
                stipId,
                fileName: 'Document',
                extractedAt: result.extractedAt,
                confidence: result.confidence,
                summary
            }
        }));

        // Auto-mark as received
        onUpdate(stipId, 'received');
        setUploadingStipId(null);
    };

    const getSummary = (result: any): string => {
        if (result.tax) {
            return `Tax ${result.tax.taxYear || ''}: $${(result.tax.totalIncome || 0).toLocaleString()} income`;
        }
        if (result.invoice) {
            return `Invoice ${result.invoice.invoiceId || ''}: $${(result.invoice.amountDue || 0).toLocaleString()}`;
        }
        if (result.idDocument) {
            return `ID: ${result.idDocument.firstName || ''} ${result.idDocument.lastName || ''}`;
        }
        return `Extracted with ${(result.confidence * 100).toFixed(0)}% confidence`;
    };

    const getStatusIcon = (status: Stipulation['status']) => {
        switch (status) {
            case 'received': return '✅';
            case 'waived': return '⏭️';
            default: return '⏳';
        }
    };

    return (
        <div className="stips-tracker">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span>📋</span> Required Documents
            </h4>
            <div className="stips-list">
                {stips.map(stip => (
                    <div key={stip.id} className="stip-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                            <span>{getStatusIcon(stip.status)}</span>
                            <span className="stip-desc">{stip.description}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {/* Upload Button */}
                            {stip.status !== 'received' && (
                                <button
                                    onClick={() => setUploadingStipId(uploadingStipId === stip.id ? null : stip.id)}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.8rem',
                                        border: '1px solid #3b82f6',
                                        background: uploadingStipId === stip.id ? '#3b82f6' : 'white',
                                        color: uploadingStipId === stip.id ? 'white' : '#3b82f6',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}
                                >
                                    📤 Upload
                                </button>
                            )}

                            {/* Uploaded Doc Badge */}
                            {uploadedDocs[stip.id] && (
                                <span style={{
                                    fontSize: '0.75rem',
                                    background: '#dcfce7',
                                    color: '#166534',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '4px'
                                }}>
                                    {uploadedDocs[stip.id].summary}
                                </span>
                            )}

                            {/* Status Select */}
                            <select
                                value={stip.status}
                                onChange={(e) => onUpdate(stip.id, e.target.value as any)}
                                className={`status-select ${stip.status}`}
                            >
                                <option value="outstanding">Outstanding</option>
                                <option value="received">Received</option>
                                <option value="waived">Waived</option>
                            </select>
                        </div>

                        {/* Inline Uploader */}
                        {uploadingStipId === stip.id && (
                            <div style={{
                                gridColumn: '1 / -1',
                                marginTop: '0.75rem',
                                padding: '0.75rem',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <DocumentUploader
                                    compact
                                    onExtracted={(result) => handleDocumentExtracted(stip.id, result)}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <style>{`
                .stips-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .stip-item { 
                    display: flex; 
                    flex-wrap: wrap;
                    justify-content: space-between; 
                    align-items: center; 
                    padding: 0.75rem;
                    background: white;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .stip-desc { font-size: 0.9rem; color: #334155; }
                .status-select { 
                    padding: 0.25rem 0.5rem; 
                    border-radius: 4px; 
                    border: 1px solid #cbd5e1; 
                    font-size: 0.85rem;
                    cursor: pointer;
                }
                .status-select.received { background: #dcfce7; color: #166534; border-color: #86efac; }
                .status-select.waived { background: #f1f5f9; color: #64748b; }
                .status-select.outstanding { background: #fef3c7; color: #92400e; border-color: #fcd34d; }
            `}</style>
        </div>
    );
};
