import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { importService } from '../services/importService';
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
    const [step, setStep] = useState<'drop' | 'map'>('drop');

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const uploadedFile = acceptedFiles[0];
        setFile(uploadedFile);
        try {
            const { headers, data } = await importService.parseFile(uploadedFile);
            setHeaders(headers);
            setRawData(data);
            setMapping(importService.guessMapping(headers));
            setStep('map');
        } catch (e) {
            console.error("Error parsing file", e);
            alert("Failed to parse Excel file.");
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxFiles: 1
    });

    const handleImport = () => {
        const leads = importService.mapData(rawData, headers, mapping);
        // Assign temp IDs
        const leadsWithIds = leads.map(l => ({ ...l, id: Date.now().toString() + Math.random() } as Lead));
        onImport(leadsWithIds);
    };

    if (step === 'map') {
        return (
            <div className="import-container">
                <h3>Map Columns</h3>
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
            <h3>Import Leads</h3>
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                {isDragActive ?
                    <p>Drop the Excel file here...</p> :
                    <p>Drag & drop an Excel file here, or click to select one</p>
                }
            </div>
            <button className="secondary" onClick={onCancel} style={{ marginTop: '1rem' }}>Cancel</button>
        </div>
    );
};

export default DropZone;
