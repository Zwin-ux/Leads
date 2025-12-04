import React, { useState, useEffect } from 'react';
import type { Lead, Contact } from '@leads/shared';
import { apiService } from '../services/apiService';
import TransferLeadModal from './TransferLeadModal';

interface LeadDetailModalProps {
    lead: Lead;
    onClose: () => void;
    onUpdate: (lead: Lead) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<'snapshot' | 'research' | 'notes' | 'contacts'>('snapshot');
    const [noteContent, setNoteContent] = useState('');
    const [aiEmail, setAiEmail] = useState('');
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [loadingAi, setLoadingAi] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);

    // Contacts State
    const [contacts, setContacts] = useState<Contact[]>(lead.contacts || []);
    const [showAddContact, setShowAddContact] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [newContact, setNewContact] = useState<Partial<Contact>>({});

    useEffect(() => {
        // Ensure contacts are synced if lead updates
        setContacts(lead.contacts || []);
    }, [lead]);

    const handleSaveNote = async () => {
        if (!noteContent.trim()) return;

        const newNote = {
            id: Date.now().toString(),
            content: noteContent,
            timestamp: new Date().toISOString(),
            author: 'You', // In real app, get current user
            type: 'UserNote' as const
        };

        const updatedLead = {
            ...lead,
            notes: [newNote, ...(lead.notes || [])]
        };

        onUpdate(updatedLead);
        setNoteContent('');
    };

    const handleGenerateEmail = async () => {
        setLoadingAi(true);
        try {
            const email = await apiService.generateEmail(lead);
            setAiEmail(email);
        } catch (e) {
            console.error(e);
            setAiEmail("Error generating email. Please try again.");
        } finally {
            setLoadingAi(false);
        }
    };

    const handleAnalyzeDeal = async () => {
        setLoadingAi(true);
        try {
            const analysis = await apiService.analyzeDeal(lead);
            setAiAnalysis(analysis);
        } catch (e) {
            console.error(e);
            setAiAnalysis("Analysis unavailable.");
        } finally {
            setLoadingAi(false);
        }
    };

    const handleSendNow = () => {
        // Direct integration link
        window.open('https://portal.sendnow.com/login', '_blank');
    };

    // --- Contact Management ---

    const handleSaveContact = async () => {
        if (!newContact.name) return;

        let updatedContacts = [...contacts];

        if (editingContact) {
            // Update existing
            updatedContacts = updatedContacts.map(c =>
                c.id === editingContact.id ? { ...c, ...newContact } as Contact : c
            );
        } else {
            // Add new
            const contact: Contact = {
                id: crypto.randomUUID(),
                name: newContact.name || '',
                role: newContact.role || '',
                email: newContact.email || '',
                phone: newContact.phone || '',
                isPrimary: contacts.length === 0 // First one is primary by default
            };
            updatedContacts.push(contact);
        }

        const updatedLead = { ...lead, contacts: updatedContacts };
        onUpdate(updatedLead);

        // Reset
        setContacts(updatedContacts);
        setShowAddContact(false);
        setEditingContact(null);
        setNewContact({});
    };

    const handleDeleteContact = (id: string) => {
        if (!confirm('Are you sure you want to delete this contact?')) return;
        const updatedContacts = contacts.filter(c => c.id !== id);
        const updatedLead = { ...lead, contacts: updatedContacts };
        onUpdate(updatedLead);
        setContacts(updatedContacts);
    };

    const handleSetPrimary = (id: string) => {
        const updatedContacts = contacts.map(c => ({
            ...c,
            isPrimary: c.id === id
        }));
        const updatedLead = { ...lead, contacts: updatedContacts };
        onUpdate(updatedLead);
        setContacts(updatedContacts);
    };

    const openEditContact = (contact: Contact) => {
        setEditingContact(contact);
        setNewContact(contact);
        setShowAddContact(true);
    };

    const handleTransfer = async (leadId: string, newOwner: string, message: string, type: 'transfer' | 'collaborate') => {
        let updatedLead = { ...lead };

        if (type === 'transfer') {
            updatedLead.owner = newOwner;
            updatedLead.notes = [
                {
                    id: crypto.randomUUID(),
                    content: `System: Transferred to ${newOwner}. Note: ${message}`,
                    timestamp: new Date().toISOString(),
                    author: 'System',
                    type: 'SystemEvent'
                },
                ...(updatedLead.notes || [])
            ];
        } else {
            updatedLead.notes = [
                {
                    id: crypto.randomUUID(),
                    content: `System: Added ${newOwner} as collaborator. Note: ${message}`,
                    timestamp: new Date().toISOString(),
                    author: 'System',
                    type: 'SystemEvent'
                },
                ...(updatedLead.notes || [])
            ];
        }

        try {
            const saved = await apiService.updateLead(updatedLead);
            onUpdate(saved);
            setShowTransfer(false);
            alert(type === 'transfer' ? `Lead transferred to ${newOwner}` : `${newOwner} added as collaborator`);
            if (type === 'transfer') onClose(); // Close modal if transferred away
        } catch (err) {
            console.error("Failed to transfer lead", err);
            alert("Failed to transfer lead");
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content large">
                <div className="modal-header">
                    <div className="header-left">
                        <h2>{lead.company}</h2>
                        <span className="badge">{lead.stage}</span>
                        {lead.owner && <span className="owner-badge">👤 {lead.owner}</span>}
                    </div>
                    <div className="header-actions">
                        <button className="btn-secondary" onClick={() => setShowTransfer(true)}>➡️ Transfer</button>
                        <button className="btn-secondary" onClick={handleSendNow}>📤 Request Docs (SendNow)</button>
                        <button className="close-btn" onClick={onClose}>&times;</button>
                    </div>
                </div>

                <div className="modal-tabs">
                    <button className={activeTab === 'snapshot' ? 'active' : ''} onClick={() => setActiveTab('snapshot')}>Snapshot</button>
                    <button className={activeTab === 'contacts' ? 'active' : ''} onClick={() => setActiveTab('contacts')}>Contacts ({contacts.length})</button>
                    <button className={activeTab === 'research' ? 'active' : ''} onClick={() => setActiveTab('research')}>AI Research</button>
                    <button className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}>Notes</button>
                </div>

                <div className="modal-body">
                    {activeTab === 'snapshot' && (
                        <div className="snapshot-view">
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Contact</label>
                                    <p>{lead.firstName} {lead.lastName}</p>
                                </div>
                                <div className="info-item">
                                    <label>Email</label>
                                    <p><a href={`mailto:${lead.email}`}>{lead.email}</a></p>
                                </div>
                                <div className="info-item">
                                    <label>Phone</label>
                                    <p>{lead.phone || '--'}</p>
                                </div>
                                <div className="info-item">
                                    <label>Program</label>
                                    <p>{lead.loanProgram || 'SBA 504'}</p>
                                </div>
                            </div>

                            <div className="ai-section">
                                <h3>AI Email Drafter</h3>
                                <p className="hint">Generate a personalized intro email based on this lead's profile.</p>
                                {aiEmail ? (
                                    <div className="email-preview">
                                        <textarea
                                            className="email-editor"
                                            value={aiEmail}
                                            onChange={(e) => setAiEmail(e.target.value)}
                                        />
                                        <div className="email-actions">
                                            <button className="btn-secondary" onClick={() => window.open(`mailto:${lead.email}?subject=Intro&body=${encodeURIComponent(aiEmail)}`)}>Open in Outlook</button>
                                            <button className="btn-text" onClick={() => setAiEmail('')}>Discard</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button className="btn-primary" onClick={handleGenerateEmail} disabled={loadingAi}>
                                        {loadingAi ? 'Drafting...' : '✨ Draft Intro Email'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'contacts' && (
                        <div className="contacts-view">
                            <div className="contacts-list">
                                {contacts.map(contact => (
                                    <div key={contact.id} className={`contact-card ${contact.isPrimary ? 'primary' : ''}`}>
                                        <div className="contact-info">
                                            <h4>
                                                {contact.name}
                                                {contact.isPrimary && <span className="primary-badge">Primary</span>}
                                            </h4>
                                            <p className="role">{contact.role}</p>
                                            <p className="contact-details">
                                                {contact.email && <span>📧 {contact.email}</span>}
                                                {contact.phone && <span>📱 {contact.phone}</span>}
                                            </p>
                                        </div>
                                        <div className="contact-actions">
                                            {!contact.isPrimary && (
                                                <button className="btn-text" onClick={() => handleSetPrimary(contact.id)}>Set Primary</button>
                                            )}
                                            <button className="btn-icon" onClick={() => openEditContact(contact)}>✏️</button>
                                            <button className="btn-icon delete" onClick={() => handleDeleteContact(contact.id)}>🗑️</button>
                                        </div>
                                    </div>
                                ))}
                                {contacts.length === 0 && <p className="empty-text">No additional contacts added.</p>}
                            </div>

                            {showAddContact ? (
                                <div className="add-contact-form">
                                    <h4>{editingContact ? 'Edit Contact' : 'Add New Contact'}</h4>
                                    <div className="form-row">
                                        <input
                                            placeholder="Name"
                                            value={newContact.name || ''}
                                            onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                                        />
                                        <input
                                            placeholder="Role (e.g. CFO)"
                                            value={newContact.role || ''}
                                            onChange={e => setNewContact({ ...newContact, role: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <input
                                            placeholder="Email"
                                            value={newContact.email || ''}
                                            onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                                        />
                                        <input
                                            placeholder="Phone"
                                            value={newContact.phone || ''}
                                            onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button className="btn-primary" onClick={handleSaveContact}>Save Contact</button>
                                        <button className="btn-secondary" onClick={() => {
                                            setShowAddContact(false);
                                            setEditingContact(null);
                                            setNewContact({});
                                        }}>Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <button className="btn-dashed" onClick={() => setShowAddContact(true)}>+ Add Contact</button>
                            )}
                        </div>
                    )}

                    {activeTab === 'research' && (
                        <div className="research-view">
                            <div className="ai-card">
                                <h3>Deal Analysis</h3>
                                {aiAnalysis ? (
                                    <div className="analysis-content">
                                        {aiAnalysis}
                                    </div>
                                ) : (
                                    <div className="empty-analysis">
                                        <p>Run AI analysis to check eligibility and deal strength.</p>
                                        <button className="btn-primary" onClick={handleAnalyzeDeal} disabled={loadingAi}>
                                            {loadingAi ? 'Analyzing...' : '⚡ Analyze Deal'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="notes-view">
                            <div className="notes-list">
                                {lead.notes?.map(note => (
                                    <div key={note.id} className={`note-item ${note.type}`}>
                                        <div className="note-header">
                                            <span className="author">{note.author}</span>
                                            <span className="time">{new Date(note.timestamp).toLocaleString()}</span>
                                        </div>
                                        <p>{note.content}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="add-note">
                                <textarea
                                    placeholder="Add a note..."
                                    value={noteContent}
                                    onChange={e => setNoteContent(e.target.value)}
                                />
                                <button className="btn-primary" onClick={handleSaveNote}>Post Note</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showTransfer && (
                <TransferLeadModal
                    lead={lead}
                    onClose={() => setShowTransfer(false)}
                    onTransfer={handleTransfer}
                />
            )}

            <style>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 800px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }
                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .header-actions {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }
                .modal-tabs {
                    display: flex;
                    padding: 0 1.5rem;
                    border-bottom: 1px solid #e2e8f0;
                    background: #f8fafc;
                }
                .modal-tabs button {
                    padding: 1rem;
                    background: none;
                    border: none;
                    border-bottom: 2px solid transparent;
                    cursor: pointer;
                    color: #64748b;
                    font-weight: 500;
                }
                .modal-tabs button.active {
                    color: var(--primary);
                    border-bottom-color: var(--primary);
                }
                .modal-body {
                    padding: 1.5rem;
                    overflow-y: auto;
                    flex: 1;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                    margin-bottom: 2rem;
                }
                .info-item label {
                    display: block;
                    font-size: 0.875rem;
                    color: #64748b;
                    margin-bottom: 0.25rem;
                }
                .info-item p {
                    font-weight: 500;
                    color: #1e293b;
                }
                .notes-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                .note-item {
                    background: #f8fafc;
                    padding: 1rem;
                    border-radius: 8px;
                }
                .note-item.SystemEvent {
                    background: #f0f9ff;
                    border-left: 3px solid #0ea5e9;
                }
                .note-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.875rem;
                    color: #64748b;
                    margin-bottom: 0.5rem;
                }
                .add-note textarea {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                    min-height: 80px;
                }
                .email-editor {
                    width: 100%;
                    min-height: 200px;
                    padding: 1rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-family: inherit;
                    margin-bottom: 1rem;
                }
                .email-actions {
                    display: flex;
                    gap: 1rem;
                }
                .contacts-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                .contact-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    background: white;
                }
                .contact-card.primary {
                    border-color: var(--primary);
                    background: #f0f9ff;
                }
                .contact-info h4 { margin: 0 0 0.25rem 0; display: flex; align-items: center; gap: 0.5rem; }
                .primary-badge { font-size: 0.7rem; background: var(--primary); color: white; padding: 2px 6px; border-radius: 4px; }
                .contact-details { font-size: 0.875rem; color: #64748b; display: flex; gap: 1rem; margin: 0.25rem 0 0 0; }
                .contact-actions { display: flex; gap: 0.5rem; align-items: center; }
                .btn-icon { background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 4px; }
                .btn-icon.delete:hover { background: #fee2e2; border-radius: 4px; }
                .add-contact-form {
                    background: #f8fafc;
                    padding: 1.5rem;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .form-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
                .form-row input { flex: 1; padding: 0.5rem; border: 1px solid #e2e8f0; border-radius: 4px; }
                .btn-dashed {
                    width: 100%;
                    padding: 1rem;
                    border: 2px dashed #e2e8f0;
                    background: none;
                    color: #64748b;
                    border-radius: 8px;
                    cursor: pointer;
                }
                .btn-dashed:hover { border-color: var(--primary); color: var(--primary); }
                .owner-badge {
                    background: #f1f5f9;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    color: #475569;
                    margin-left: 0.5rem;
                }
            `}</style>
        </div>
    );
};

export default LeadDetailModal;
