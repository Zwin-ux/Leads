import React from 'react';
import type { Lead } from '@leads/shared';

interface PipelineViewProps {
    leads: Lead[];
    onLeadClick: (lead: Lead) => void;
}

const STAGES = ['Prospecting', 'Prequal', 'App', 'Underwriting', 'Closing'];

export const PipelineView: React.FC<PipelineViewProps> = ({ leads, onLeadClick }) => {
    const getLeadsByStage = (stage: string) => {
        return leads.filter(l => (l.dealStage || 'Prospecting') === stage);
    };

    const getStageTotal = (stage: string) => {
        const stageLeads = getLeadsByStage(stage);
        const total = stageLeads.reduce((sum, lead) => sum + (lead.loanAmount || 0), 0);
        return (total / 1000000).toFixed(1) + 'M';
    };

    return (
        <div className="pipeline-container">
            {STAGES.map(stage => (
                <div key={stage} className="pipeline-column">
                    <div className="column-header">
                        <h3>{stage}</h3>
                        <div className="column-meta">
                            <span className="count-badge">{getLeadsByStage(stage).length}</span>
                            <span className="volume-badge">${getStageTotal(stage)}</span>
                        </div>
                    </div>
                    <div className="column-content">
                        {getLeadsByStage(stage).map(lead => (
                            <div key={lead.id} className="pipeline-card" onClick={() => onLeadClick(lead)}>
                                <div className="card-header">
                                    <span className="company-name">{lead.company || `${lead.firstName} ${lead.lastName}`}</span>
                                    {lead.loanProgram && <span className={`program-tag ${lead.loanProgram}`}>{lead.loanProgram}</span>}
                                </div>
                                <div className="card-body">
                                    <div className="lead-name">{lead.firstName} {lead.lastName}</div>
                                    <div className="lead-financials">
                                        {lead.loanAmount && <span>${(lead.loanAmount / 1000).toFixed(0)}k</span>}
                                        {lead.annualRevenue && <span>Rev: ${(lead.annualRevenue / 1000000).toFixed(1)}M</span>}
                                    </div>
                                </div>
                                {lead.nextAction && (
                                    <div className="card-footer">
                                        <span className="next-action">👉 {lead.nextAction}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
