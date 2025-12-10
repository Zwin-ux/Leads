import React from 'react';
import type { Lead } from '@leads/shared';
import { SmartEmailModal } from './SmartEmailModal';
import { StipulationBoard } from './StipulationBoard';
import { DealDesk } from './DealDesk';

interface PipelineViewProps {
    leads: Lead[];
    onLeadClick: (lead: Lead) => void;
    onLeadMove?: (leadId: string, newStage: string) => void;
    onEmailLead?: (lead: Lead) => void;
    stages?: string[];
}

const DEFAULT_STAGES = ['Prospecting', 'Prequal', 'App', 'Underwriting', 'Closing'];

export const PipelineView: React.FC<PipelineViewProps> = ({ leads, onLeadClick, onLeadMove, stages = DEFAULT_STAGES }) => {
    const [emailModalLead, setEmailModalLead] = React.useState<Lead | null>(null);
    const [stipModalLead, setStipModalLead] = React.useState<Lead | null>(null);
    const [dealDeskLead, setDealDeskLead] = React.useState<Lead | null>(null);
    const [shakingCard, setShakingCard] = React.useState<string | null>(null);

    const getLeadsByStage = (stage: string) => {
        return leads.filter(l => (l.dealStage === stage) || (l.stage === stage));
    };

    const getStageTotal = (stage: string) => {
        const stageLeads = getLeadsByStage(stage);
        const total = stageLeads.reduce((sum, lead) => sum + (lead.loanAmount || 0), 0);
        return (total / 1000000).toFixed(1) + 'M';
    };

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        e.dataTransfer.setData('leadId', leadId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, stage: string) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData('leadId');

        // --- GUARDRAILS START ---
        const lead = leads.find(l => l.id === leadId);
        if (lead) {
            // Rule 1: Cannot move to Underwriting without Loan Amount
            if (stage === 'Underwriting' && (!lead.loanAmount || lead.loanAmount === 0)) {
                setShakingCard(leadId);
                setTimeout(() => setShakingCard(null), 500);
                alert("🚫 Cannot move to Underwriting: Missing Loan Amount.");
                return;
            }

            // Rule 2: Cannot move to Closing without Email
            if (stage === 'Closing' && !lead.email) {
                setShakingCard(leadId);
                setTimeout(() => setShakingCard(null), 500);
                alert("🚫 Cannot move to Closing: Missing Email Address.");
                return;
            }

            // Rule 3: Smart Handoff Trigger (Moving TO Underwriting)
            if (stage === 'Underwriting') {
                setTimeout(async () => {
                    const schedule = window.confirm(`🤝 Moving to Underwriting.\n\nSchedule "Smart Handoff" meeting between BDO & Underwriter?`);
                    if (schedule) {
                        try {
                            const token = localStorage.getItem('msal_token');
                            if (!token) {
                                alert("⚠️ Login with Microsoft to schedule.");
                                return;
                            }
                            const bdo = "ed.ryan@ampac.com";
                            const uw = "doug.underwriter@ampac.com";

                            const { apiService } = await import('../services/apiService');
                            const res = await apiService.scheduleHandoff(lead, token, bdo, uw);
                            alert(`✅ Meeting Scheduled!\n\nSubject: ${res.event.subject}\nTime: ${new Date(res.event.start.dateTime).toLocaleString()}`);
                        } catch (e: any) {
                            alert(`❌ Schedule Failed: ${e.message}`);
                        }
                    }
                }, 200);
            }
        }
        // --- GUARDRAILS END ---

        if (leadId && onLeadMove) {
            onLeadMove(leadId, stage);
        }
    };

    return (
        <div className="pipeline-container" style={{ display: 'flex', height: '100%', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
            {stages.map(stage => (
                <div
                    key={stage}
                    className="pipeline-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage)}
                    style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', background: '#e2e8f0', borderRadius: '8px', maxHeight: '100%' }}
                >
                    <div className="column-header" style={{ padding: '1rem', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', color: '#475569' }}>{stage}</h3>
                        <div className="column-meta" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span className="count-badge" style={{ background: '#94a3b8', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '10px', fontSize: '0.75rem' }}>{getLeadsByStage(stage).length}</span>
                            <span className="volume-badge" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>${getStageTotal(stage)}</span>
                        </div>
                    </div>
                    <div className="column-content" style={{ padding: '0.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {getLeadsByStage(stage).map(lead => (
                            <div
                                key={lead.id}
                                className={`pipeline-card ${shakingCard === lead.id ? 'shake' : ''}`}
                                onClick={() => onLeadClick(lead)}
                                draggable
                                onDragStart={(e) => handleDragStart(e, lead.id)}
                                style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'grab', border: '1px solid transparent', transition: 'all 0.2s' }}
                            >
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span className="company-name" style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{lead.company || `${lead.firstName} ${lead.lastName}`}</span>
                                    {lead.loanProgram && <span className={`program-tag sba-${lead.loanProgram.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.3rem', borderRadius: '4px', background: '#e0f2fe', color: '#0284c7' }}>{lead.loanProgram}</span>}
                                </div>
                                <div className="card-body">
                                    <div className="lead-name" style={{ fontSize: '0.85rem', color: '#64748b' }}>{lead.firstName} {lead.lastName}</div>
                                    <div className="lead-financials" style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                                        {lead.loanAmount && <span>${(lead.loanAmount / 1000).toFixed(0)}k</span>}
                                        {lead.annualRevenue && <span> • Rev: ${(lead.annualRevenue / 1000000).toFixed(1)}M</span>}
                                    </div>
                                </div>
                                <div className="card-footer" style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    {lead.nextAction ? (
                                        <span className="next-action" style={{ fontSize: '0.75rem', color: '#f59e0b' }}>👉 {lead.nextAction}</span>
                                    ) : <span></span>}

                                    {/* Action Buttons */}
                                    <div className="card-actions" style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEmailModalLead(lead); }}
                                            className="icon-btn"
                                            title="Smart Email"
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.8, fontSize: '1rem', padding: '2px' }}
                                        >✉️</button>

                                        {['App', 'Underwriting', 'Closing'].includes(stage) && (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const confirmed = window.confirm(`🚀 Greenlight ${lead.company}?\nThis will create: /Leads/${lead.company} folder structure.`);
                                                    if (!confirmed) return;

                                                    try {
                                                        let token = localStorage.getItem('msal_token');
                                                        if (!token) {
                                                            alert("⚠️ No M365 Token found. Please Login with Microsoft first.");
                                                            return;
                                                        }
                                                        const { apiService } = await import('../services/apiService');
                                                        const res = await apiService.triggerGreenlight(lead, token);
                                                        const open = window.confirm(`✅ Folders Created!\nPath: ${res.path}\n\nOpen in OneDrive?`);
                                                        if (open && res.webUrl) window.open(res.webUrl, '_blank');
                                                    } catch (err: any) {
                                                        alert(`❌ Error: ${err.message}`);
                                                    }
                                                }}
                                                className="icon-btn"
                                                title="Greenlight"
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.8, fontSize: '1rem', padding: '2px' }}
                                            >🚀</button>
                                        )}

                                        {/* Stipulation Manager Button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setStipModalLead(lead); }}
                                            className="icon-btn"
                                            title="Stipulation Manager"
                                            style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.8, fontSize: '1rem', padding: '2px' }}
                                        >🏓</button>

                                        {/* Deal Desk Button (Only for qualified stages) */}
                                        {['Underwriting', 'Closing'].includes(stage) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setDealDeskLead(lead); }}
                                                className="icon-btn"
                                                title="The Deal Desk (Structuring)"
                                                style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: 0.8, fontSize: '1rem', padding: '2px' }}
                                            >🏛️</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {emailModalLead && (
                <SmartEmailModal
                    lead={emailModalLead}
                    onClose={() => setEmailModalLead(null)}
                />
            )}

            {stipModalLead && (
                <StipulationBoard
                    lead={stipModalLead}
                    onUpdateStips={(newStips) => {
                        // Optimistic Update
                        if (onLeadMove) {
                            stipModalLead.stipulations = newStips;
                        }
                    }}
                    onClose={() => setStipModalLead(null)}
                />
            )}

            {dealDeskLead && (
                <DealDesk
                    lead={dealDeskLead}
                    onClose={() => setDealDeskLead(null)}
                />
            )}
        </div>
    );
};
