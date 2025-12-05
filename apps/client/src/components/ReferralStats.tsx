import React, { useMemo } from 'react';
import type { Lead, Banker } from '@leads/shared';

interface ReferralStatsProps {
    leads: Lead[];
    bankers: Banker[];
}

export const ReferralStats: React.FC<ReferralStatsProps> = ({ leads, bankers }) => {
    const stats = useMemo(() => {
        const sourceCounts: Record<string, number> = {
            'Banker': 0,
            'Broker': 0,
            'Direct': 0,
            'Other': 0
        };

        const bankerCounts: Record<string, { count: number; funded: number }> = {};

        leads.forEach(lead => {
            // Count by source
            const source = lead.referralSource || 'Direct';
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;

            // Count by banker
            if (lead.bankerId) {
                if (!bankerCounts[lead.bankerId]) {
                    bankerCounts[lead.bankerId] = { count: 0, funded: 0 };
                }
                bankerCounts[lead.bankerId].count++;
                if (lead.dealStage === 'Funded') {
                    bankerCounts[lead.bankerId].funded += (lead.loanAmount || 0);
                }
            }
        });

        // Sort bankers
        const topBankers = Object.entries(bankerCounts)
            .map(([id, data]) => {
                const banker = bankers.find(b => b.id === id);
                return {
                    id,
                    name: banker?.name || 'Unknown Banker',
                    bank: banker?.bank || 'Unknown Bank',
                    ...data
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return { sourceCounts, topBankers };
    }, [leads, bankers]);

    const totalLeads = leads.length || 1; // Avoid divide by zero

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

    return (
        <div className="referral-stats">
            <div className="stats-grid">
                {/* Source Breakdown */}
                <div className="stat-panel">
                    <h3>Lead Sources</h3>
                    <div className="source-bars">
                        {Object.entries(stats.sourceCounts).map(([source, count]) => (
                            <div key={source} className="bar-row">
                                <div className="bar-label">
                                    <span>{source}</span>
                                    <span className="count">{count} ({Math.round((count / totalLeads) * 100)}%)</span>
                                </div>
                                <div className="bar-track">
                                    <div
                                        className="bar-fill"
                                        style={{
                                            width: `${(count / totalLeads) * 100}%`,
                                            background: source === 'Banker' ? '#3b82f6' :
                                                source === 'Broker' ? '#f59e0b' :
                                                    source === 'Direct' ? '#22c55e' : '#94a3b8'
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Bankers */}
                <div className="stat-panel">
                    <h3>Top Referring Bankers</h3>
                    <div className="banker-table">
                        <div className="table-header">
                            <span>Banker</span>
                            <span>Leads</span>
                            <span>Funded Vol</span>
                        </div>
                        {stats.topBankers.length > 0 ? (
                            stats.topBankers.map(b => (
                                <div key={b.id} className="table-row">
                                    <div className="banker-info">
                                        <span className="name">{b.name}</span>
                                        <span className="bank">{b.bank}</span>
                                    </div>
                                    <span className="val-count">{b.count}</span>
                                    <span className="val-funded">{formatCurrency(b.funded)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="empty-text">No banker referrals yet.</div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .referral-stats {
                    margin-top: 1.5rem;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }
                .stat-panel {
                    background: white;
                    border-radius: 12px;
                    padding: 1.25rem;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .stat-panel h3 {
                    margin: 0 0 1rem 0;
                    font-size: 1rem;
                    color: #1e293b;
                }
                .source-bars {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .bar-row {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .bar-label {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.85rem;
                    color: #475569;
                }
                .bar-track {
                    height: 8px;
                    background: #f1f5f9;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .bar-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 0.5s ease;
                }
                .banker-table {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .table-header {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1.5fr;
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #64748b;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid #e2e8f0;
                }
                .table-row {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1.5fr;
                    align-items: center;
                    padding: 0.5rem 0;
                    border-bottom: 1px solid #f8fafc;
                }
                .banker-info {
                    display: flex;
                    flex-direction: column;
                }
                .banker-info .name {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #1e293b;
                }
                .banker-info .bank {
                    font-size: 0.75rem;
                    color: #64748b;
                }
                .val-count {
                    font-weight: 600;
                    color: #3b82f6;
                }
                .val-funded {
                    font-size: 0.85rem;
                    color: #22c55e;
                }
                .empty-text {
                    text-align: center;
                    color: #94a3b8;
                    padding: 1rem;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
};
