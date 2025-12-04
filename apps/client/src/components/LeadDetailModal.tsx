import React, { useState, useEffect } from 'react';
import type { Lead, Banker } from '@leads/shared';
import { bankerService } from '../services/bankerService';
import { apiService } from '../services/apiService';

interface LeadDetailModalProps {
    lead: Lead;
    onClose: () => void;
    onUpdate: (updatedLead: Lead) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose, onUpdate }) => {
    const [editedLead, setEditedLead] = useState<Lead>(lead);
    const [referringBanker, setReferringBanker] = useState<Banker | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<'snapshot' | 'contacts' | 'research' | 'notes'>('snapshot');
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

    const handleGenerateEmail = async (type: 'intro' | 'update' | 'voicemail' | 'leadership') => {
        setIsGenerating(true);
        // Simulate AI delay
        setTimeout(async () => {
            let content = "";
            if (type === 'intro') {
                content = `Hi ${editedLead.firstName},\n\nI'm reviewing your loan request for ${editedLead.businessName || editedLead.company}. I have a few quick questions to get started.\n\nBest,\nAmPac Team`;
            } else if (type === 'update') {
                content = `Hi ${referringBanker?.name || 'Partner'},\n\nJust wanted to give you a quick update on the ${editedLead.lastName} deal. We are moving to underwriting.\n\nThanks for the referral!`;
            } else if (type === 'leadership') {
                content = `Team,\n\nUpdate on ${editedLead.businessName}:\n\n- Stage: Underwriting\n- Loan Amount: $${editedLead.loanAmount?.toLocaleString()}\n- Issues: None so far\n\nMoving forward with appraisal order.\n\nBest,\n${editedLead.owner || 'BDO'}`;
            } else {
                content = `Hi ${editedLead.firstName},\n\nI just left you a voicemail regarding your loan application. Please give me a call back when you have a moment.\n\nThanks,`;
            }
            setEmailDraft(content);
            setIsGenerating(false);
        }, 1000);
    };

    const performResearch = async (type: 'business' | 'banker') => {
        setIsGenerating(true);
        try {
            const query = type === 'business'
                ? `${editedLead.businessName || editedLead.company} ${editedLead.city || ''} business`
                : `${referringBanker?.name} ${referringBanker?.bank} banker`;

            const data = await apiService.research(query, type);

            if (type === 'business') setBusinessResearch(data);
            else setBankerResearch(data);
        } catch (err) {
            console.warn("Research failed", err);
        } finally {
            setIsGenerating(false);
        }
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
                    <button className="action-btn" onClick={() => window.open('https://sendnow.gatewayportal.com/ampac/Send_Now_Documents/r1', '_blank')}>
                        <span className="action-icon">📤</span>
                        <span className="action-label">Request Docs</span>
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
                    <button className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`} onClick={() => setActiveTab('contacts')}>Contacts</button>
                    <button className={`tab-btn ${activeTab === 'research' ? 'active' : ''}`} onClick={() => setActiveTab('research')}>AI Assistant</button>
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
                        </div>
                    )}

                    {activeTab === 'contacts' && (
                        <div className="contacts-tab">
                            <div className="contacts-list">
                                {editedLead.contacts?.map(contact => (
                                    <div key={contact.id} className="contact-card">
                                        <div className="contact-info">
                                            <div className="contact-header">
                                                <h4>{contact.name}</h4>
                                                {contact.isPrimary && <span className="badge-primary">Primary</span>}
                                            </div>
                                            <p className="contact-role">{contact.role}</p>
                                            <div className="contact-details">
                                                <a href={`mailto:${contact.email}`}>{contact.email}</a>
                                                {contact.phone && <a href={`tel:${contact.phone}`}>{contact.phone}</a>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!editedLead.contacts || editedLead.contacts.length === 0) && (
                                    <div className="empty-contacts">
                                        <p>No contacts added yet.</p>
                                    </div>
                                )}
                            </div>

                            <div className="add-contact-form">
                                <h4>Add New Contact</h4>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const form = e.target as HTMLFormElement;
                                    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                                    const role = (form.elements.namedItem('role') as HTMLInputElement).value;
                                    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                                    const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;

                                    if (!name || !email) return;

                                    const newContact = {
                                        id: crypto.randomUUID(),
                                        name,
                                        role,
                                        email,
                                        phone,
                                        isPrimary: (!editedLead.contacts || editedLead.contacts.length === 0)
                                    };

                                    setEditedLead(prev => ({
                                        ...prev,
                                        contacts: [...(prev.contacts || []), newContact]
                                    }));
                                    form.reset();
                                }}>
                                    <div className="form-row">
                                        <input name="name" placeholder="Name (e.g. John Doe)" required />
                                        <input name="role" placeholder="Role (e.g. CEO)" required />
                                    </div>
                                    <div className="form-row">
                                        <input name="email" type="email" placeholder="Email" required />
                                        <input name="phone" type="tel" placeholder="Phone" />
                                    </div>
                                    <button type="submit" className="btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }}>+ Add Contact</button>
                                </form>
                            </div>

                            <style>{`
                                .contacts-tab { padding: 1rem; }
                                .contacts-list { display: grid; gap: 1rem; margin-bottom: 2rem; }
                                .contact-card { 
                                    background: white; 
                                    border: 1px solid #e2e8f0; 
                                    padding: 1rem; 
                                    border-radius: 8px;
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                }
                                .contact-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
                                .contact-header h4 { margin: 0; font-size: 1rem; color: #1e293b; }
                                .badge-primary { 
                                    background: #dbeafe; color: #1e40af; 
                                    font-size: 0.7rem; padding: 2px 6px; 
                                    border-radius: 4px; font-weight: 600; 
                                }
                                .contact-role { color: #64748b; font-size: 0.875rem; margin: 0 0 0.5rem 0; }
                                .contact-details { display: flex; gap: 1rem; font-size: 0.875rem; }
                                .contact-details a { color: var(--primary); text-decoration: none; }
                                .add-contact-form { background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 1px dashed #cbd5e1; }
                                .add-contact-form h4 { margin-top: 0; margin-bottom: 1rem; color: #475569; }
                                .form-row { display: flex; gap: 1rem; margin-bottom: 0.75rem; }
                                .form-row input { flex: 1; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px; }
                            `}</style>
                        </div>
                    )}

                    {activeTab === 'research' && (
                        <div className="ai-panel">
                            <div className="ai-tools-grid">
                                <button
                                    className={`ai-tool-btn ${businessResearch ? 'active' : ''}`}
                                    onClick={() => performResearch('business')}
                                    disabled={isGenerating || !!businessResearch}
                                >
                                    <span className="ai-tool-icon">🔍</span>
                                    <div className="ai-tool-text">
                                        <span className="ai-tool-title">Research Business</span>
                                        <span className="ai-tool-desc">Web, News, Red Flags</span>
                                    </div>
                                </button>
                                <button
                                    className={`ai-tool-btn ${bankerResearch ? 'active' : ''}`}
                                    onClick={() => performResearch('banker')}
                                    disabled={isGenerating || !!bankerResearch}
                                >
                                    <span className="ai-tool-icon">🏦</span>
                                    <div className="ai-tool-text">
                                        <span className="ai-tool-title">Research Banker</span>
                                        <span className="ai-tool-desc">Leverage & History</span>
                                    </div>
                                </button>
                            </div>

                            {/* Research Results Display */}
                            {(businessResearch || bankerResearch) && (
                                <div className="research-results">
                                    {businessResearch && (
                                        <div className="result-card">
                                            <h4>Business Intel</h4>
                                            <p><strong>Summary:</strong> {businessResearch.summary}</p>
                                            <p><strong>Headcount:</strong> {businessResearch.headcount}</p>
                                            <p><strong>News:</strong> {businessResearch.news}</p>
                                            <div className="flags">
                                                {businessResearch.flags.map((flag, i) => (
                                                    <span key={i} className="flag-chip">{flag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {bankerResearch && (
                                        <div className="result-card">
                                            <h4>Banker Leverage</h4>
                                            <div className="stat-row">
                                                <div className="stat">
                                                    <label>Win Rate</label>
                                                    <span>{bankerResearch.winRate}</span>
                                                </div>
                                                <div className="stat">
                                                    <label>Speed</label>
                                                    <span>{bankerResearch.speed}</span>
                                                </div>
                                            </div>
                                            <p className="leverage-note">💡 {bankerResearch.leverage}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="email-composer">
                                <h3>AI Email Drafter</h3>
                                <p className="hint">Select a template to generate a draft, then refine it below.</p>
                                <div className="composer-actions" style={{ marginBottom: '1rem', marginTop: 0 }}>
                                    <button className="secondary" onClick={() => handleGenerateEmail('intro')} disabled={isGenerating}>Borrower Intro</button>
                                    <button className="secondary" onClick={() => handleGenerateEmail('update')} disabled={isGenerating}>Banker Update</button>
                                    <button className="secondary" onClick={() => handleGenerateEmail('leadership')} disabled={isGenerating}>Leadership Update</button>
                                    <button className="secondary" onClick={() => handleGenerateEmail('voicemail')} disabled={isGenerating}>Voicemail Follow-up</button>
                                </div>

                                {isGenerating && <p style={{ color: '#059669' }}>Brain is working...</p>}

                                {emailDraft && (
                                    <div className="draft-editor" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: 'white' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#64748b' }}>Refine your message:</label>
                                        <textarea
                                            value={emailDraft}
                                            onChange={e => setEmailDraft(e.target.value)}
                                            rows={10}
                                            style={{ width: '100%', padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontFamily: 'inherit', fontSize: '0.95rem', lineHeight: '1.5' }}
                                        />
                                        <div className="composer-actions" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button className="secondary" onClick={() => setEmailDraft(null)}>Discard</button>
                                            <button
                                                className="primary"
                                                onClick={() => {
                                                    const subject = encodeURIComponent(`Update: ${editedLead.businessName}`);
                                                    window.location.href = `mailto:${editedLead.email}?subject=${subject}&body=${encodeURIComponent(emailDraft)}`;
                                                }}
                                            >
                                                Open in Outlook
                                            </button>
                                        </div>
                                    </div>
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
                                    <p className="no-notes">No notes yet. Start the conversation.</p>
                                )}
                            </div>
                            <div className="add-note">
                                <textarea
                                    placeholder="Type a note and press Enter..."
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            const content = e.currentTarget.value;
                                            if (!content.trim()) return;

                                            const newNote = {
                                                id: Date.now().toString(),
                                                content,
                                                timestamp: new Date().toISOString(),
                                                author: 'You', // In real app, use authService.getCurrentUser().name
                                                type: 'UserNote' as const
                                            };

                                            setEditedLead(prev => ({
                                                ...prev,
                                                notes: [newNote, ...(prev.notes || [])]
                                            }));
                                            e.currentTarget.value = '';
                                        }
                                    }}
                                />
                                <p className="hint">Press <strong>Enter</strong> to save note</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeadDetailModal;
