import React, { useMemo, useState } from 'react';
import type { Lead } from '@leads/shared';
import { authService } from '../services/authService';

interface LODashboardProps {
    leads: Lead[];
    onUpdateLead: (lead: Lead) => void;
}

export const LODashboard: React.FC<LODashboardProps> = ({ leads, onUpdateLead }) => {
    const currentUser = authService.getCurrentUser();
    const [showStructurer, setShowStructurer] = useState<string | null>(null);

    // Filter leads relevant to LO (Structuring, Underwriting, Approved)
    const activeDeals = useMemo(() => {
        const relevantStages = ['Qualified', 'Proposal', 'Negotiation', 'Processing', 'Underwriting', 'Approved'];
        return leads.filter(lead =>
            relevantStages.includes(lead.stage) ||
            relevantStages.includes(lead.dealStage || '')
        ).sort((a, b) => new Date(b.lastContactDate || 0).getTime() - new Date(a.lastContactDate || 0).getTime());
    }, [leads]);

    const handleBankUpdate = (lead: Lead, bankName: string) => {
        const updatedLead = {
            ...lead,
            notes: [
                {
                    id: Date.now().toString(),
                    content: `Bank Partner Update: Interest from ${bankName}`,
                    timestamp: new Date().toISOString(),
                    author: currentUser?.name || 'System',
                    type: 'UserNote' as const
                },
                ...(lead.notes || [])
            ]
        };
        onUpdateLead(updatedLead);
    };

    return (
        <div className="lo-dashboard" style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
            <div className="header" style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                    💼 Loan Officer Command
                </h1>
                <p style={{ color: '#64748b' }}>
                    Welcome back, {currentUser?.name.split(' ')[0]}. You have <strong>{activeDeals.length}</strong> active deals in motion.
                </p>
            </div>

            {/* Active Deals Portfolio */}
            <div className="portfolio-card" style={{ background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden', marginBottom: '2rem' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', color: '#1e293b', margin: 0 }}>Active Portfolio</h2>
                    <button style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                        + New Deal
                    </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f1f5f9' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Borrower</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Stage</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Loan Amount</th>
                            <th style={{ padding: '1rem', textAlign: 'left', color: '#475569', fontWeight: '600' }}>Bank Partner</th>
                            <th style={{ padding: '1rem', textAlign: 'right', color: '#475569', fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeDeals.map(lead => (
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
                                        background: lead.dealStage === 'Approved' ? '#d1fae5' : '#e0f2fe',
                                        color: lead.dealStage === 'Approved' ? '#065f46' : '#0369a1'
                                    }}>
                                        {lead.dealStage || lead.stage}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '1rem' }}>
                                    {lead.loanAmount ? `$${lead.loanAmount.toLocaleString()}` : '-'}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <select
                                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100%' }}
                                        onChange={(e) => handleBankUpdate(lead, e.target.value)}
                                    >
                                        <option value="">Select Bank...</option>
                                        <option value="Wells Fargo">Wells Fargo</option>
                                        <option value="Chase">Chase</option>
                                        <option value="Bank of America">Bank of America</option>
                                        <option value="US Bank">US Bank</option>
                                        <option value="CDC Small Business">CDC Small Business</option>
                                    </select>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <button
                                        onClick={() => setShowStructurer(lead.id)}
                                        style={{ marginRight: '0.5rem', padding: '0.5rem', background: 'none', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                                        title="Structure Deal"
                                    >
                                        🏗️
                                    </button>
                                    <button
                                        style={{ padding: '0.5rem', background: 'none', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                                        title="View Details"
                                    >
                                        ➡️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Simple Sources & Uses Modal (Mock) */}
            {showStructurer && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
                        <h3 style={{ marginTop: 0 }}>🏗️ Deal Structurer</h3>
                        <p>Quick Sources & Uses for <strong>{activeDeals.find(l => l.id === showStructurer)?.company}</strong></p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b' }}>Purchase Price</label>
                                <input type="number" placeholder="$0.00" style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b' }}>Improvements</label>
                                <input type="number" placeholder="$0.00" style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                            </div>
                        </div>

                        <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Bank Loan (50%)</span>
                                <strong>$0.00</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>SBA 504 (40%)</span>
                                <strong>$0.00</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6', fontWeight: '600' }}>
                                <span>Equity (10%)</span>
                                <strong>$0.00</strong>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => setShowStructurer(null)} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>Close</button>
                            <button onClick={() => setShowStructurer(null)} style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Save Structure</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
