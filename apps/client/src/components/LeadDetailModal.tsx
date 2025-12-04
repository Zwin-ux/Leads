import React, { useState } from 'react';
import type { Lead } from '@leads/shared';
import { apiService } from '../services/apiService';

interface LeadDetailModalProps {
    lead: Lead;
    onClose: () => void;
    onUpdate: (updatedLead: Lead) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose, onUpdate }) => {
    const [editedLead, setEditedLead] = useState<Lead>(lead);
    const [activeTab, setActiveTab] = useState<'overview' | 'deal-lab' | 'notes'>('overview');
    const [isGenerating, setIsGenerating] = useState(false);
    const [emailDraft, setEmailDraft] = useState<string | null>(null);

    const handleSave = () => {
        onUpdate(editedLead);
        onClose();
    };

    const handleGenerateEmail = async () => {
        setIsGenerating(true);
        try {
            const content = await apiService.generateEmail(editedLead);
            setEmailDraft(content);
        } catch (e) {
            console.error(e);
            setEmailDraft("Error generating draft. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAnalyzeDeal = async () => {
        try {
            const analysis = await apiService.analyzeDeal(editedLead);

            // Add analysis as a system note
            const newNote = {
                id: Date.now().toString(),
                content: `AI Analysis: ${analysis}`,
                timestamp: new Date().toISOString(),
                author: 'Brain',
                type: 'SystemEvent' as const
            };

            setEditedLead(prev => ({
                ...prev,
                notes: [newNote, ...(prev.notes || [])]
            }));

            alert("Analysis complete! Check Notes tab.");
        } catch (e) {
            console.error(e);
            alert("Analysis failed");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{editedLead.firstName} {editedLead.lastName}</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-tabs">
                    <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                    <button className={`tab-btn ${activeTab === 'deal-lab' ? 'active' : ''}`} onClick={() => setActiveTab('deal-lab')}>Deal Lab</button>
                    <button className={`tab-btn ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>Notes & Timeline</button>
                </div>

                <div className="modal-body">
                    {activeTab === 'overview' && (
                        <>
                            <div className="section">
                                <label>Company</label>
                                <input
                                    value={editedLead.company || ''}
                                    onChange={e => setEditedLead({ ...editedLead, company: e.target.value })}
                                />
                            </div>

                            <div className="row">
                                <div className="section">
                                    <label>Loan Program</label>
                                    <select
                                        value={editedLead.loanProgram || 'Unknown'}
                                        onChange={e => setEditedLead({ ...editedLead, loanProgram: e.target.value as any })}
                                    >
                                        <option value="Unknown">Select Program...</option>
                                        <option value="504">SBA 504</option>
                                        <option value="7a">SBA 7(a)</option>
                                        <option value="Micro">Microloan</option>
                                    </select>
                                </div>
                                <div className="section">
                                    <label>Deal Stage</label>
                                    <select
                                        value={editedLead.dealStage || 'Prospecting'}
                                        onChange={e => setEditedLead({ ...editedLead, dealStage: e.target.value as any })}
                                    >
                                        <option value="Prospecting">Prospecting</option>
                                        <option value="Prequal">Prequalification</option>
                                        <option value="App">Application</option>
                                        <option value="Underwriting">Underwriting</option>
                                        <option value="Closing">Closing</option>
                                    </select>
                                </div>
                            </div>

                            <div className="section autopilot-section">
                                <div className="autopilot-header">
                                    <h3>Auto-Pilot</h3>
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={editedLead.autoPilotStatus || false}
                                            onChange={e => setEditedLead({ ...editedLead, autoPilotStatus: e.target.checked })}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                {editedLead.autoPilotStatus && (
                                    <div className="autopilot-settings">
                                        <label>Next Topic: {editedLead.nextTopic || 'Intro'}</label>
                                        <p className="hint">Brain will draft emails every 3 days.</p>
                                    </div>
                                )}
                            </div>

                            {emailDraft ? (
                                <div className="email-composer">
                                    <h3>Draft Email</h3>
                                    <textarea
                                        value={emailDraft}
                                        onChange={e => setEmailDraft(e.target.value)}
                                        rows={8}
                                    />
                                    <div className="composer-actions">
                                        <button
                                            className="primary"
                                            onClick={() => {
                                                window.location.href = `mailto:${editedLead.email}?subject=Follow up&body=${encodeURIComponent(emailDraft)}`;
                                            }}
                                        >
                                            Open in Outlook
                                        </button>
                                        <button className="secondary" onClick={() => setEmailDraft(null)}>Discard</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button className="primary" onClick={handleGenerateEmail} disabled={isGenerating}>
                                        {isGenerating ? 'Drafting...' : 'Draft Email Now'}
                                    </button>
                                    <button
                                        className="secondary"
                                        onClick={() => {
                                            const docLink = "https://sendnow.gatewayportal.com/ampac/Send_Now_Documents/r1";
                                            const body = `Hi ${editedLead.firstName},\n\nPlease upload the requested documents using our secure portal:\n${docLink}\n\nThanks,\nAmPac Team`;
                                            setEmailDraft(body);
                                        }}
                                    >
                                        Request Docs (SendNow)
                                    </button>
                                    <button
                                        className="secondary"
                                        onClick={() => {
                                            const subject = encodeURIComponent(`Follow up: ${editedLead.company || 'Your Loan Application'}`);
                                            window.open(`mailto:${editedLead.email}?subject=${subject}`, '_blank');
                                        }}
                                    >
                                        Open Outlook
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'deal-lab' && (
                        <div className="deal-lab">
                            <h3>Financials</h3>
                            <div className="row">
                                <div className="section">
                                    <label>Annual Revenue</label>
                                    <input
                                        type="number"
                                        value={editedLead.annualRevenue || ''}
                                        onChange={e => setEditedLead({ ...editedLead, annualRevenue: parseFloat(e.target.value) })}
                                        placeholder="$0.00"
                                    />
                                </div>
                                <div className="section">
                                    <label>Net Income</label>
                                    <input
                                        type="number"
                                        value={editedLead.netIncome || ''}
                                        onChange={e => setEditedLead({ ...editedLead, netIncome: parseFloat(e.target.value) })}
                                        placeholder="$0.00"
                                    />
                                </div>
                            </div>

                            <h3>Deal Structure ({editedLead.loanProgram || 'General'})</h3>
                            {editedLead.loanProgram === '504' ? (
                                <>
                                    <div className="section">
                                        <label>Project Cost</label>
                                        <input
                                            type="number"
                                            value={editedLead.projectCost || ''}
                                            onChange={e => setEditedLead({ ...editedLead, projectCost: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="section">
                                        <label>Property Type</label>
                                        <select
                                            value={editedLead.propertyType || ''}
                                            onChange={e => setEditedLead({ ...editedLead, propertyType: e.target.value })}
                                        >
                                            <option value="">Select...</option>
                                            <option value="Industrial">Industrial</option>
                                            <option value="Office">Office</option>
                                            <option value="Hotel">Hotel</option>
                                            <option value="Retail">Retail</option>
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <div className="section">
                                    <label>Use of Funds</label>
                                    <input
                                        value={editedLead.useOfFunds || ''}
                                        onChange={e => setEditedLead({ ...editedLead, useOfFunds: e.target.value })}
                                        placeholder="e.g. Working Capital, Refi"
                                    />
                                </div>
                            )}

                            <div className="deal-analysis-section" style={{ marginTop: '2rem', borderTop: '1px solid #27272a', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ margin: 0, border: 'none' }}>AI Deal Analysis</h3>
                                    <button className="secondary" onClick={handleAnalyzeDeal}>
                                        Analyze Eligibility
                                    </button>
                                </div>
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

                <div className="modal-footer">
                    <button className="secondary" onClick={onClose}>Cancel</button>
                    <button className="primary" onClick={handleSave}>Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default LeadDetailModal;
