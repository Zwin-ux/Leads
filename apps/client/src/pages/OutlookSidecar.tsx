import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import type { Lead } from '@leads/shared';
import M365Actions from '../components/M365Actions';

declare const Office: any;

const OutlookSidecar: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [matchingLead, setMatchingLead] = useState<Lead | null>(null);
    const [senderEmail, setSenderEmail] = useState<string | null>(null);

    useEffect(() => {
        const initOutlook = async () => {
            await Office.onReady();
            if (Office.context.mailbox?.item) {
                const item = Office.context.mailbox.item;
                const email = item.sender ? item.sender.emailAddress : null;
                setSenderEmail(email);

                if (email) {
                    console.log(`Searching for lead with email: ${email}`);
                    const allLeads = await apiService.getLeads();
                    const match = allLeads.find((l: Lead) =>
                        l.email?.toLowerCase() === email.toLowerCase() ||
                        l.contacts?.some((c: any) => c.email?.toLowerCase() === email.toLowerCase())
                    );
                    setMatchingLead(match || null);
                }
            }
            setLoading(false);
        };

        // Fallback for dev mode outside Outlook
        if (typeof Office === 'undefined') {
            console.warn("Office.js not found. Running in dev mode.");
            // Mock matching lead for development
            // setSenderEmail('test@example.com');
            setLoading(false);
        } else {
            initOutlook();
        }
    }, []);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading context...</div>;

    if (!senderEmail && typeof Office !== 'undefined') {
        return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Please open an email to view lead details.</div>;
    }

    if (!matchingLead) {
        return (
            <div style={{ padding: '1.5rem', background: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}>
                <h3 style={{ margin: '0 0 1rem', color: '#0f172a' }}>No Lead Found</h3>
                <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#475569' }}>
                    Sender: <strong>{senderEmail}</strong><br />
                    This person is not in your CRM.
                </div>
                <button
                    onClick={() => alert('Create Lead feature coming soon!')}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    + Create New Lead
                </button>
            </div>
        );
    }

    return (
        <div className="outlook-sidecar" style={{ padding: '1rem', background: '#fff', minHeight: '100vh', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', color: '#0f172a' }}>{matchingLead.company}</h2>
                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                            {matchingLead.firstName} {matchingLead.lastName}
                        </div>
                    </div>
                    <span style={{
                        background: '#e0f2fe',
                        color: '#0369a1',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                    }}>
                        {matchingLead.stage}
                    </span>
                </div>

                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Loan Amount</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                            ${(matchingLead.loanAmount || 0).toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Lead Score</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#22c55e' }}>
                            {matchingLead.leadScore || 0}/100
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Quick Actions</h3>
                <M365Actions lead={matchingLead} />
            </div>

            {/* Link to Full Dashboard */}
            <a
                href={`https://black-smoke-0f61cd71e.3.azurestaticapps.net/?leadId=${matchingLead.id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '0.75rem',
                    background: '#f1f5f9',
                    color: '#475569',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 500
                }}
            >
                Open in Full Dashboard ↗
            </a>
        </div>
    );
};

export default OutlookSidecar;
