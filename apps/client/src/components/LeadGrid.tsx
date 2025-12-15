import React, { useMemo } from 'react';
import type { Lead } from '@leads/shared';

interface LeadGridProps {
    leads: Lead[];
    onLeadClick: (lead: Lead) => void;
}

export const LeadGrid: React.FC<LeadGridProps> = ({ leads, onLeadClick }) => {
    // Sort leads: Priority (Risk) -> Newest -> Oldest
    const sortedLeads = useMemo(() => {
        return [...leads].sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    }, [leads]);

    const getStatusColor = (stage: string) => {
        switch (stage) {
            case 'New': return '#3b82f6'; // Blue
            case 'In Process': return '#f59e0b'; // Amber
            case 'Underwriting': return '#8b5cf6'; // Purple
            case 'Closing': return '#10b981'; // Green
            case 'Stalled': return '#ef4444'; // Red
            default: return '#64748b'; // Slate
        }
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    };

    const getIdleDays = (date?: string) => {
        if (!date || date === 'Never') return '-';
        const days = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
        return days;
    };

    return (
        <div className="lead-grid-container" style={{ height: '100%', overflow: 'auto', padding: '0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f1f5f9', zIndex: 5, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <tr>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Borrower / Company</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>Loan Amount</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Program</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Owner</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b', fontWeight: 600 }}>Idle (Days)</th>
                        <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600 }}>Next Action</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedLeads.map((lead) => {
                        const idleDays = getIdleDays(lead.lastContactDate);
                        const isStalled = idleDays !== '-' && (idleDays as number) > 7;

                        return (
                            <tr 
                                key={lead.id} 
                                onClick={() => onLeadClick(lead)}
                                style={{ 
                                    borderBottom: '1px solid #e2e8f0', 
                                    cursor: 'pointer', 
                                    background: isStalled ? '#fff1f2' : 'white', // Pale red background for stalled deals
                                    transition: 'background 0.1s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = isStalled ? '#ffe4e6' : '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = isStalled ? '#fff1f2' : 'white'}
                            >
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <span style={{ 
                                        padding: '0.2rem 0.5rem', 
                                        borderRadius: '4px', 
                                        background: `${getStatusColor(lead.dealStage || 'New')}20`, 
                                        color: getStatusColor(lead.dealStage || 'New'),
                                        fontWeight: 600,
                                        fontSize: '0.75rem'
                                    }}>
                                        {lead.dealStage || lead.stage}
                                    </span>
                                </td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{lead.company}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{lead.firstName} {lead.lastName}</div>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                                    {formatCurrency(lead.loanAmount)}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                                    {lead.loanProgram || 'SBA 504'}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>
                                    {lead.owner || 'Unassigned'}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: isStalled ? '#ef4444' : '#64748b', fontWeight: isStalled ? 700 : 400 }}>
                                    {idleDays}
                                </td>
                                <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                                    {lead.nextAction || '-'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
