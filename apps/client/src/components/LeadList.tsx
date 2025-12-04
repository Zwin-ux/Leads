import React, { useState, useEffect } from 'react';
import type { Lead } from '@leads/shared';
import { apiService } from '../services/apiService';
import LeadDetailModal from './LeadDetailModal';
import { PipelineView } from './PipelineView';
import AddLeadForm from './AddLeadForm';
import DropZone from './DropZone';

const LeadList: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAdd, setShowAdd] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        try {
            setLoading(true);
            const data = await apiService.getLeads();
            setLeads(data);
        } catch (err) {
            setError("Failed to load leads");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (lead: Lead) => {
        try {
            const newLead = await apiService.createLead(lead);
            setLeads([...leads, newLead]);
            setShowAdd(false);
        } catch (err) {
            console.error("Failed to create lead", err);
            alert("Failed to create lead");
        }
    };

    const handleImport = async (newLeads: Lead[]) => {
        try {
            await apiService.importLeads(newLeads);
            await loadLeads(); // Refresh list
            setShowImport(false);
        } catch (err) {
            console.error("Failed to import leads", err);
            alert("Failed to import leads");
        }
    };

    const handleUpdateLead = async (updatedLead: Lead) => {
        try {
            const saved = await apiService.updateLead(updatedLead);
            setLeads(leads.map(l => l.id === saved.id ? saved : l));
            setSelectedLead(saved);
        } catch (err) {
            console.error("Failed to update lead", err);
            alert("Failed to update lead");
        }
    };

    return (
        <div className="lead-list">
            <div className="header">
                <h1>My Leads</h1>
                {loading && <span style={{ marginLeft: '1rem', color: '#aaa' }}>Loading...</span>}
                {error && <span style={{ marginLeft: '1rem', color: 'red' }}>{error}</span>}
                <div className="actions">
                    <div className="view-toggle" style={{ marginRight: '1rem', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '8px', display: 'inline-flex' }}>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                background: viewMode === 'list' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: 'none',
                                color: viewMode === 'list' ? '#fff' : '#aaa',
                                padding: '4px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('pipeline')}
                            style={{
                                background: viewMode === 'pipeline' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: 'none',
                                color: viewMode === 'pipeline' ? '#fff' : '#aaa',
                                padding: '4px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Pipeline
                        </button>
                    </div>
                    <button className="secondary" onClick={() => setShowImport(true)}>Import Excel</button>
                    <button className="primary" onClick={() => setShowAdd(true)}>+ New Lead</button>
                </div>
            </div>

            {showAdd && <AddLeadForm onAdd={handleAdd} onCancel={() => setShowAdd(false)} />}
            {showImport && <DropZone onImport={handleImport} onCancel={() => setShowImport(false)} />}

            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onUpdate={handleUpdateLead}
                />
            )}

            {viewMode === 'pipeline' ? (
                <PipelineView leads={leads} onLeadClick={setSelectedLead} />
            ) : (
                <div className="grid">
                    {leads.map(lead => (
                        <div key={lead.id} className="lead-card" onClick={() => setSelectedLead(lead)}>
                            <div className="card-header">
                                <h3>{lead.firstName} {lead.lastName}</h3>
                                <span className={`status-badge ${lead.stage.toLowerCase().replace(/\s/g, '-')}`}>
                                    {lead.stage}
                                </span>
                            </div>
                            <p className="company">{lead.company}</p>
                            <div className="card-footer">
                                <span className="last-contact">Last: {lead.lastContactDate}</span>
                                {lead.nextAction && <span className="next-action">👉 {lead.nextAction}</span>}
                            </div>
                            {lead.loanProgram && <div className="lead-program-tag">{lead.loanProgram}</div>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeadList;
