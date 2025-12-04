import React, { useState, useEffect } from 'react';
import type { Lead } from '@leads/shared';
import { apiService } from '../services/apiService';
import { TEAM_MEMBERS } from '../services/authService';
import LeadDetailModal from './LeadDetailModal';
import { PipelineView } from './PipelineView';
import AddLeadForm from './AddLeadForm';
import DropZone from './DropZone';
import logo from '../assets/ampac-logo-v2.png';

const LeadList: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
    const [selectedOwner, setSelectedOwner] = useState<string>('All');

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        try {
            setLoading(true);
            const data = await apiService.getLeads();
            setLeads(data);
        } catch (err) {
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

    const handleLeadMove = async (leadId: string, newStage: string) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead || lead.dealStage === newStage) return;

        // Optimistic update
        const updatedLead = { ...lead, dealStage: newStage as any };
        setLeads(leads.map(l => l.id === leadId ? updatedLead : l));

        try {
            await apiService.updateLead(updatedLead);
        } catch (err) {
            console.error("Failed to move lead", err);
            // Revert on failure
            setLeads(leads.map(l => l.id === leadId ? lead : l));
            alert("Failed to move lead");
        }
    };

    const filteredLeads = selectedOwner === 'All'
        ? leads
        : leads.filter(l => l.owner === selectedOwner);

    return (
        <div className="lead-list">
            <div className="header">
                <div className="header-title">
                    <h1>My Leads</h1>
                    {loading && <span className="loading-badge">Syncing...</span>}
                </div>
                <div className="actions">
                    <select
                        value={selectedOwner}
                        onChange={(e) => setSelectedOwner(e.target.value)}
                        className="owner-filter"
                        style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            marginRight: '1rem',
                            background: 'white',
                            color: '#1e293b'
                        }}
                    >
                        <option value="All">All Team Leads</option>
                        {TEAM_MEMBERS.map(m => (
                            <option key={m.email} value={m.name}>{m.name}</option>
                        ))}
                    </select>

                    <div className="segmented-control">
                        <button
                            className={viewMode === 'list' ? 'active' : ''}
                            onClick={() => setViewMode('list')}
                        >
                            <span>📄</span> List
                        </button>
                        <button
                            className={viewMode === 'pipeline' ? 'active' : ''}
                            onClick={() => setViewMode('pipeline')}
                        >
                            <span>📊</span> Pipeline
                        </button>
                    </div>
                    <button className="btn-secondary" onClick={() => setShowImport(true)}>
                        <span className="icon">📥</span> Import Excel
                    </button>
                    <button className="btn-primary" onClick={() => setShowAdd(true)}>
                        <span className="icon">＋</span> New Lead
                    </button>
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

            {!loading && filteredLeads.length === 0 ? (
                <div className="empty-state">
                    <img src={logo} alt="AmPac" style={{ height: '80px', opacity: 0.2, marginBottom: '1.5rem', filter: 'grayscale(100%)' }} />
                    <h3>No leads found</h3>
                    <p>Get started by importing your spreadsheet or adding a lead manually.</p>
                    <div className="empty-actions">
                        <button className="btn-primary" onClick={() => setShowImport(true)}>Import Excel File</button>
                        <button className="btn-secondary" onClick={() => setShowAdd(true)}>Add Manually</button>
                    </div>
                </div>
            ) : viewMode === 'pipeline' ? (
                <PipelineView leads={filteredLeads} onLeadClick={setSelectedLead} onLeadMove={handleLeadMove} />
            ) : (
                <div className="grid">
                    {filteredLeads.map(lead => (
                        <div key={lead.id} className="lead-card" onClick={() => setSelectedLead(lead)}>
                            <div className="card-header">
                                <h3>{lead.firstName} {lead.lastName}</h3>
                                <span className={`status-badge ${lead.stage.toLowerCase().replace(/\s/g, '-')}`}>
                                    {lead.stage}
                                </span>
                            </div>
                            <p className="company">{lead.company}</p>
                            {lead.owner && <div className="owner-tag" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>👤 {lead.owner}</div>}
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
