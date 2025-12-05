import React, { useMemo } from 'react';
import type { Lead } from '@leads/shared';
import { authService } from '../services/authService';

interface UnderwriterDashboardProps {
    leads: Lead[];
    onUpdateLead: (lead: Lead) => void;
}

export const UnderwriterDashboard: React.FC<UnderwriterDashboardProps> = ({ leads }) => {
    const currentUser = authService.getCurrentUser();

    // Filter for deals in Underwriting
    const uwQueue = useMemo(() => {
        return leads.filter(lead =>
            lead.dealStage === 'Underwriting' ||
            ((lead as any).stage === 'Qualified' && (lead as any).dealStage === 'Processing') // Incoming
        ).sort((a, b) => {
            // Sort by days in stage (oldest first)
            return new Date(a.lastContactDate || 0).getTime() - new Date(b.lastContactDate || 0).getTime();
        });
    }, [leads]);

    const handleGenerateMemo = (lead: Lead) => {
        alert(`📝 Generating Credit Memo for ${lead.company}...\n\nAI is analyzing financials and drafting the memo.`);
    };

    return (
        <div className="underwriter-dashboard" style={{ padding: '2rem', background: '#f0fdfa', minHeight: '100vh' }}>
            <div className="header" style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#134e4a', marginBottom: '0.5rem' }}>
                    🛡️ Credit Command
                </h1>
                <p style={{ color: '#0f766e' }}>
                    Hello, {currentUser?.name.split(' ')[0]}. You have <strong>{uwQueue.length}</strong> deals for review.
                </p>
            </div>

            <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #0d9488' }}>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Queue</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0d9488' }}>
                        {uwQueue.length}
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Conditions</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#f59e0b' }}>
                        {/* Placeholder */}
                        {Math.floor(uwQueue.length * 1.5)}
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Turn Time</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: '#3b82f6' }}>
                        3.2 <span style={{ fontSize: '1rem', fontWeight: '500', color: '#94a3b8' }}>days</span>
                    </div>
                </div>
            </div>

            <div className="queue-list" style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#ccfbf1' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#115e59', fontWeight: '600' }}>Borrower</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#115e59', fontWeight: '600' }}>Loan Amount</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#115e59', fontWeight: '600' }}>Industry</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#115e59', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#115e59', fontWeight: '600' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uwQueue.map(lead => (
                            <tr key={lead.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{lead.company}</div>
                                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{lead.firstName} {lead.lastName}</div>
                                </td>
                                <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '1rem' }}>
                                    {lead.loanAmount ? `$${lead.loanAmount.toLocaleString()}` : '-'}
                                </td>
                                <td style={{ padding: '1rem', color: '#475569' }}>
                                    {lead.industry || 'Unknown'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '999px',
                                        fontSize: '0.85rem',
                                        fontWeight: '500',
                                        background: '#fef3c7',
                                        color: '#92400e'
                                    }}>
                                        {lead.dealStage || 'In Review'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button
                                        onClick={() => handleGenerateMemo(lead)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            background: '#0f766e',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            boxShadow: '0 2px 4px rgba(15, 118, 110, 0.2)'
                                        }}
                                    >
                                        <span>📝</span> Credit Memo
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {uwQueue.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                        Queue is empty. Great job!
                    </div>
                )}
            </div>
        </div>
    );
};
