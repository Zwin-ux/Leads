import React, { useState, useEffect } from 'react';
import type { Lead } from '@leads/shared';
import { apiService } from '../services/apiService';
import { openaiService, type EmailTemplateType } from '../services/openaiService';
import { TEAM_MEMBERS } from '../services/authService';
import LeadDetailModal from './LeadDetailModal';
import { PipelineView } from './PipelineView';
import AddLeadForm from './AddLeadForm';
import DropZone from './DropZone';
import logo from '../assets/ampac-logo-v2.png';
import { LeadGenerator } from './LeadGenerator';
import TransferLeadModal from './TransferLeadModal';

const LeadList: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [leadToTransfer, setLeadToTransfer] = useState<Lead | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'pipeline' | 'generator'>('list');
    const [selectedOwner, setSelectedOwner] = useState<string>('All');

    // Email preview state
    const [emailPreviewLead, setEmailPreviewLead] = useState<Lead | null>(null);
    const [emailContent, setEmailContent] = useState('');
    const [generatingEmail, setGeneratingEmail] = useState(false);
    const [emailTemplateType, setEmailTemplateType] = useState<EmailTemplateType>('intro');

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

    const handleAddFromGenerator = async (lead: Lead) => {
        try {
            const newLead = await apiService.createLead(lead);
            setLeads([...leads, newLead]);
            setViewMode('list'); // Switch back to list to see the new lead
        } catch (err) {
            console.error("Failed to create lead", err);
            alert("Failed to create lead");
        }
    };

    const handleTransfer = async (leadId: string, newOwner: string, message: string, type: 'transfer' | 'collaborate') => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;

        let updatedLead = { ...lead };

        if (type === 'transfer') {
            updatedLead.owner = newOwner;
            updatedLead.notes = [
                {
                    id: crypto.randomUUID(),
                    content: `System: Transferred to ${newOwner}. Note: ${message}`,
                    timestamp: new Date().toISOString(),
                    author: 'System',
                    type: 'SystemEvent'
                },
                ...(updatedLead.notes || [])
            ];
        } else {
            // Collaborate logic (just add a note for now as schema update is complex)
            updatedLead.notes = [
                {
                    id: crypto.randomUUID(),
                    content: `System: Added ${newOwner} as collaborator. Note: ${message}`,
                    timestamp: new Date().toISOString(),
                    author: 'System',
                    type: 'SystemEvent'
                },
                ...(updatedLead.notes || [])
            ];
        }

        try {
            const saved = await apiService.updateLead(updatedLead);
            setLeads(leads.map(l => l.id === saved.id ? saved : l));
            setLeadToTransfer(null);
            alert(type === 'transfer' ? `Lead transferred to ${newOwner}` : `${newOwner} added as collaborator`);
        } catch (err) {
            console.error("Failed to transfer lead", err);
            alert("Failed to transfer lead");
        }
    };

    const handleDeleteLead = async (leadId: string) => {
        if (!window.confirm("Are you sure you want to delete this lead? This action cannot be undone.")) return;

        try {
            await apiService.deleteLead(leadId);
            setLeads(leads.filter(l => l.id !== leadId));
            setSelectedLead(null);
        } catch (err) {
            console.error("Failed to delete lead", err);
            alert("Failed to delete lead");
        }
    };

    const handleEmailPreview = async (lead: Lead, template: EmailTemplateType = 'intro') => {
        setEmailPreviewLead(lead);
        setEmailTemplateType(template);
        setGeneratingEmail(true);
        try {
            const content = await openaiService.generateEmail(lead, template);
            setEmailContent(content);
        } catch (err) {
            console.error("Failed to generate email", err);
            setEmailContent(`Hi ${lead.firstName},\n\nI'd love to connect about financing options for ${lead.company}.\n\nBest regards`);
        } finally {
            setGeneratingEmail(false);
        }
    };

    const handleRegenerateEmail = async (template: EmailTemplateType) => {
        if (!emailPreviewLead) return;
        setEmailTemplateType(template);
        setGeneratingEmail(true);
        try {
            const content = await openaiService.generateEmail(emailPreviewLead, template);
            setEmailContent(content);
        } catch (err) {
            console.error("Failed to regenerate email", err);
        } finally {
            setGeneratingEmail(false);
        }
    };

    const handleSendToOutlook = () => {
        if (!emailPreviewLead || !emailContent) return;
        const subject = encodeURIComponent(`AmPac Business Capital - ${emailPreviewLead.company}`);
        const body = encodeURIComponent(emailContent);
        window.open(`mailto:${emailPreviewLead.email}?subject=${subject}&body=${body}`, '_blank');
        setEmailPreviewLead(null);
        setEmailContent('');
        setEmailTemplateType('intro');
    };

    // Calculate stale color for lead cards
    const getStaleColor = (lastTouched?: string) => {
        if (!lastTouched || lastTouched === 'Never') return '#ef4444';
        const date = new Date(lastTouched);
        if (isNaN(date.getTime())) return '#94a3b8';
        const diffMs = Date.now() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) return '#22c55e';
        if (diffDays <= 14) return '#f59e0b';
        if (diffDays <= 30) return '#f97316';
        return '#ef4444';
    };

    const filteredLeads = selectedOwner === 'All'
        ? leads
        : leads.filter(l => l.owner === selectedOwner);

    if (viewMode === 'generator') {
        return <LeadGenerator onAddLead={handleAddFromGenerator} onCancel={() => setViewMode('list')} />;
    }

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

                    <button
                        className="btn-secondary"
                        onClick={() => setViewMode('generator')}
                        style={{ marginRight: '1rem', background: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd' }}
                    >
                        <span className="icon">🔍</span> Find Leads
                    </button>

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

            {leadToTransfer && (
                <TransferLeadModal
                    lead={leadToTransfer}
                    onClose={() => setLeadToTransfer(null)}
                    onTransfer={handleTransfer}
                />
            )}

            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onUpdate={handleUpdateLead}
                    onDelete={handleDeleteLead}
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
                        <button className="btn-secondary" onClick={() => setViewMode('generator')}>🔍 Find Leads</button>
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
                            <div className="card-meta-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                                {lead.owner && <div className="owner-tag" style={{ fontSize: '0.75rem', color: '#64748b' }}>👤 {lead.owner}</div>}
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        className="icon-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEmailPreview(lead);
                                        }}
                                        title="Draft Email"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '4px' }}
                                    >
                                        📧
                                    </button>
                                    <button
                                        className="icon-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLeadToTransfer(lead);
                                        }}
                                        title="Transfer Lead"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '4px' }}
                                    >
                                        ➡️
                                    </button>
                                </div>
                            </div>
                            <div className="card-footer">
                                <span
                                    className="last-contact"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.35rem'
                                    }}
                                >
                                    <span
                                        className="stale-dot"
                                        style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: getStaleColor(lead.lastContactDate),
                                            flexShrink: 0
                                        }}
                                    />
                                    Last: {lead.lastContactDate || 'Never'}
                                </span>
                                {lead.nextAction && <span className="next-action">{lead.nextAction}</span>}
                            </div>
                            {lead.loanProgram && <div className="lead-program-tag">{lead.loanProgram}</div>}
                        </div>
                    ))}
                </div>
            )}

            {/* Email Preview Modal */}
            {emailPreviewLead && (
                <div className="modal-backdrop" onClick={() => setEmailPreviewLead(null)}>
                    <div className="modal email-preview-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                        <div className="modal-header">
                            <h2>Email Composer</h2>
                            <button className="close-btn" onClick={() => setEmailPreviewLead(null)}>×</button>
                        </div>
                        <div className="modal-body" style={{ padding: '1.5rem' }}>
                            {/* Template Selector */}
                            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <label style={{ fontWeight: 500, color: '#475569' }}>Template:</label>
                                <select
                                    value={emailTemplateType}
                                    onChange={(e) => handleRegenerateEmail(e.target.value as EmailTemplateType)}
                                    disabled={generatingEmail}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        fontSize: '0.9rem',
                                        flex: 1
                                    }}
                                >
                                    <option value="intro">Intro</option>
                                    <option value="followup">Follow-Up</option>
                                    <option value="referral">Referral Partner</option>
                                    <option value="banker">Banker Outreach</option>
                                    <option value="documents">Document Request</option>
                                    <option value="update">Deal Update</option>
                                    <option value="winback">Win Back</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <strong>To:</strong>
                                <span style={{ color: '#475569' }}>{emailPreviewLead.email}</span>
                            </div>
                            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <strong>Subject:</strong>
                                <span style={{ color: '#475569' }}>AmPac Business Capital - {emailPreviewLead.company}</span>
                            </div>
                            {generatingEmail ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ marginBottom: '0.5rem' }}>Generating email...</div>
                                    <div style={{ fontSize: '0.85rem' }}>Personalizing for {emailPreviewLead.firstName}</div>
                                </div>
                            ) : (
                                <textarea
                                    value={emailContent}
                                    onChange={(e) => setEmailContent(e.target.value)}
                                    style={{
                                        width: '100%',
                                        minHeight: '320px',
                                        padding: '1rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontFamily: 'inherit',
                                        fontSize: '0.95rem',
                                        lineHeight: '1.6',
                                        resize: 'vertical'
                                    }}
                                />
                            )}
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
                            <button
                                className="btn-secondary"
                                onClick={() => handleRegenerateEmail(emailTemplateType)}
                                disabled={generatingEmail}
                                style={{ opacity: generatingEmail ? 0.5 : 1 }}
                            >
                                Regenerate
                            </button>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn-secondary" onClick={() => setEmailPreviewLead(null)}>Cancel</button>
                                <button className="btn-primary" onClick={handleSendToOutlook} disabled={generatingEmail}>
                                    Open in Outlook
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default LeadList;

