import React, { useMemo } from 'react';
import type { Lead } from '@leads/shared';
import { LeadGrid } from './LeadGrid';
import { authService } from '../services/authService';

interface MainDashboardProps {
    leads: Lead[];
    onUpdateLead: (lead: Lead) => void;
    onViewChange: (mode: 'list' | 'pipeline' | 'generator' | 'bankers' | 'integrations' | 'ad_generator' | 'import') => void;
    onAddLead: () => void;
    onEmailLead: (lead: Lead) => void;
    onSelectLead: (lead: Lead) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
    leads,
    onUpdateLead,
    onViewChange,
    onAddLead,
    onSelectLead
}) => {
    const currentUser = authService.getCurrentUser();

    // Initial Load & Polling & Deep Links
    React.useEffect(() => {
        const loadData = () => {
             // Keep for eventual task re-integration, or remove if fully purging
        };
        loadData();
        const interval = setInterval(loadData, 5000); // Poll for updates

        // Deep Link Handling (Teams/Outlook)
        const params = new URLSearchParams(window.location.search);
        const claimLeadId = params.get('claimLead');
        const leadId = params.get('leadId');
        const action = params.get('action');

        if (claimLeadId && currentUser) {
            // JUMP BALL: Claim Lead
            const lead = leads.find(l => l.id === claimLeadId);
            if (lead) {
                const updatedLead = { ...lead, owner: currentUser.name, status: 'In Process' };
                onUpdateLead(updatedLead);
                // Clean URL
                window.history.replaceState({}, '', window.location.pathname);
                // Show notification (simple alert for now)
                alert(`🏀 You successfully claimed ${lead.company}!`);
                onSelectLead(updatedLead);
            }
        }

        if (leadId && action === 'touch') {
            // STALLED DEAL: Touch
            const lead = leads.find(l => l.id === leadId);
            if (lead) {
                const updatedLead = { ...lead, lastContactDate: new Date().toISOString() };
                onUpdateLead(updatedLead);
                window.history.replaceState({}, '', window.location.pathname);
                alert(`✅ ${lead.company} status updated (Stall timer reset).`);
            }
        } else if (leadId) {
            // Just Open
            const lead = leads.find(l => l.id === leadId);
            if (lead) onSelectLead(lead);
        }

        return () => clearInterval(interval);
    }, [leads, currentUser]);

    // Stats Calculation
    const stats = useMemo(() => {
        const activeLeads = leads.filter(l => !['Closed Lost', 'Funded', 'Archived'].includes(l.dealStage || l.stage));
        const pipelineValue = activeLeads.reduce((sum, l) => sum + (l.loanAmount || 0), 0);

        return {
            pipelineValue: (pipelineValue / 1000000).toFixed(1) + 'M',
            activeCount: activeLeads.length
        };
    }, [leads]);

    return (
        <div className="main-dashboard" style={{
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
            height: '100vh',
            background: '#f8fafc',
            overflow: 'hidden'
        }}>
            {/* 1. Header & Toolbar */}
            <div className="dashboard-header" style={{
                background: 'white',
                padding: '1rem 2rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Dashboard</h1>

                    {/* Metrics Pills */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="metric-pill" style={{ display: 'flex', flexDirection: 'column', paddingRight: '1rem', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Pipeline Value</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>${stats.pipelineValue}</span>
                        </div>
                        <div className="metric-pill" style={{ display: 'flex', flexDirection: 'column', paddingRight: '1rem', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Active Deals</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{stats.activeCount}</span>
                        </div>
                        <div className="metric-pill" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Apps / Closing</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                                {leads.filter(l => l.dealStage === 'Application').length} / {leads.filter(l => l.dealStage === 'Closing').length} closings
                            </span>
                        </div>
                    </div>
                </div>

                {/* Toolbar Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => onViewChange('generator')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🔍 Find Leads
                    </button>
                    <button onClick={() => onViewChange('bankers')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', borderColor: '#fcd34d' }}>
                        🏦 Rolodex
                    </button>
                    <div className="dropdown-toolbar" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => onViewChange('integrations')} className="btn-icon" title="Integrations" style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            🔌
                        </button>
                    </div>
                    <div style={{ width: '1px', background: '#e2e8f0', margin: '0 0.5rem' }} />
                    <button 
                        onClick={() => onViewChange('import')}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}
                    >
                        📥 Import / Drop
                    </button>
                    <button onClick={onAddLead} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        + New Lead
                    </button>
                </div>
            </div>

            {/* 2. Main Content Grid (High Density) */}
            <div style={{ padding: '0', height: '100%', overflow: 'hidden' }}>
                <LeadGrid 
                    leads={leads}
                    onLeadClick={onSelectLead}
                />
            </div>
        </div >
    );
};
