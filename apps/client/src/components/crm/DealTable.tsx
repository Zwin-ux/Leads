import React, { useState } from 'react';
import type { Lead } from '@leads/shared';

interface DealTableProps {
    leads: Lead[];
    onRowClick: (lead: Lead) => void;
}

export const DealTable: React.FC<DealTableProps> = ({ leads, onRowClick }) => {
    const [sortField, setSortField] = useState<keyof Lead>('updatedAt');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: keyof Lead) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const sortedLeads = [...leads].sort((a, b) => {
        const valA = a[sortField] || '';
        const valB = b[sortField] || '';

        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const formatCurrency = (amt?: number) => amt ? `$${amt.toLocaleString()}` : '-';

    return (
        <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <Th label="Company" field="company" onClick={handleSort} currentSort={sortField} dir={sortDir} />
                        <Th label="Contact" field="firstName" onClick={handleSort} currentSort={sortField} dir={sortDir} />
                        <Th label="Stage" field="stage" onClick={handleSort} currentSort={sortField} dir={sortDir} />
                        <Th label="Amount" field="loanAmount" onClick={handleSort} currentSort={sortField} dir={sortDir} />
                        <Th label="Last Contact" field="lastContactDate" onClick={handleSort} currentSort={sortField} dir={sortDir} />
                    </tr>
                </thead>
                <tbody>
                    {sortedLeads.map(lead => (
                        <tr
                            key={lead.id}
                            onClick={() => onRowClick(lead)}
                            style={{
                                cursor: 'pointer',
                                borderBottom: '1px solid #f1f5f9',
                                transition: 'background 0.1s'
                            }}
                            className="hover:bg-slate-50"
                        >
                            <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#1e293b' }}>{lead.company}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{lead.firstName} {lead.lastName}</td>
                            <td style={{ padding: '0.75rem 1rem' }}>
                                <span style={{
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '99px',
                                    fontSize: '0.75rem',
                                    background: '#eff6ff',
                                    color: '#2563eb',
                                    fontWeight: 500
                                }}>
                                    {lead.stage}
                                </span>
                            </td>
                            <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{formatCurrency(lead.loanAmount)}</td>
                            <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>{lead.lastContactDate || 'Never'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const Th = ({ label, field, onClick, currentSort, dir }: any) => (
    <th
        onClick={() => onClick(field)}
        style={{
            padding: '0.75rem 1rem',
            textAlign: 'left',
            fontWeight: 600,
            color: '#475569',
            cursor: 'pointer',
            userSelect: 'none'
        }}
    >
        {label} {currentSort === field && (dir === 'asc' ? '↑' : '↓')}
    </th>
);
