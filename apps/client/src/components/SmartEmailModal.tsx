import React, { useState } from 'react';
import type { Lead } from '@leads/shared';
import { apiService } from '../services/apiService';

interface SmartEmailModalProps {
    lead: Lead;
    onClose: () => void;
}

export const SmartEmailModal: React.FC<SmartEmailModalProps> = ({ lead, onClose }) => {
    const [type, setType] = useState('Intro');
    const [loading, setLoading] = useState(false);
    const [generated, setGenerated] = useState<{ subject: string, body: string } | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('msal_token');
            if (!token) throw new Error("Please login to Microsoft first.");

            const res = await apiService.generateSmartEmail(lead, token, type);
            setGenerated(res);
        } catch (err: any) {
            alert("❌ Generation Failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenOutlook = () => {
        if (!generated) return;
        const mailto = `mailto:${lead.email}?subject=${encodeURIComponent(generated.subject)}&body=${encodeURIComponent(generated.body)}`;
        window.open(mailto, '_blank');
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{ background: 'white', width: '600px', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>📧 Smart Email Writer</h2>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                    {['Intro', 'FollowUp', 'Revival', 'Deal Update'].map(t => (
                        <button
                            key={t}
                            onClick={() => { setType(t); setGenerated(null); }}
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                background: type === t ? '#e0f2fe' : 'transparent',
                                color: type === t ? '#0284c7' : '#64748b',
                                borderRadius: '6px',
                                fontWeight: type === t ? 600 : 400,
                                cursor: 'pointer'
                            }}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div style={{ minHeight: '300px', background: '#f8fafc', borderRadius: '8px', padding: '1rem', whiteSpace: 'pre-wrap' }}>
                    {!generated && !loading && (
                        <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '4rem' }}>
                            <p>Current Context: {lead.company}</p>
                            <p>Select a type and click Generate.</p>
                            <button onClick={handleGenerate} className="btn-primary">✨ Generate Draft</button>
                        </div>
                    )}

                    {loading && (
                        <div style={{ textAlign: 'center', color: '#64748b', marginTop: '4rem' }}>
                            <div className="spinner" style={{ fontSize: '2rem', marginBottom: '1rem' }}>🧠</div>
                            <p>Analyzing Outlook history & finding calendar slots...</p>
                        </div>
                    )}

                    {generated && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Subject:</span>
                                <div style={{ fontWeight: 600 }}>{generated.subject}</div>
                            </div>
                            <div style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                                {generated.body}
                                {/* Just rendering text for simplicity, could render HTML dangerously if needed but safer as text for mailto */}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {generated && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                        <button onClick={handleGenerate} className="btn-secondary">↻ Regenerate</button>
                        <button onClick={handleOpenOutlook} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🚀 Open in Outlook
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
