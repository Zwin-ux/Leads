import React, { useState, useEffect, useMemo } from 'react';
import type { Lead } from '@leads/shared';
import { apiService } from '../services/apiService';
import { openaiService, type EmailTemplateType } from '../services/openaiService';
import { authService } from '../services/authService';
import LeadDetailModal from './LeadDetailModal';
import AddLeadForm from './AddLeadForm';
import DropZone from './DropZone';
import { LeadScout } from './LeadScout';
import TransferLeadModal from './TransferLeadModal';
import { BankerRolodex } from './BankerRolodex';
import { MainDashboard } from './MainDashboard';
import { IntegrationsPanel } from './IntegrationsPanel';
import { AdGenerator } from './AdGenerator';
import { SkeletonLoader } from './SkeletonLoader';
import { ErrorBoundary } from './ErrorBoundary';

const LeadList: React.FC = () => {
    const currentUser = authService.getCurrentUser();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [leadToTransfer, setLeadToTransfer] = useState<Lead | null>(null);

    // Determine initial view based on role
    const getInitialView = () => {
        if (!currentUser) return 'list';
        return 'dashboard';
    };

    const [viewMode, setViewMode] = useState<'list' | 'pipeline' | 'generator' | 'bankers' | 'dashboard' | 'integrations' | 'ad_generator'>(getInitialView());
    const [selectedOwner] = useState<string>(currentUser?.name || 'All');
    const [filterStale] = useState(false);


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
        // OPTIMISTIC UPDATE: Update UI immediately
        const previousLeads = [...leads];
        setLeads(leads.map(l => l.id === updatedLead.id ? updatedLead : l));

        try {
            await apiService.updateLead(updatedLead);
            // Succeeded - no action needed, state is already correct
        } catch (err) {
            console.error("Failed to update lead", err);
            // REVERT on failure
            setLeads(previousLeads);
            alert("Failed to update lead. Changes reverted.");
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

        const updatedLead = { ...lead };

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

    const filteredLeads = useMemo(() => {
        let result = leads;

        // Filter by owner
        if (selectedOwner !== 'All') {
            result = result.filter(l => l.owner === selectedOwner);
        }

        // Filter by stale status
        if (filterStale) {
            const now = new Date();
            result = result.filter(l => {
                if (!l.lastContactDate || l.lastContactDate === 'Never') return true;
                const last = new Date(l.lastContactDate);
                const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
                return daysSince > 7;
            });
        }

        return result;
    }, [leads, selectedOwner, filterStale]);

    const stats = useMemo(() => {
        const now = new Date();
        return {
            total: filteredLeads.length,
            newLeads: filteredLeads.filter(l => l.stage === 'New').length,
            inProgress: filteredLeads.filter(l => ['In Process', 'Qualified', 'Proposal', 'Negotiation'].includes(l.stage)).length,
            closing: filteredLeads.filter(l => l.dealStage === 'Closing' || l.dealStage === 'Approved').length,
            funded: filteredLeads.filter(l => l.dealStage === 'Funded').length,
            stale: filteredLeads.filter(l => {
                if (!l.lastContactDate || l.lastContactDate === 'Never') return true;
                const last = new Date(l.lastContactDate);
                const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
                return daysSince > 7;
            }).length
        };
    }, [filteredLeads]);

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

    if (loading) {
        return <SkeletonLoader />;
    }

    if (viewMode === 'generator') {
        return (
            <LeadScout
                onAddLead={handleAddFromGenerator}
                onCancel={() => setViewMode('dashboard')}
            />
        );
    }

    // ... existing view modes ...
    if (viewMode === 'bankers') {
        return (
            <div className="lead-list" style={{ padding: '1rem' }}>
                <BankerRolodex onBack={() => setViewMode('dashboard')} />
            </div>
        );
    }

    if (viewMode === 'integrations') {
        return <IntegrationsPanel onBack={() => setViewMode('dashboard')} />;
    }

    if (viewMode === 'ad_generator') {
        return <AdGenerator onBack={() => setViewMode('dashboard')} />;
    }

    // ... existing imports ...

    // MAIN DASHBOARD VIEW (Replaces specific role dashboards)
    if (viewMode === 'dashboard') {
        return (
            <ErrorBoundary name="MainDashboard">
                <MainDashboard
                    leads={leads}
                    onUpdateLead={handleUpdateLead}
                    onViewChange={(mode) => {
                        if (mode === 'import') {
                            setShowImport(true);
                        } else {
                            setViewMode(mode);
                        }
                    }}
                    onAddLead={() => setShowAdd(true)}
                    onEmailLead={handleEmailPreview}
                    onSelectLead={setSelectedLead}
                />
            </ErrorBoundary>
        );
    }

    // LIST VIEW (Legacy/Fallback)
    return (
        <div className="lead-list" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            {/* Modern Dashboard Header */}
            <div style={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
                padding: '1.5rem 2rem',
                color: 'white'
            }}>
                {/* ... existing header content ... */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600 }}>
                            {selectedOwner === 'All' ? '📊 All Pipeline' : `👤 ${selectedOwner.split(' ')[0]}'s Pipeline`}
                        </h1>
                        <p style={{ margin: '0.25rem 0 0 0', opacity: 0.7, fontSize: '0.9rem' }}>
                            {loading ? 'Loading...' : `${stats.total} leads • ${stats.stale > 0 ? `${stats.stale} need attention` : 'All up to date'}`}
                        </p>
                    </div>
                </div>
                {/* ... existing stats cards ... */}
            </div>

            {/* Action Toolbar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 2rem',
                background: 'white',
                borderBottom: '1px solid #e2e8f0',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setViewMode('dashboard')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid #22c55e',
                            background: 'white',
                            color: '#22c55e',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >📈 Dashboard</button>

                    <button
                        onClick={() => setViewMode('list')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: viewMode === 'list' ? '#3b82f6' : '#f1f5f9',
                            color: viewMode === 'list' ? 'white' : '#64748b',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >📋 List</button>

                    <div style={{ width: '1px', background: '#e2e8f0', margin: '0 0.5rem' }} />

                    <button
                        onClick={() => setViewMode('generator')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid #3b82f6',
                            background: 'white',
                            color: '#3b82f6',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >🔍 Find Leads</button>

                    {/* ... other tools ... */}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setShowImport(true)}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 500, cursor: 'pointer' }}
                    >📥 Import</button>
                    <button
                        onClick={() => setShowAdd(true)}
                        style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                    >+ New Lead</button>
                </div>
            </div>

            {/* ... Modal rendering (Add, Import, Transfer, Detail) ... */}
            {showAdd && <AddLeadForm onAdd={handleAdd} onCancel={() => setShowAdd(false)} />}
            {showImport && <DropZone onImport={handleImport} onCancel={() => setShowImport(false)} />}
            {leadToTransfer && <TransferLeadModal lead={leadToTransfer} onClose={() => setLeadToTransfer(null)} onTransfer={handleTransfer} />}
            {selectedLead && (
                <LeadDetailModal
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onUpdate={handleUpdateLead}
                    onDelete={handleDeleteLead}
                />
            )}

            {/* List Content */}
            {
                !loading && filteredLeads.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <h3>No leads found</h3>
                    </div>
                ) : (
                    <div className="grid">
                        {filteredLeads.map(lead => (
                            <div key={lead.id} className="lead-card" onClick={() => setSelectedLead(lead)}>
                                {/* ... lead card content ... */}
                                <div className="card-header">
                                    <h3>{lead.firstName} {lead.lastName}</h3>
                                    <span className={`status-badge ${lead.stage.toLowerCase().replace(/\s/g, '-')}`}>{lead.stage}</span>
                                </div>
                                <p className="company">{lead.company}</p>
                                <div className="card-footer">
                                    <span className="last-contact">Last: {lead.lastContactDate || 'Never'}</span>
                                    {lead.nextAction && <span className="next-action">{lead.nextAction}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }

            {/* Email Preview Modal */}
            {emailPreviewLead && (
                <div className="modal-backdrop" onClick={() => setEmailPreviewLead(null)}>
                    <div className="modal email-preview-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                        <div className="modal-header">
                            <h2>Email Composer</h2>
                            <button className="close-btn" onClick={() => setEmailPreviewLead(null)}>×</button>
                        </div>
                        <div className="modal-body" style={{ padding: '1.5rem' }}>
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
            )}
        </div>
    );
};

export default LeadList;
