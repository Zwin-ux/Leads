import React, { useState, useMemo } from 'react';
import type { Lead } from '@leads/shared';
import { TEAM_MEMBERS } from '../services/authService';

interface ManagerDashboardProps {
    leads: Lead[];
    onReassignLead: (leadId: string, newOwner: string) => void;
    onSelectLead: (lead: Lead) => void;
    onBack: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
    leads,
    onReassignLead,
    onSelectLead,
    onBack
}) => {
    const [selectedRep, setSelectedRep] = useState<string | null>(null);
    const [reassignLeadId, setReassignLeadId] = useState<string | null>(null);
    const [newOwner, setNewOwner] = useState('');

    // Calculate metrics
    const metrics = useMemo(() => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const funded = leads.filter(l => l.dealStage === 'Funded');
        const closing = leads.filter(l => l.dealStage === 'Closing' || l.dealStage === 'Approved');

        const ytdFunded = funded.reduce((sum, l) => sum + (l.loanAmount || 0), 0);
        const closingThisMonth = closing.filter(l => {
            if (!l.closingDate) return true; // No date = needs attention
            const d = new Date(l.closingDate);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        });

        // Stale leads (not touched in 7+ days)
        const staleLeads = leads.filter(l => {
            if (!l.lastContactDate || l.lastContactDate === 'Never') return true;
            const last = new Date(l.lastContactDate);
            const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
            return daysSince > 7;
        });

        return {
            total: leads.length,
            ytdFunded,
            fundedCount: funded.length,
            closingThisMonth: closingThisMonth.length,
            staleCount: staleLeads.length,
            staleLeads
        };
    }, [leads]);

    // Pipeline by rep
    const pipelineByRep = useMemo(() => {
        const byRep: Record<string, { total: number; new: number; inProcess: number; closing: number }> = {};

        leads.forEach(lead => {
            const owner = lead.owner || 'Unassigned';
            if (!byRep[owner]) {
                byRep[owner] = { total: 0, new: 0, inProcess: 0, closing: 0 };
            }
            byRep[owner].total++;
            if (lead.stage === 'New') byRep[owner].new++;
            if (lead.stage === 'In Process' || lead.dealStage === 'Processing' || lead.dealStage === 'Underwriting') byRep[owner].inProcess++;
            if (lead.dealStage === 'Closing' || lead.dealStage === 'Approved') byRep[owner].closing++;
        });

        return Object.entries(byRep).sort((a, b) => b[1].total - a[1].total);
    }, [leads]);

    // Get rep's leads
    const repLeads = selectedRep
        ? leads.filter(l => l.owner === selectedRep)
        : [];

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

    const handleReassign = (leadId: string) => {
        if (newOwner) {
            onReassignLead(leadId, newOwner);
            setReassignLeadId(null);
            setNewOwner('');
        }
    };

    return (
        <div className="manager-dashboard">
            <div className="dashboard-header">
                <div className="header-left">
                    <button className="btn-secondary" onClick={onBack}>← Back to Leads</button>
                    <h1>Team Dashboard</h1>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="metrics-row">
                <div className="metric-card">
                    <span className="metric-value">{formatCurrency(metrics.ytdFunded)}</span>
                    <span className="metric-label">YTD Funded</span>
                </div>
                <div className="metric-card">
                    <span className="metric-value">{metrics.fundedCount}</span>
                    <span className="metric-label">Deals Closed</span>
                </div>
                <div className="metric-card highlight">
                    <span className="metric-value">{metrics.closingThisMonth}</span>
                    <span className="metric-label">Closing This Month</span>
                </div>
                <div className="metric-card alert">
                    <span className="metric-value">{metrics.staleCount}</span>
                    <span className="metric-label">Stale Leads (7+ days)</span>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Pipeline by Rep */}
                <div className="panel pipeline-panel">
                    <h3>Pipeline by Rep</h3>
                    <div className="rep-list">
                        {pipelineByRep.map(([rep, data]) => (
                            <div
                                key={rep}
                                className={`rep-row ${selectedRep === rep ? 'selected' : ''}`}
                                onClick={() => setSelectedRep(selectedRep === rep ? null : rep)}
                            >
                                <div className="rep-info">
                                    <span className="rep-name">{rep}</span>
                                    <span className="rep-total">{data.total} leads</span>
                                </div>
                                <div className="rep-bars">
                                    <span className="bar new" style={{ width: `${(data.new / data.total) * 100}%` }} title={`${data.new} New`} />
                                    <span className="bar process" style={{ width: `${(data.inProcess / data.total) * 100}%` }} title={`${data.inProcess} In Process`} />
                                    <span className="bar closing" style={{ width: `${(data.closing / data.total) * 100}%` }} title={`${data.closing} Closing`} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bar-legend">
                        <span><span className="dot new" /> New</span>
                        <span><span className="dot process" /> Processing</span>
                        <span><span className="dot closing" /> Closing</span>
                    </div>
                </div>

                {/* Stale Leads Alert */}
                <div className="panel stale-panel">
                    <h3>🚨 Stale Lead Alerts</h3>
                    <div className="stale-list">
                        {metrics.staleLeads.slice(0, 10).map(lead => (
                            <div key={lead.id} className="stale-item">
                                <div className="stale-info" onClick={() => onSelectLead(lead)}>
                                    <span className="stale-company">{lead.company || lead.businessName}</span>
                                    <span className="stale-owner">{lead.owner}</span>
                                </div>
                                <span className="stale-date">{lead.lastContactDate || 'Never'}</span>
                            </div>
                        ))}
                        {metrics.staleLeads.length === 0 && (
                            <div className="empty-state">No stale leads! 🎉</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Rep's Leads (when selected) */}
            {selectedRep && (
                <div className="panel rep-leads-panel">
                    <h3>{selectedRep}'s Leads ({repLeads.length})</h3>
                    <div className="leads-table">
                        <div className="table-header">
                            <span>Company</span>
                            <span>Stage</span>
                            <span>Program</span>
                            <span>Amount</span>
                            <span>Last Touch</span>
                            <span>Actions</span>
                        </div>
                        {repLeads.map(lead => (
                            <div key={lead.id} className="table-row">
                                <span className="company-cell" onClick={() => onSelectLead(lead)}>
                                    {lead.company || lead.businessName}
                                </span>
                                <span>{lead.dealStage || lead.stage}</span>
                                <span>{lead.loanProgram}</span>
                                <span>{lead.loanAmount ? formatCurrency(lead.loanAmount) : '—'}</span>
                                <span>{lead.lastContactDate || 'Never'}</span>
                                <span className="actions-cell">
                                    {reassignLeadId === lead.id ? (
                                        <div className="reassign-form">
                                            <select value={newOwner} onChange={e => setNewOwner(e.target.value)}>
                                                <option value="">Select...</option>
                                                {TEAM_MEMBERS.filter(m => m.name !== selectedRep).map(m => (
                                                    <option key={m.email} value={m.name}>{m.name}</option>
                                                ))}
                                            </select>
                                            <button onClick={() => handleReassign(lead.id)}>✓</button>
                                            <button onClick={() => setReassignLeadId(null)}>✕</button>
                                        </div>
                                    ) : (
                                        <button className="btn-text" onClick={() => setReassignLeadId(lead.id)}>
                                            Reassign
                                        </button>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .manager-dashboard {
                    padding: 1.5rem;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .header-left h1 {
                    margin: 0;
                    font-size: 1.5rem;
                    color: #1e293b;
                }
                .metrics-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                .metric-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.25rem;
                    text-align: center;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    border: 1px solid #e2e8f0;
                }
                .metric-card.highlight {
                    background: linear-gradient(135deg, #e0f2fe, #bae6fd);
                    border-color: #7dd3fc;
                }
                .metric-card.alert {
                    background: linear-gradient(135deg, #fef3c7, #fde68a);
                    border-color: #fcd34d;
                }
                .metric-value {
                    display: block;
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: #1e293b;
                }
                .metric-label {
                    font-size: 0.85rem;
                    color: #64748b;
                }
                .dashboard-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    margin-bottom: 1.5rem;
                }
                .panel {
                    background: white;
                    border-radius: 12px;
                    padding: 1rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    border: 1px solid #e2e8f0;
                }
                .panel h3 {
                    margin: 0 0 1rem 0;
                    font-size: 1rem;
                    color: #1e293b;
                }
                .rep-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .rep-row {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background 0.15s;
                }
                .rep-row:hover {
                    background: #f1f5f9;
                }
                .rep-row.selected {
                    background: #e0f2fe;
                }
                .rep-info {
                    display: flex;
                    flex-direction: column;
                    min-width: 120px;
                }
                .rep-name {
                    font-weight: 500;
                    color: #1e293b;
                    font-size: 0.9rem;
                }
                .rep-total {
                    font-size: 0.75rem;
                    color: #64748b;
                }
                .rep-bars {
                    flex: 1;
                    display: flex;
                    height: 12px;
                    background: #e2e8f0;
                    border-radius: 6px;
                    overflow: hidden;
                }
                .bar {
                    height: 100%;
                }
                .bar.new { background: #3b82f6; }
                .bar.process { background: #f59e0b; }
                .bar.closing { background: #22c55e; }
                .bar-legend {
                    display: flex;
                    gap: 1rem;
                    margin-top: 0.75rem;
                    font-size: 0.75rem;
                    color: #64748b;
                }
                .dot {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-right: 4px;
                }
                .dot.new { background: #3b82f6; }
                .dot.process { background: #f59e0b; }
                .dot.closing { background: #22c55e; }
                .stale-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    max-height: 250px;
                    overflow-y: auto;
                }
                .stale-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.5rem;
                    background: #fef3c7;
                    border-radius: 6px;
                    border-left: 3px solid #f59e0b;
                }
                .stale-info {
                    display: flex;
                    flex-direction: column;
                    cursor: pointer;
                }
                .stale-company {
                    font-weight: 500;
                    color: #1e293b;
                    font-size: 0.9rem;
                }
                .stale-owner {
                    font-size: 0.75rem;
                    color: #64748b;
                }
                .stale-date {
                    font-size: 0.75rem;
                    color: #92400e;
                }
                .empty-state {
                    text-align: center;
                    color: #64748b;
                    padding: 2rem;
                }
                .rep-leads-panel {
                    grid-column: 1 / -1;
                }
                .leads-table {
                    display: flex;
                    flex-direction: column;
                    font-size: 0.85rem;
                }
                .table-header {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
                    gap: 1rem;
                    padding: 0.5rem;
                    background: #f1f5f9;
                    border-radius: 6px;
                    font-weight: 600;
                    color: #475569;
                }
                .table-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
                    gap: 1rem;
                    padding: 0.5rem;
                    border-bottom: 1px solid #e2e8f0;
                    align-items: center;
                }
                .company-cell {
                    color: #3b82f6;
                    cursor: pointer;
                }
                .company-cell:hover {
                    text-decoration: underline;
                }
                .actions-cell {
                    display: flex;
                    gap: 0.25rem;
                }
                .reassign-form {
                    display: flex;
                    gap: 0.25rem;
                    align-items: center;
                }
                .reassign-form select {
                    padding: 0.25rem;
                    font-size: 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                }
                .reassign-form button {
                    padding: 0.2rem 0.4rem;
                    font-size: 0.75rem;
                    border: none;
                    background: #e2e8f0;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .btn-text {
                    background: none;
                    border: none;
                    color: #3b82f6;
                    cursor: pointer;
                    font-size: 0.8rem;
                }
                .btn-text:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
};

export default ManagerDashboard;
