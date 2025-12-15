import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { importService } from '../services/importService';
import { apiService } from '../services/apiService';
import type { Lead } from '@leads/shared';
import { StandardFields } from '../services/excelService';
import type { ColumnMapping } from '../services/excelService';

interface DropZoneProps {
    onImport: (leads: Lead[]) => void;
    onCancel: () => void;
}

const DropZone: React.FC<DropZoneProps> = ({ onImport, onCancel }) => {
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [rawData, setRawData] = useState<any[]>([]);
    const [mapping, setMapping] = useState<ColumnMapping>({});
    const [step, setStep] = useState<'drop' | 'map' | 'analyzing'>('drop');
    const [isAutoFilling, setIsAutoFilling] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const uploadedFile = acceptedFiles[0];
        setFile(uploadedFile);

        // Check Type
        const isExcel = uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls');

        if (isExcel) {
            try {
                const { headers, data } = await importService.parseFile(uploadedFile);
                setHeaders(headers);
                setRawData(data);
                setMapping(importService.guessMapping(headers));
                setStep('map');
            } catch (e) {
                console.error("Error parsing Excel", e);
                alert("Failed to parse Excel file.");
            }
        } else {
            // Auto-Fill Mode (PDF/Image)
            setIsAutoFilling(true);
            try {
                const { success, lead } = await apiService.uploadAndAutoFill(uploadedFile);
                if (success && lead) {
                    onImport([lead]); // Success!
                } else {
                    alert("Could not extract lead data.");
                }
            } catch (e) {
                console.error("Auto-Fill Error", e);
                alert("Auto-Fill failed. Please try manual entry.");
                setFile(null);
            } finally {
                setIsAutoFilling(false);
            }
        }
    }, [onImport]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'application/pdf': ['.pdf'],
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg']
        },
        maxFiles: 1,
        disabled: isAutoFilling
    });

    const handleImport = () => {
        const leads = importService.mapData(rawData, headers, mapping);
        // Assign temp IDs
        const leadsWithIds = leads.map(l => ({ ...l, id: Date.now().toString() + Math.random() } as Lead));
        onImport(leadsWithIds);
    };

    if (isAutoFilling) {
        return (
            <div className="import-container" style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem', width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <h3>Analyzing Document...</h3>
                <p>Extracting lead details from {file?.name}</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (step === 'map') {
        return (
            <div className="import-container">
                <h3>Map Excel Columns</h3>
                <p>File: {file?.name}</p>
                <div className="mapping-grid">
                    {StandardFields.map(field => (
                        <div key={field} className="mapping-row">
                            <label>{field}</label>
                            <select
                                value={(mapping as any)[field] || ''}
                                onChange={e => setMapping({ ...mapping, [field]: e.target.value })}
                            >
                                <option value="">-- Ignore --</option>
                                {headers.map(h => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
                <div className="form-actions">
                    <button className="primary" onClick={handleImport}>Import {rawData.length} Leads</button>
                    <button className="secondary" onClick={onCancel}>Cancel</button>
                </div>
            </div>
        );
    }

    return (
        <div className="import-container">
            <h3>Drop to Fill</h3>
            <p className="subtitle" style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Upload an <strong>Excel list</strong> or a single <strong>PDF Application</strong> to auto-create leads.
            </p>
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{ border: '2px dashed #cbd5e1', padding: '3rem', borderRadius: '12px', background: isDragActive ? '#eff6ff' : '#f8fafc', cursor: 'pointer', textAlign: 'center' }}>
                <input {...getInputProps()} />
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</div>
                {isDragActive ?
                    <p style={{ margin: 0, fontWeight: 500, color: '#3b82f6' }}>Drop file now</p> :
                    <p style={{ margin: 0, color: '#475569' }}>Drag & drop Excel or PDF here</p>
                }
            </div>
            <button className="secondary" onClick={onCancel} style={{ marginTop: '1rem' }}>Cancel</button>
        </div>
    );
};

export default DropZone;
