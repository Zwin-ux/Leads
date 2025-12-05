import React, { useMemo } from 'react';
import type { Lead } from '@leads/shared';
import { authService } from '../services/authService';
import { PipelineView } from './PipelineView';
import { FeeCalculator } from './FeeCalculator';

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
        <div className="dashboard-container">
            {/* Header Section */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1>Business Development</h1>
                    <p className="text-muted mt-1">
                        Welcome back, {currentUser?.name.split(' ')[0]}. You have <strong>{bdoLeads.length}</strong> active prospects.
                    </p>
                </div>
                <div>
                    <button className="btn-primary flex items-center gap-2" onClick={onFindLeads}>
                        <span>🔍</span> Find New Leads
                    </button>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="card-base p-6">
                    <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">New Leads</div>
                    <div className="text-3xl font-bold text-[hsl(var(--action))]">{stats.new}</div>
                </div>
                <div className="card-base p-6">
                    <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Working</div>
                    <div className="text-3xl font-bold text-amber-500">{stats.working}</div>
                </div>
                <div className="card-base p-6">
                    <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Proposals</div>
                    <div className="text-3xl font-bold text-[hsl(var(--success))]">{stats.proposal}</div>
                </div>
                <div className="card-base p-6 bg-slate-900 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="text-xs font-bold opacity-70 uppercase tracking-wider mb-2">Conversion Rate</div>
                        <div className="text-3xl font-bold">{stats.conversionRate}</div>
                    </div>
                </div>
            </div>

            {/* Tools & Pipeline Grid */}
            <div className="grid grid-cols-[2fr_1fr] gap-6">
                {/* Pipeline Board */}
                <div className="card-base p-6 min-h-[600px]">
                    <h2 className="mb-6">My Pipeline</h2>
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

                {/* Right Column: Tools */}
                <div className="flex flex-col gap-6">
                    <FeeCalculator />
                </div>
            </div>

            {/* Utility Styles for this component specifically if needed, but relying on global mostly */}
            <style>{`
                .grid { display: grid; }
                .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
                .grid-cols-[2fr_1fr] { grid-template-columns: 2fr 1fr; }
                .gap-6 { gap: 1.5rem; }
                .flex { display: flex; }
                .flex-col { flex-direction: column; }
                .justify-between { justify-content: space-between; }
                .items-center { align-items: center; }
                .mb-8 { margin-bottom: 2rem; }
                .mb-6 { margin-bottom: 1.5rem; }
                .mb-2 { margin-bottom: 0.5rem; }
                .mt-1 { margin-top: 0.25rem; }
                .p-6 { padding: 1.5rem; }
                .uppercase { text-transform: uppercase; }
                .tracking-wider { letter-spacing: 0.05em; }
                .font-bold { font-weight: 700; }
                .text-3xl { font-size: 2rem; }
                .text-amber-500 { color: #f59e0b; }
                .bg-slate-900 { background: #0f172a; }
                .text-white { color: white; }
                .relative { position: relative; }
                .overflow-hidden { overflow: hidden; }
                .min-h-\[600px\] { min-height: 600px; }
            `}</style>
        </div>
    );
};
