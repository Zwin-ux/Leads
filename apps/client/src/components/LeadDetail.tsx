import React, { useState, useEffect } from 'react';
import { excelService } from '../services/excelService';
import type { ColumnMapping } from '../services/excelService';
import { apiService } from '../services/apiService';

const LeadDetail: React.FC = () => {
    const [lead, setLead] = useState<any>(null);
    const [mapping, setMapping] = useState<ColumnMapping | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Register event handler for selection change
        if (typeof Office !== "undefined" && Office.context && Office.context.host === Office.HostType.Excel) {
            Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, handleSelectionChange);
        }
        return () => {
            if (typeof Office !== "undefined" && Office.context && Office.context.host === Office.HostType.Excel) {
                Office.context.document.removeHandlerAsync(Office.EventType.DocumentSelectionChanged, handleSelectionChange);
            }
        };
    }, [mapping]);

    const handleSelectionChange = async () => {
        if (mapping) {
            try {
                const rowData = await excelService.getSelectedRow(mapping);
                setLead(rowData);
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleMapColumns = async () => {
        try {
            const headers = await excelService.scanHeaders();
            const guessed = excelService.guessMapping(headers);
            setMapping(guessed);
            // Also fetch current selection immediately
            const rowData = await excelService.getSelectedRow(guessed);
            setLead(rowData);
        } catch (e: any) {
            console.error(e);
            setError("Failed to map columns. Ensure you are in Excel.");
            // Fallback for dev/testing outside Excel
            setLead({
                id: 'mock-excel-lead',
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@example.com",
                company: "Acme Corp (Mock)",
                stage: "New"
            });
        }
    };

    const handleSaveToCrm = async () => {
        if (!lead) return;
        try {
            // If lead doesn't have an ID, generate one or let backend handle it.
            // For now, we'll assume new lead from Excel needs a new ID.
            const leadToSave = { ...lead, id: lead.id || Date.now().toString() };
            await apiService.createLead(leadToSave);
            alert("Lead saved to CRM!");
        } catch (e) {
            console.error(e);
            alert("Failed to save lead.");
        }
    };

    if (!lead) {
        return (
            <div className="lead-detail-empty">
                <h3>No Lead Selected</h3>
                <p>Select a row in Excel to view details.</p>
                <button onClick={handleMapColumns}>Connect & Map Columns</button>
                {error && <p className="error">{error}</p>}
            </div>
        );
    }

    return (
        <div className="lead-detail">
            <h2>{lead.firstName} {lead.lastName}</h2>
            <p>{lead.company}</p>
            <div className="lead-actions">
                <button className="primary" onClick={handleSaveToCrm}>Save to CRM</button>
                <button className="secondary">Email</button>
                <button className="secondary">Call</button>
            </div>
            <div className="lead-info">
                <label>Email</label>
                <span>{lead.email}</span>
                <label>Stage</label>
                <span>{lead.stage}</span>
            </div>
        </div>
    );
};

export default LeadDetail;
