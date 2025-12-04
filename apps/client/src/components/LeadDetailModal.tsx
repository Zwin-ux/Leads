import React, { useState, useEffect } from 'react';
import type { Lead, Banker } from '@leads/shared';
import { bankerService } from '../services/bankerService';

interface LeadDetailModalProps {
    lead: Lead;
    onClose: () => void;
    onUpdate: (updatedLead: Lead) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose, onUpdate }) => {
    const [editedLead, setEditedLead] = useState<Lead>(lead);
    const [referringBanker, setReferringBanker] = useState<Banker | undefined>(undefined);
    const [emailDraft, setEmailDraft] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [businessResearch, setBusinessResearch] = useState<{ summary: string; headcount: string; flags: string[]; news: string } | null>(null);
    const [bankerResearch, setBankerResearch] = useState<{ winRate: string; speed: string; leverage: string } | null>(null);

    useEffect(() => {
        if (lead.bankerId) {
            const banker = bankerService.getBanker(lead.bankerId);
            setReferringBanker(banker);
        }
    }, [lead.bankerId]);

    const handleSave = () => {
        onUpdate(editedLead);
        onClose();
    };

    const handleGenerateEmail = async (type: 'intro' | 'update' | 'voicemail') => {
        setIsGenerating(true);
        // Simulate AI delay
        setTimeout(async () => {
            let content = "";
            if (type === 'intro') {
                content = `Hi ${editedLead.firstName},\n\nI'm reviewing your loan request for ${editedLead.businessName || editedLead.company}. I have a few quick questions to get started.\n\nBest,\nAmPac Team`;
            } else if (type === 'update') {
                content = `Hi ${referringBanker?.name || 'Partner'},\n\nJust wanted to give you a quick update on the ${editedLead.lastName} deal. We are moving to underwriting.\n\nThanks for the referral!`;
            } else {
                content = `Hi ${editedLead.firstName},\n\nI just left you a voicemail regarding your loan application. Please give me a call back when you have a moment.\n\nThanks,`;
            }
            setEmailDraft(content);
            setIsGenerating(false);
        }, 1000);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                {/* BDO Header: Who is this? */}
                <div className="modal-header-bdo">
                    <div className="bdo-title-row">
                        <div>
                            <h2 className="bdo-business-name">{editedLead.businessName || editedLead.company}</h2>
                            <div className="bdo-contact-info">
                                <span>{editedLead.firstName} {editedLead.lastName}</span>
                                <span>•</span>
                                <span>{editedLead.email}</span>
                                {editedLead.phone && (
                                    <>
                                        <span>•</span>
                                        <span>{editedLead.phone}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <button className="close-btn" onClick={onClose}>&times;</button>
                    </div>

                    {/* Referral Card: Who sent them? */}
                    {referringBanker && (
                        <div className="referral-card">
                            <div className="referral-avatar">
                                {referringBanker.name.charAt(0)}
                            </div>
                            <div className="referral-details">
                                <span className="referral-name">Referred by {referringBanker.name}</span>
                                <span className="referral-bank">{referringBanker.title} at {referringBanker.bank}</span>
                            </div>
                            <div className="trust-score">
                                Trust Score: {referringBanker.trustScore}/5
                            </div>
                        </div>
                    )}

                    {/* Deal Chips: What do they want? */}
                    <div className="deal-chips">
                        {editedLead.projectTypes?.map(type => (
                            <span key={type} className="chip project">{type}</span>
                        ))}
                        {editedLead.useOfFunds?.map(fund => (
                            <span key={fund} className="chip funds">{fund}</span>
                        ))}
                        <span className="chip" style={{ background: '#f3f4f6' }}>{editedLead.loanProgram}</span>
                    </div>
                </div>

                {/* Action Bar: What do I do right now? */}
                <div className="action-bar">
                    <button className="action-btn" onClick={() => window.location.href = `tel:${editedLead.phone}`}>
                        <span className="action-icon">📞</span>
                        <span className="action-label">Call Now</span>
                    </button>
                    <button className="action-btn" onClick={() => setActiveTab('research')}>
                        <span className="action-icon">✉️</span>
                        <span className="action-label">Draft Email</span>
                    </button>
                    <button className="action-btn" onClick={() => {
                        alert("Task marked complete!");
                        handleSave();
                    }}>
                        <span className="action-icon">✅</span>
                        <span className="action-label">Complete Task</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="modal-tabs">
                    <button className={`tab-btn ${activeTab === 'snapshot' ? 'active' : ''}`} onClick={() => setActiveTab('snapshot')}>Snapshot</button>
                    <button className={`tab-btn ${activeTab === 'research' ? 'active' : ''}`} onClick={() => setActiveTab('research')}>AI Research</button>
                    <button className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Notes</button>
                </div>

                <div className="modal-body">
                    {activeTab === 'snapshot' && (
                        <div className="snapshot-grid">
                            <div className="snapshot-section">
                                <h4>Deal Context</h4>
                                <div className="data-row">
                                    <span className="data-label">Loan Amount</span>
                                    <span className="data-value">${editedLead.loanAmount?.toLocaleString()}</span>
                                </div>
                                <div className="data-row">
                                    <span className="data-label">Revenue</span>
                                    <span className="data-value">${editedLead.annualRevenue?.toLocaleString()}</span>
                                </div>
                                <div className="data-row">
                                    <span className="data-label">Net Income</span>
                                    <span className="data-value">${editedLead.netIncome?.toLocaleString()}</span>
                                </div>
                                <div className="data-row">
                                    <span className="data-label">Years in Biz</span>
                                    <span className="data-value">{editedLead.yearsInBusiness}</span>
                                </div>
                            </div>
                            <div className="snapshot-section">
                                <h4>Next Steps</h4>
                                <div className="data-row">
                                    <span className="data-label">Next Task</span>
                                    <span className="data-value" style={{ color: '#d97706' }}>{editedLead.nextTask?.action || 'No task set'}</span>
                                </div>
                                <div className="data-row">
                                    <span className="data-label">Due Date</span>
                                    <span className="data-value">{editedLead.nextTask?.date || '-'}</span>
                                </div>
                                <div className="data-row">
                                    <span className="data-label">Last Contact</span>
                                    <span className="data-value">{editedLead.lastContact?.outcome || '-'}</span>
                                </div>
                            </div>
                            rows={8}
                                        />
                            <div className="composer-actions">
                                <button
                                    className="primary"
                                    onClick={() => {
                                        const subject = encodeURIComponent(`Follow up: ${editedLead.businessName}`);
                                        window.location.href = `mailto:${editedLead.email}?subject=${subject}&body=${encodeURIComponent(emailDraft)}`;
                                    }}
                                >
                                    Open in Outlook
                                </button>
                                <button className="secondary" onClick={() => setEmailDraft(null)}>Discard</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
                    )}

            {activeTab === 'notes' && (
                <div className="notes-tab">
                    <div className="notes-list">
                        {editedLead.notes?.map(note => (
                            <div key={note.id} className={`note-item ${note.type}`}>
                                <div className="note-header">
                                    <span className="note-author">{note.author}</span>
                                    <span className="note-time">{new Date(note.timestamp).toLocaleString()}</span>
                                </div>
                                <div className="note-content">{note.content}</div>
                            </div>
                        ))}
                        {(!editedLead.notes || editedLead.notes.length === 0) && (
                            <p className="no-notes">No notes yet.</p>
                        )}
                    </div>
                    <div className="add-note">
                        <textarea
                            placeholder="Add a note..."
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    const content = e.currentTarget.value;
                                    if (!content.trim()) return;

                                    const newNote = {
                                        id: Date.now().toString(),
                                        content,
                                        timestamp: new Date().toISOString(),
                                        author: 'You',
                                        type: 'UserNote' as const
                                    };

                                    setEditedLead({
                                        ...editedLead,
                                        notes: [newNote, ...(editedLead.notes || [])]
                                    });
                                    e.currentTarget.value = '';
                                }
                            }}
                        />
                        <p className="hint">Press Enter to add note</p>
                    </div>
                </div>
            )}
        </div>
            </div >
        </div >
    );
};

export default LeadDetailModal;
