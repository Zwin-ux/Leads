import React, { useState, useEffect, useMemo } from 'react';
import type { Lead } from '@leads/shared';
import { apiService } from '../services/apiService';
import { openaiService, type EmailTemplateType } from '../services/openaiService';
import { TEAM_MEMBERS, authService } from '../services/authService';
import LeadDetailModal from './LeadDetailModal';
import { PipelineView } from './PipelineView';
import AddLeadForm from './AddLeadForm';
import DropZone from './DropZone';
import logo from '../assets/ampac-logo-v2.png';
import { LeadScout } from './LeadScout';
import TransferLeadModal from './TransferLeadModal';
import { BankerRolodex } from './BankerRolodex';
import { ManagerDashboard } from './ManagerDashboard';
import { ProcessorDashboard } from './ProcessorDashboard';
import { UnderwriterDashboard } from './UnderwriterDashboard';
import { BDODashboard } from './BDODashboard';
import { LODashboard } from './LODashboard';

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
        if (currentUser.role === 'bdo') return 'bdo_dashboard';
        if (currentUser.role === 'loan_officer') return 'lo_dashboard';
        if (currentUser.role === 'processor') return 'processor_dashboard';
        if (currentUser.role === 'underwriter') return 'underwriter_dashboard';
        if (currentUser.role === 'manager' || currentUser.role === 'admin') return 'dashboard';
        return 'list';
    };

    const [viewMode, setViewMode] = useState<'list' | 'pipeline' | 'generator' | 'bankers' | 'dashboard' | 'processor_dashboard' | 'underwriter_dashboard' | 'bdo_dashboard' | 'lo_dashboard'>(getInitialView());
    const [selectedOwner, setSelectedOwner] = useState<string>(currentUser?.name || 'All');
    const [filterStale, setFilterStale] = useState(false);

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
            newLeads: filteredLeads.filter(l => (l as any).stage === 'New').length,
            inProgress: filteredLeads.filter(l => (l as any).stage === 'In Process' || (l as any).stage === 'Qualified' || (l as any).stage === 'Proposal' || (l as any).stage === 'Negotiation').length,
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

    if (viewMode === 'generator') {
        return (
            <LeadScout
                onAddLead={handleAddFromGenerator}
                onCancel={() => setViewMode('list')}
            />
        );
    }

    if (viewMode === 'bankers') {
        return (
            <div className="lead-list" style={{ padding: '1rem' }}>
                <BankerRolodex onBack={() => setViewMode('list')} />
            </div>
        );
    }

    if (viewMode === 'processor_dashboard') {
        return <ProcessorDashboard leads={leads} onUpdateLead={handleUpdateLead} />;
    }

    if (viewMode === 'underwriter_dashboard') {
        return <UnderwriterDashboard leads={leads} onUpdateLead={handleUpdateLead} />;
    }

    if (viewMode === 'bdo_dashboard') {
        return <BDODashboard leads={leads} onUpdateLead={handleUpdateLead} onFindLeads={() => setViewMode('generator')} />;
    }

    if (viewMode === 'lo_dashboard') {
        return <LODashboard leads={leads} onUpdateLead={handleUpdateLead} />;
    }

    if (viewMode === 'dashboard') {
        const handleReassignLead = async (leadId: string, newOwner: string) => {
            const leadToUpdate = leads.find(l => l.id === leadId);
            if (!leadToUpdate) return;

            const updated = { ...leadToUpdate, owner: newOwner, updatedAt: new Date().toISOString() };
            setLeads(leads.map(l => l.id === leadId ? updated : l));

            try {
                await apiService.updateLead(updated);
            } catch (err) {
                console.error('Failed to reassign lead:', err);
            }
        };

        return (
            <ManagerDashboard
                leads={leads}
                onReassignLead={handleReassignLead}
                onSelectLead={(lead: Lead) => setSelectedLead(lead)}
                onBack={() => setViewMode('list')}
            />
        );
    }

    return (
        <div className="lead-list" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
            {/* Modern Dashboard Header */}
            <div style={{
                background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
                padding: '1.5rem 2rem',
                color: 'white'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 600 }}>
                            {selectedOwner === 'All' ? '📊 All Pipeline' : `👤 ${selectedOwner.split(' ')[0]}'s Pipeline`}
                        </h1>
                        <p style={{ margin: '0.25rem 0 0 0', opacity: 0.7, fontSize: '0.9rem' }}>
                            {loading ? 'Loading...' : `${stats.total} leads • ${stats.stale > 0 ? `${stats.stale} need attention` : 'All up to date'}`}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                            value={selectedOwner}
                            onChange={(e) => setSelectedOwner(e.target.value)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="All" style={{ color: '#1e293b' }}>All Team Members</option>
                            {currentUser && <option value={currentUser.name} style={{ color: '#1e293b' }}>My Leads</option>}
                            {TEAM_MEMBERS.filter(m => m.name !== currentUser?.name).map(m => (
                                <option key={m.email} value={m.name} style={{ color: '#1e293b' }}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Stats Cards Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', backdropFilter: 'blur(10px)' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.7 }}>New</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.newLeads}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', backdropFilter: 'blur(10px)' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.7 }}>In Progress</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.inProgress}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', backdropFilter: 'blur(10px)' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.7 }}>Closing</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.closing}</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1rem', backdropFilter: 'blur(10px)' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.7 }}>Funded</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.funded}</div>
                    </div>
                    <div style={{ background: stats.stale > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)', borderRadius: '12px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.7 }}>Need Attention</div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stats.stale > 0 ? '#fca5a5' : '#86efac' }}>{stats.stale}</div>
                    </div>
                </div>
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
                    <button
                        onClick={() => setViewMode('pipeline')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: viewMode === 'pipeline' ? '#3b82f6' : '#f1f5f9',
                            color: viewMode === 'pipeline' ? 'white' : '#64748b',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            marginLeft: '0.5rem'
                        }}
                    >📊 Pipeline</button>
                    <button
                        onClick={() => setFilterStale(!filterStale)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: filterStale ? '#ef4444' : '#f1f5f9',
                            color: filterStale ? 'white' : '#64748b',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            marginLeft: '0.5rem'
                        }}
                    >⚠️ Stale Only</button>
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
                    <button
                        onClick={() => setViewMode('bankers')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid #f59e0b',
                            background: 'white',
                            color: '#f59e0b',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >🏦 Bankers</button>
                    <button
                        onClick={() => {
                            if (currentUser?.role === 'bdo') setViewMode('bdo_dashboard');
                            else if (currentUser?.role === 'loan_officer') setViewMode('lo_dashboard');
                            else if (currentUser?.role === 'processor') setViewMode('processor_dashboard');
                            else if (currentUser?.role === 'underwriter') setViewMode('underwriter_dashboard');
                            else setViewMode('dashboard');
                        }}
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
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setShowImport(true)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: 'white',
                            color: '#64748b',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}
                    >📥 Import</button>
                    <button
                        onClick={() => setShowAdd(true)}
                        style={{
                            padding: '0.5rem 1.25rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
                        }}
                    >+ New Lead</button>
                </div>
            </div>

            {showAdd && <AddLeadForm onAdd={handleAdd} onCancel={() => setShowAdd(false)} />}
            {showImport && <DropZone onImport={handleImport} onCancel={() => setShowImport(false)} />}

            {
                leadToTransfer && (
                    <TransferLeadModal
                        lead={leadToTransfer}
                        onClose={() => setLeadToTransfer(null)}
                        onTransfer={handleTransfer}
                    />
                )
            }

            {
                selectedLead && (
                    <LeadDetailModal
                        lead={selectedLead}
                        onClose={() => setSelectedLead(null)}
                        onUpdate={handleUpdateLead}
                        onDelete={handleDeleteLead}
                    />
                )
            }

            {
                !loading && filteredLeads.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4rem 2rem',
                        textAlign: 'center'
                    }}>
                        <img src={logo} alt="AmPac" style={{ height: '80px', opacity: 0.15, marginBottom: '1.5rem', filter: 'grayscale(100%)' }} />
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.25rem' }}>No leads yet</h3>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Get started by finding new businesses or importing from Excel</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setViewMode('generator')}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    color: 'white',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
                                }}
                            >🔍 Find Leads</button>
                            <button onClick={() => setShowImport(true)} className="btn-secondary">📥 Import Excel</button>
                            <button onClick={() => setShowAdd(true)} className="btn-secondary">+ Add Manually</button>
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
                )
            }

            {/* Email Preview Modal */}
            {
                emailPreviewLead && (
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

