import React, { useMemo } from 'react';
import type { Lead } from '@leads/shared';
import { authService } from '../services/authService';
import { PipelineView } from './PipelineView';

interface BDODashboardProps {
    leads: Lead[];
    onUpdateLead: (lead: Lead) => void;
    onFindLeads: () => void;
}

export const BDODashboard: React.FC<BDODashboardProps> = ({ leads, onUpdateLead, onFindLeads }) => {
    const currentUser = authService.getCurrentUser();

    // Filter leads relevant to BDO (New, Qualified, Proposal, Negotiation)
    const bdoLeads = useMemo(() => {
        // If user is a BDO, show their leads. If manager/admin, show all.
        // For this dashboard, we focus on the "Hunting" stages.
        const huntingStages = ['New', 'In Process', 'Qualified', 'Proposal', 'Negotiation'];

        let filtered = leads.filter(l => huntingStages.includes(l.stage) || huntingStages.includes(l.dealStage || ''));

        // If specific BDO is logged in, filter by them (unless they want to see all)
        // For now, let's show all leads assigned to them or unassigned
        if (currentUser && currentUser.role === 'bdo') {
            filtered = filtered.filter(l => l.owner === currentUser.name || l.owner === 'Unassigned');
        }

        return filtered;
    }, [leads, currentUser]);

    const stats = useMemo(() => {
        return {
            new: bdoLeads.filter(l => l.stage === 'New').length,
            working: bdoLeads.filter(l => ['In Process', 'Qualified'].includes(l.stage)).length,
            proposal: bdoLeads.filter(l => ['Proposal', 'Negotiation'].includes(l.stage)).length,
            conversionRate: '12%' // Placeholder for now
        };
    }, [bdoLeads]);

    return (
        <div className="bdo-dashboard" style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                        🚀 Business Development
                    </h1>
                    <p style={{ color: '#64748b' }}>
                        Welcome back, {currentUser?.name.split(' ')[0]}. You have <strong>{bdoLeads.length}</strong> active prospects.
                    </p>
                </div>
                <div>
                    <button
                        onClick={onFindLeads}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <span>🔍</span> Find New Leads
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: '600' }}>New Leads</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>{stats.new}</div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: '600' }}>Working</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>{stats.working}</div>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: '600' }}>Proposals</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>{stats.proposal}</div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: 'white' }}>
                    <div style={{ opacity: 0.8, fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: '600' }}>Conversion Rate</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.conversionRate}</div>
                </div>
            </div>

            {/* Pipeline Board */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <h2 style={{ fontSize: '1.25rem', color: '#1e293b', marginBottom: '1.5rem' }}>My Pipeline</h2>
                <PipelineView
                    leads={bdoLeads}
                    stages={['New', 'In Process', 'Qualified', 'Proposal', 'Negotiation']}
                    onLeadClick={(_lead: Lead) => { /* Handle click - maybe open modal? */ }}
                    onLeadMove={(id, stage) => {
                        const lead = leads.find(l => l.id === id);
                        if (lead) onUpdateLead({ ...lead, stage: stage as any });
                    }}
                />
            </div>
        </div>
    );
};
