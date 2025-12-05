import React, { useMemo } from 'react';
import type { Lead } from '@leads/shared';
import { authService } from '../services/authService';

interface ProcessorDashboardProps {
    leads: Lead[];
    onUpdateLead: (lead: Lead) => void;
}

export const ProcessorDashboard: React.FC<ProcessorDashboardProps> = ({ leads, onUpdateLead }) => {
    const currentUser = authService.getCurrentUser();


    // Filter for active deals relevant to processing
    const processingLeads = useMemo(() => {
        return leads.filter(lead => {
            // Include deals in Processing, Underwriting, Approved, Closing
            const relevantStages = ['Processing', 'Underwriting', 'Approved', 'Closing'];
            const isRelevantStage = relevantStages.includes(lead.dealStage || '') ||
                ['Qualified', 'Proposal'].includes(lead.stage);

            // If user is a processor, they should see all relevant deals or assigned ones
            // For now, showing all relevant deals to processors for collaboration
            return isRelevantStage;
        }).sort((a, b) => {
            // Sort by urgency (Closing soonest first)
            if (a.dealStage === 'Closing' && b.dealStage !== 'Closing') return -1;
            if (b.dealStage === 'Closing' && a.dealStage !== 'Closing') return 1;
            return new Date(b.lastContactDate || 0).getTime() - new Date(a.lastContactDate || 0).getTime();
        });
    }, [leads]);

    const handleChase = (lead: Lead) => {
        // Simulate sending a chase email
        const updatedLead = {
            ...lead,
            lastContactDate: new Date().toISOString(),
            nextAction: 'Docs Requested: ' + new Date().toLocaleDateString()
        };
        onUpdateLead(updatedLead);
        alert(`📧 Chase email sent to ${lead.company} for missing documents.`);
    };

    return (
        <div className="processor-dashboard" style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
            <div className="header" style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                    📂 Processing Queue
                </h1>
                <p style={{ color: '#64748b' }}>
                    Welcome back, {currentUser?.name.split(' ')[0]}. You have <strong>{processingLeads.length}</strong> active files.
                </p>
            </div>

            <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Processing</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
                        {processingLeads.filter(l => l.dealStage === 'Processing').length}
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Underwriting</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
                        {processingLeads.filter(l => l.dealStage === 'Underwriting').length}
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#10b981' }}>
                        {processingLeads.filter(l => l.dealStage === 'Approved').length}
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Closing</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6' }}>
                        {processingLeads.filter(l => l.dealStage === 'Closing').length}
                    </div>
                </div>
            </div>

            {/* Closing Calendar & Third Party Tracker */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Closing Calendar */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.1rem' }}>📅 Closing Calendar</h3>
                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                        {[0, 1, 2, 3, 4].map(offset => {
                            const date = new Date();
                            date.setDate(date.getDate() + offset * 3);
                            // Mock logic to show specific companies on specific days for demo
                            const closingCompany = offset === 1 ? 'Global Logistics' : offset === 3 ? 'City Bistro' : null;

                            return (
                                <div key={offset} style={{
                                    minWidth: '140px',
                                    padding: '1rem',
                                    background: closingCompany ? '#f3e8ff' : '#f8fafc',
                                    borderRadius: '8px',
                                    border: closingCompany ? '1px solid #d8b4fe' : '1px solid #e2e8f0'
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                                    <div style={{ fontWeight: '600', color: closingCompany ? '#6b21a8' : '#94a3b8', marginTop: '0.25rem' }}>
                                        {closingCompany || 'No Closings'}
                                    </div>
                                    {closingCompany && <div style={{ fontSize: '0.75rem', color: '#7e22ce', marginTop: '0.25rem' }}>Confirmed</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Third Party Tracker */}
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.1rem' }}>📋 Third Party Orders</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.5rem', background: '#f0f9ff', borderRadius: '6px' }}>
                            <span style={{ color: '#0369a1' }}>Appraisals Ordered</span>
                            <strong style={{ color: '#0284c7' }}>3</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.5rem', background: '#fffbeb', borderRadius: '6px' }}>
                            <span style={{ color: '#b45309' }}>Environmental Pending</span>
                            <strong style={{ color: '#d97706' }}>2</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '6px' }}>
                            <span style={{ color: '#b91c1c' }}>Title Reports Due</span>
                            <strong style={{ color: '#dc2626' }}>1</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div className="files-list" style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f1f5f9' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Company / Borrower</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Stage</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Loan Amount</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Missing Items</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#475569', fontWeight: '600' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processingLeads.map(lead => (
                            <tr key={lead.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{lead.company}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{lead.firstName} {lead.lastName}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '999px',
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        background: lead.dealStage === 'Closing' ? '#f3e8ff' :
                                            lead.dealStage === 'Approved' ? '#d1fae5' :
                                                lead.dealStage === 'Underwriting' ? '#fef3c7' : '#e0f2fe',
                                        color: lead.dealStage === 'Closing' ? '#6b21a8' :
                                            lead.dealStage === 'Approved' ? '#065f46' :
                                                lead.dealStage === 'Underwriting' ? '#92400e' : '#0369a1'
                                    }}>
                                        {lead.dealStage || lead.stage}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '1rem' }}>
                                    {lead.loanAmount ? `$${lead.loanAmount.toLocaleString()}` : '-'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {/* Placeholder logic for missing items */}
                                    <div style={{ color: '#ef4444', fontSize: '0.9rem', fontWeight: '500' }}>
                                        {Math.floor(Math.random() * 3) + 1} Docs Pending
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button
                                        onClick={() => handleChase(lead)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            background: 'white',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            color: '#475569',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.borderColor = '#3b82f6';
                                            e.currentTarget.style.color = '#3b82f6';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                            e.currentTarget.style.color = '#475569';
                                        }}
                                    >
                                        <span>📧</span> Chase
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {processingLeads.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        No active files in processing queue.
                    </div>
                )}
            </div>
        </div>
    );
};
