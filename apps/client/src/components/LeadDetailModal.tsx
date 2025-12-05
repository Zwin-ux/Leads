import React, { useState, useEffect } from 'react';
import type { Lead, Contact, Document } from '@leads/shared';
import { apiService } from '../services/apiService';
import TransferLeadModal from './TransferLeadModal';
import { DocumentChecklist } from './DocumentChecklist';
import { BankPartnerPanel } from './BankPartnerPanel';
import { ClosingChecklist } from './ClosingChecklist';
import { SBAEligibilityScanner } from './SBAEligibilityScanner';

interface LeadDetailModalProps {
    lead: Lead;
    onClose: () => void;
    onUpdate: (lead: Lead) => void;
    onDelete?: (leadId: string) => void;
}

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose, onUpdate, onDelete }) => {
    const [activeTab, setActiveTab] = useState<'snapshot' | 'documents' | 'qualification' | 'notes' | 'closing' | 'partners' | 'contacts' | 'research'>('snapshot');
    const [noteContent, setNoteContent] = useState('');
    const [noteContext, setNoteContext] = useState<'Call' | 'Email' | 'Meeting' | 'Manual'>('Manual');
    const [aiEmail, setAiEmail] = useState('');
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [loadingAi, setLoadingAi] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);

    // Snapshot Edit State
    const [isEditingSnapshot, setIsEditingSnapshot] = useState(false);
    const [snapshotData, setSnapshotData] = useState({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        loanProgram: lead.loanProgram
    });

    // Contacts State
    const [contacts, setContacts] = useState<Contact[]>(lead.contacts || []);
    const [showAddContact, setShowAddContact] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const [newContact, setNewContact] = useState<Partial<Contact>>({});

    useEffect(() => {
        // Ensure contacts are synced if lead updates
        setContacts(lead.contacts || []);
        setSnapshotData({
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            loanProgram: lead.loanProgram
        });
    }, [lead]);

    const handleSaveSnapshot = () => {
        const updatedLead = {
            ...lead,
            ...snapshotData
        };
        onUpdate(updatedLead);
        setIsEditingSnapshot(false);
    };

    const handleDeleteLead = () => {
        if (onDelete && lead.id) {
            onDelete(lead.id);
        }
    };

    const handleSaveNote = async () => {
        if (!noteContent.trim()) return;

        const newNote = {
            id: Date.now().toString(),
            content: noteContent,
            timestamp: new Date().toISOString(),
            author: 'You',
            type: 'UserNote' as const,
            context: noteContext
        };

        const updatedLead = {
            ...lead,
            notes: [newNote, ...(lead.notes || [])],
            lastContactDate: new Date().toISOString() // Update last touched
        };

        onUpdate(updatedLead);
        setNoteContent('');
        setNoteContext('Manual');
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
        window.open('https://sendnow.gatewayportal.com/ampac/Send_Now_Documents/r1', '_blank');
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

    const handleTransfer = async (_leadId: string, newOwner: string, message: string, type: 'transfer' | 'collaborate') => {
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

    // Calculate stale info
    const getStaleInfo = () => {
        const lastTouched = lead.lastContactDate;
        if (!lastTouched || lastTouched === 'Never') {
            return { days: null, color: '#ef4444', label: 'Never contacted', pulse: true };
        }

        const date = new Date(lastTouched);
        if (isNaN(date.getTime())) {
            return { days: null, color: '#94a3b8', label: lastTouched, pulse: false };
        }

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays <= 7) {
            return { days: diffDays, color: '#22c55e', label: diffDays === 0 ? 'Today' : `${diffDays}d ago`, pulse: false };
        } else if (diffDays <= 14) {
            return { days: diffDays, color: '#f59e0b', label: `${diffDays}d ago`, pulse: false };
        } else if (diffDays <= 30) {
            return { days: diffDays, color: '#f97316', label: `${diffDays}d ago`, pulse: true };
        } else {
            return { days: diffDays, color: '#ef4444', label: `${diffDays}d ago`, pulse: true };
        }
    };

    const staleInfo = getStaleInfo();

    // Get stage color
    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'New': return { bg: '#dbeafe', color: '#1e40af' };
            case 'Contacted': return { bg: '#fef3c7', color: '#92400e' };
            case 'Qualified': return { bg: '#dcfce7', color: '#166534' };
            case 'Proposal': return { bg: '#e0e7ff', color: '#3730a3' };
            case 'Closed': return { bg: '#d1fae5', color: '#065f46' };
            default: return { bg: '#f1f5f9', color: '#475569' };
        }
    };

    const stageStyle = getStageColor(lead.stage);

    return (
        <div className="modal-overlay">
            <div className="modal-content large">
                {/* === ENHANCED HEADER === */}
                <div className="modal-header enhanced">
                    <div className="header-top-row">
                        <div className="company-info">
                            <h2>{lead.company || lead.businessName || 'Unknown Company'}</h2>
                            {lead.businessName && lead.businessName !== lead.company && (
                                <span className="legal-name">Legal: {lead.businessName}</span>
                            )}
                        </div>
                        <div className="header-actions">
                            <button className="btn-secondary" onClick={() => setShowTransfer(true)}>Transfer</button>
                            <button className="btn-secondary" onClick={handleSendNow}>Request Docs</button>
                            {onDelete && <button className="btn-icon delete" onClick={handleDeleteLead} title="Delete Lead">×</button>}
                            <button className="close-btn" onClick={onClose}>&times;</button>
                        </div>
                    </div>

                    {/* Status Bar - Always Visible */}
                    <div className="header-status-bar">
                        <div className="status-item">
                            <span className="status-label">BDO</span>
                            <span className="status-value owner">{lead.owner || 'Unassigned'}</span>
                        </div>
                        <div className="status-divider" />
                        <div className="status-item">
                            <span className="status-label">Stage</span>
                            <span className="status-value stage" style={{ background: stageStyle.bg, color: stageStyle.color }}>
                                {lead.stage}
                            </span>
                        </div>
                        <div className="status-divider" />
                        <div className="status-item">
                            <span className="status-label">Deal Stage</span>
                            <span className="status-value">{lead.dealStage || 'Prospecting'}</span>
                        </div>
                        <div className="status-divider" />
                        <div className="status-item">
                            <span className="status-label">Program</span>
                            <span className="status-value program">{lead.loanProgram || 'Unknown'}</span>
                        </div>
                        <div className="status-divider" />
                        <div className="status-item">
                            <span className="status-label">Last Touch</span>
                            <span
                                className={`status-value stale ${staleInfo.pulse ? 'pulse' : ''}`}
                                style={{ color: staleInfo.color }}
                            >
                                {staleInfo.label}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="modal-tabs">
                    <button className={activeTab === 'snapshot' ? 'active' : ''} onClick={() => setActiveTab('snapshot')}>Deal Info</button>
                    <button className={activeTab === 'documents' ? 'active' : ''} onClick={() => setActiveTab('documents')}>Documents</button>
                    <button className={activeTab === 'qualification' ? 'active' : ''} onClick={() => setActiveTab('qualification')}>Qualification</button>
                    <button className={activeTab === 'notes' ? 'active' : ''} onClick={() => setActiveTab('notes')}>Notes</button>
                    <button className={activeTab === 'closing' ? 'active' : ''} onClick={() => setActiveTab('closing')}>Closing</button>
                    <button className={activeTab === 'partners' ? 'active' : ''} onClick={() => setActiveTab('partners')}>Bank Partners</button>
                    <button className={activeTab === 'contacts' ? 'active' : ''} onClick={() => setActiveTab('contacts')}>Contacts ({contacts.length})</button>
                    <button className={activeTab === 'research' ? 'active' : ''} onClick={() => setActiveTab('research')}>AI</button>
                </div>

                <div className="modal-body">
                    {activeTab === 'snapshot' && (
                        <div className="snapshot-view">
                            <div className="snapshot-header" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                {isEditingSnapshot ? (
                                    <div className="edit-actions">
                                        <button className="btn-text" onClick={() => setIsEditingSnapshot(false)}>Cancel</button>
                                        <button className="btn-primary" onClick={handleSaveSnapshot}>Save Changes</button>
                                    </div>
                                ) : (
                                    <button className="btn-text" onClick={() => setIsEditingSnapshot(true)}>✏️ Edit Details</button>
                                )}
                            </div>

                            <div className="info-grid">
                                <div className="info-item">
                                    <label>First Name</label>
                                    {isEditingSnapshot ? (
                                        <input
                                            value={snapshotData.firstName}
                                            onChange={e => setSnapshotData({ ...snapshotData, firstName: e.target.value })}
                                            className="edit-input"
                                        />
                                    ) : (
                                        <p>{lead.firstName}</p>
                                    )}
                                </div>
                                <div className="info-item">
                                    <label>Last Name</label>
                                    {isEditingSnapshot ? (
                                        <input
                                            value={snapshotData.lastName}
                                            onChange={e => setSnapshotData({ ...snapshotData, lastName: e.target.value })}
                                            className="edit-input"
                                        />
                                    ) : (
                                        <p>{lead.lastName}</p>
                                    )}
                                </div>
                                <div className="info-item">
                                    <label>Email</label>
                                    {isEditingSnapshot ? (
                                        <input
                                            value={snapshotData.email}
                                            onChange={e => setSnapshotData({ ...snapshotData, email: e.target.value })}
                                            className="edit-input"
                                        />
                                    ) : (
                                        <p><a href={`mailto:${lead.email}`}>{lead.email}</a></p>
                                    )}
                                </div>
                                <div className="info-item">
                                    <label>Phone</label>
                                    {isEditingSnapshot ? (
                                        <input
                                            value={snapshotData.phone || ''}
                                            onChange={e => setSnapshotData({ ...snapshotData, phone: e.target.value })}
                                            className="edit-input"
                                        />
                                    ) : (
                                        <p>{lead.phone || '--'}</p>
                                    )}
                                </div>
                                <div className="info-item">
                                    <label>Program</label>
                                    {isEditingSnapshot ? (
                                        <select
                                            value={snapshotData.loanProgram || 'SBA 504'}
                                            onChange={e => setSnapshotData({ ...snapshotData, loanProgram: e.target.value as any })}
                                            className="edit-input"
                                        >
                                            <option value="SBA 504">SBA 504</option>
                                            <option value="SBA 7a">SBA 7a</option>
                                            <option value="Conventional">Conventional</option>
                                        </select>
                                    ) : (
                                        <p>{lead.loanProgram || 'SBA 504'}</p>
                                    )}
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

                    {activeTab === 'documents' && (
                        <div className="documents-view">
                            <DocumentChecklist
                                lead={lead}
                                onUpdateDocument={(docId, updates) => {
                                    const docs = lead.documents || [];
                                    const existingIdx = docs.findIndex(d => d.id === docId);
                                    let newDocs;
                                    if (existingIdx >= 0) {
                                        newDocs = [...docs];
                                        newDocs[existingIdx] = { ...newDocs[existingIdx], ...updates };
                                    } else {
                                        // Add new doc
                                        newDocs = [...docs, { id: docId, ...updates } as Document];
                                    }
                                    onUpdate({ ...lead, documents: newDocs });
                                }}
                                onRequestDocs={(_docTypes) => {
                                    const sendNowUrl = 'https://sendnow.gatewayportal.com/ampac/Send_Now_Documents/r1';
                                    window.open(sendNowUrl, '_blank');
                                }}
                                onApplyTemplate={(template) => {
                                    // Merge template with existing docs
                                    const currentDocs = lead.documents || [];
                                    const newDocs = [...currentDocs];

                                    template.forEach(type => {
                                        if (!newDocs.find(d => d.type === type)) {
                                            newDocs.push({
                                                id: `doc-${type}-${Date.now()}`,
                                                type,
                                                label: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Simple label fallback
                                                status: 'needed'
                                            });
                                        }
                                    });
                                    onUpdate({ ...lead, documents: newDocs });
                                }}
                            />
                        </div>
                    )}

                    {activeTab === 'qualification' && (
                        <div className="qualification-view">
                            <SBAEligibilityScanner
                                lead={lead}
                                onUpdateNote={(note) => {
                                    const newNote = {
                                        id: Date.now().toString(),
                                        content: note,
                                        timestamp: new Date().toISOString(),
                                        author: 'System',
                                        type: 'SystemEvent' as const,
                                        context: 'System' as const
                                    };
                                    onUpdate({ ...lead, notes: [newNote, ...(lead.notes || [])] });
                                }}
                            />
                        </div>
                    )}

                    {activeTab === 'closing' && (
                        <div className="closing-view">
                            <ClosingChecklist
                                lead={lead}
                                onUpdateClosingItem={(itemId, updates) => {
                                    const items = lead.closingItems || [];
                                    const existingIndex = items.findIndex(i => i.id === itemId);
                                    let newItems;
                                    if (existingIndex >= 0) {
                                        newItems = items.map(i => i.id === itemId ? { ...i, ...updates } : i);
                                    } else {
                                        // Initialize with default items if not present
                                        const DEFAULT_ITEMS = [
                                            { id: 'closing-0', category: 'pre_closing' as const, label: 'Title Commitment Ordered', status: 'pending' as const },
                                            { id: 'closing-1', category: 'pre_closing' as const, label: 'Title Commitment Received', status: 'pending' as const },
                                            { id: 'closing-2', category: 'pre_closing' as const, label: 'Title Cleared', status: 'pending' as const },
                                            { id: 'closing-3', category: 'pre_closing' as const, label: 'Appraisal Ordered', status: 'pending' as const },
                                            { id: 'closing-4', category: 'pre_closing' as const, label: 'Appraisal Received', status: 'pending' as const },
                                            { id: 'closing-5', category: 'pre_closing' as const, label: 'Appraisal Reviewed', status: 'pending' as const },
                                            { id: 'closing-6', category: 'pre_closing' as const, label: 'Insurance Quote Received', status: 'pending' as const },
                                            { id: 'closing-7', category: 'pre_closing' as const, label: 'Insurance Binder Ordered', status: 'pending' as const },
                                            { id: 'closing-8', category: 'pre_closing' as const, label: 'Closing Docs Drafted', status: 'pending' as const },
                                            { id: 'closing-9', category: 'pre_closing' as const, label: 'Closing Docs to Parties', status: 'pending' as const },
                                            { id: 'closing-10', category: 'closing_day' as const, label: 'Wire Instructions Received', status: 'pending' as const },
                                            { id: 'closing-11', category: 'closing_day' as const, label: 'Signing Scheduled', status: 'pending' as const },
                                            { id: 'closing-12', category: 'closing_day' as const, label: 'Signing Complete', status: 'pending' as const },
                                            { id: 'closing-13', category: 'closing_day' as const, label: 'Recording Submitted', status: 'pending' as const },
                                            { id: 'closing-14', category: 'closing_day' as const, label: 'Recording Confirmed', status: 'pending' as const },
                                            { id: 'closing-15', category: 'closing_day' as const, label: 'Funding Wire Sent', status: 'pending' as const },
                                            { id: 'closing-16', category: 'closing_day' as const, label: 'Funding Confirmed', status: 'pending' as const },
                                            { id: 'closing-17', category: 'post_closing' as const, label: 'Recorded Deed Received', status: 'pending' as const },
                                            { id: 'closing-18', category: 'post_closing' as const, label: 'Final Title Policy', status: 'pending' as const },
                                            { id: 'closing-19', category: 'post_closing' as const, label: 'Insurance Binder Filed', status: 'pending' as const },
                                            { id: 'closing-20', category: 'post_closing' as const, label: 'SBA Form 1502 Filed', status: 'pending' as const },
                                            { id: 'closing-21', category: 'post_closing' as const, label: 'File Audit Complete', status: 'pending' as const },
                                        ];
                                        newItems = DEFAULT_ITEMS.map(i => i.id === itemId ? { ...i, ...updates } : i);
                                    }
                                    onUpdate({ ...lead, closingItems: newItems });
                                }}
                                onUpdateLead={(updates) => {
                                    onUpdate({ ...lead, ...updates });
                                }}
                            />
                        </div>
                    )}

                    {activeTab === 'partners' && (
                        <div className="partners-view">
                            <BankPartnerPanel
                                lead={lead}
                                bankers={(() => {
                                    // Load bankers from localStorage (shared with BankerRolodex)
                                    const stored = localStorage.getItem('leads_bankers_v1');
                                    if (stored) {
                                        return JSON.parse(stored);
                                    }
                                    // Fallback default bankers
                                    return [
                                        { id: 'b1', name: 'John Mitchell', bank: 'Comerica', branch: 'Riverside', title: 'VP Commercial Banking', phone: '951-555-0101', email: 'jmitchell@comerica.com', trustScore: 5, totalFunded: 12500000, lastDealDate: '2024-10-15', notes: 'Great partner.' },
                                        { id: 'b2', name: 'Sarah Chen', bank: 'Pacific Premier', branch: 'Los Angeles', title: 'SVP', phone: '213-555-0202', email: 'schen@ppbi.com', trustScore: 5, totalFunded: 18200000, lastDealDate: '2024-11-01', notes: 'Top performer.' },
                                        { id: 'b3', name: 'Mike Thompson', bank: 'First Republic', branch: 'Newport Beach', title: 'Director', phone: '949-555-0303', email: 'mthompson@firstrepublic.com', trustScore: 4, totalFunded: 8500000, lastDealDate: '2024-09-20', notes: 'Good for larger deals.' },
                                        { id: 'b4', name: 'Lisa Wong', bank: 'US Bank', branch: 'San Diego', title: 'VP SBA Lending', phone: '619-555-0404', email: 'lwong@usbank.com', trustScore: 4, totalFunded: 6800000, lastDealDate: '2024-08-10', notes: 'SBA preferred lender.' },
                                    ];
                                })()}
                                onAddBankPartner={(partner) => {
                                    const partners = lead.bankPartners || [];
                                    onUpdate({ ...lead, bankPartners: [...partners, partner] });
                                }}
                                onUpdateBankPartner={(bankerId, updates) => {
                                    const partners = lead.bankPartners || [];
                                    const newPartners = partners.map(p =>
                                        p.bankerId === bankerId ? { ...p, ...updates } : p
                                    );
                                    onUpdate({ ...lead, bankPartners: newPartners });
                                }}
                                onRemoveBankPartner={(bankerId) => {
                                    const partners = lead.bankPartners || [];
                                    onUpdate({ ...lead, bankPartners: partners.filter(p => p.bankerId !== bankerId) });
                                }}
                            />
                        </div>
                    )}

                    {activeTab === 'research' && (
                        <div className="research-view">
                            <div className="ai-card">
                                <h3>Deal Analysis & Scoring</h3>
                                {aiAnalysis ? (
                                    <div className="score-card-container">
                                        {(() => {
                                            try {
                                                const result = JSON.parse(aiAnalysis);
                                                // If it's the old string format, throw to catch block
                                                if (typeof result !== 'object') throw new Error();

                                                const getColor = (g: string) => {
                                                    if (g === 'A') return '#22c55e';
                                                    if (g === 'B') return '#eab308';
                                                    return '#ef4444';
                                                };

                                                return (
                                                    <div className="score-dashboard">
                                                        <div className="score-header">
                                                            <div className="score-gauge" style={{ borderColor: getColor(result.grade) }}>
                                                                <span className="score-value">{result.score}</span>
                                                                <span className="score-grade" style={{ color: getColor(result.grade) }}>{result.grade}</span>
                                                            </div>
                                                            <div className="score-summary">
                                                                <h4>{result.recommendation}</h4>
                                                                <div className="score-bars">
                                                                    <div className="bar-row">
                                                                        <label>Industry</label>
                                                                        <div className="bar-bg"><div className="bar-fill" style={{ width: `${(result.breakdown.industry / 40) * 100}%`, background: '#3b82f6' }}></div></div>
                                                                    </div>
                                                                    <div className="bar-row">
                                                                        <label>Digital</label>
                                                                        <div className="bar-bg"><div className="bar-fill" style={{ width: `${(result.breakdown.digital / 30) * 100}%`, background: '#8b5cf6' }}></div></div>
                                                                    </div>
                                                                    <div className="bar-row">
                                                                        <label>Data</label>
                                                                        <div className="bar-bg"><div className="bar-fill" style={{ width: `${(result.breakdown.data / 30) * 100}%`, background: '#ec4899' }}></div></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="score-factors">
                                                            <div className="factor-col">
                                                                <h5>✅ Strengths</h5>
                                                                <ul>
                                                                    {result.factors.positive.map((f: string, i: number) => <li key={i}>{f}</li>)}
                                                                </ul>
                                                            </div>
                                                            <div className="factor-col">
                                                                <h5>❌ Gaps</h5>
                                                                <ul>
                                                                    {result.factors.negative.map((f: string, i: number) => <li key={i}>{f}</li>)}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            } catch (e) {
                                                // Fallback for old text format
                                                return <div className="analysis-content">{aiAnalysis}</div>;
                                            }
                                        })()}
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
                            {/* Add Note Section */}
                            <div className="add-note enhanced">
                                <div className="note-input-row">
                                    <select
                                        value={noteContext}
                                        onChange={e => setNoteContext(e.target.value as any)}
                                        className="context-select"
                                    >
                                        <option value="Call">Call</option>
                                        <option value="Email">Email</option>
                                        <option value="Meeting">Meeting</option>
                                        <option value="Manual">Note</option>
                                    </select>
                                    <textarea
                                        placeholder="Add note..."
                                        value={noteContent}
                                        onChange={e => setNoteContent(e.target.value)}
                                    />
                                </div>
                                <button className="btn-primary" onClick={handleSaveNote} disabled={!noteContent.trim()}>
                                    Add
                                </button>
                            </div>

                            {/* Notes List - Structured */}
                            <div className="notes-list structured">
                                {(!lead.notes || lead.notes.length === 0) ? (
                                    <div className="no-notes">
                                        <p>No notes yet</p>
                                    </div>
                                ) : (
                                    lead.notes.map(note => {
                                        const contextLabel = note.context || (note.type === 'SystemEvent' ? 'System' : 'Note');
                                        const contextClass = note.context?.toLowerCase() || (note.type === 'SystemEvent' ? 'system' : 'note');

                                        return (
                                            <div key={note.id} className={`note-item structured ${note.type} ctx-${contextClass}`}>
                                                <div className="note-context-indicator" />
                                                <div className="note-body">
                                                    <div className="note-header">
                                                        <span className="context-label">{contextLabel}</span>
                                                        <span className="separator">·</span>
                                                        <span className="author">{note.author}</span>
                                                        <span className="separator">·</span>
                                                        <span className="time">{new Date(note.timestamp).toLocaleDateString()} {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="note-content">{note.content}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
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
                
                .edit-input {
                    width: 100%;
                    padding: 6px;
                    border: 1px solid #cbd5e1;
                    border-radius: 4px;
                    font-size: 0.875rem;
                }
                .edit-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                /* Score Card Styles */
                .score-dashboard {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .score-header {
                    display: flex;
                    gap: 2rem;
                    align-items: center;
                }
                .score-gauge {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    border: 8px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    flex-shrink: 0;
                }
                .score-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; line-height: 1; }
                .score-grade { font-size: 1rem; font-weight: 600; margin-top: 4px; }
                .score-summary { flex: 1; }
                .score-summary h4 { margin: 0 0 1rem 0; color: #1e293b; }
                .score-bars { display: flex; flex-direction: column; gap: 0.5rem; }
                .bar-row { display: flex; align-items: center; gap: 1rem; font-size: 0.875rem; }
                .bar-row label { width: 60px; color: #64748b; }
                .bar-bg { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
                .bar-fill { height: 100%; border-radius: 4px; }
                
                .score-factors {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                    background: #f8fafc;
                    padding: 1rem;
                    border-radius: 8px;
                }
                .factor-col h5 { margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #475569; }
                .factor-col ul { margin: 0; padding-left: 1.25rem; }
                .factor-col li { font-size: 0.875rem; color: #334155; margin-bottom: 0.25rem; }

                /* === ENHANCED HEADER STYLES === */
                .modal-header.enhanced {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid #e2e8f0;
                    background: linear-gradient(to bottom, #f8fafc, #ffffff);
                }
                .header-top-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }
                .company-info h2 {
                    margin: 0 0 0.25rem 0;
                    font-size: 1.5rem;
                    color: #1e293b;
                }
                .company-info .legal-name {
                    font-size: 0.85rem;
                    color: #64748b;
                    font-style: italic;
                }
                .header-status-bar {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.75rem 1rem;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    flex-wrap: wrap;
                }
                .status-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .status-label {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    color: #94a3b8;
                    letter-spacing: 0.5px;
                    font-weight: 500;
                }
                .status-value {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #334155;
                }
                .status-value.owner {
                    color: #0284c7;
                }
                .status-value.stage {
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                }
                .status-value.program {
                    color: #7c3aed;
                }
                .status-value.stale {
                    font-weight: 700;
                }
                .status-value.stale.pulse {
                    animation: stalePulse 2s infinite;
                }
                @keyframes stalePulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .status-divider {
                    width: 1px;
                    height: 30px;
                    background: #e2e8f0;
                }

                /* === STRUCTURED NOTES STYLES === */
                .add-note.enhanced {
                    margin-bottom: 1.5rem;
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .note-input-row {
                    display: flex;
                    gap: 0.75rem;
                    margin-bottom: 0.75rem;
                }
                .context-select {
                    padding: 0.5rem 1rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    background: white;
                    min-width: 130px;
                }
                .add-note.enhanced textarea {
                    flex: 1;
                    padding: 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    min-height: 60px;
                    resize: vertical;
                }
                .notes-list.structured {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                }
                .no-notes {
                    text-align: center;
                    padding: 2rem;
                    color: #94a3b8;
                }
                .note-item.structured {
                    display: flex;
                    gap: 0.75rem;
                    padding: 0.875rem 0;
                    border-bottom: 1px solid #f1f5f9;
                }
                .note-item.structured:last-child {
                    border-bottom: none;
                }
                .note-context-indicator {
                    width: 3px;
                    border-radius: 2px;
                    background: #94a3b8;
                    flex-shrink: 0;
                    align-self: stretch;
                }
                .note-item.ctx-call .note-context-indicator { background: #22c55e; }
                .note-item.ctx-email .note-context-indicator { background: #3b82f6; }
                .note-item.ctx-meeting .note-context-indicator { background: #8b5cf6; }
                .note-item.ctx-system .note-context-indicator { background: #f59e0b; }
                .note-item.ctx-note .note-context-indicator { background: #94a3b8; }
                .note-body {
                    flex: 1;
                    min-width: 0;
                }
                .note-item.structured .note-header {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    margin-bottom: 0.25rem;
                    font-size: 0.75rem;
                    color: #94a3b8;
                }
                .note-header .context-label {
                    font-weight: 500;
                    color: #64748b;
                    text-transform: uppercase;
                    font-size: 0.65rem;
                    letter-spacing: 0.5px;
                }
                .note-header .separator {
                    color: #e2e8f0;
                }
                .note-header .author {
                    color: #475569;
                }
                .note-item.structured .note-content {
                    margin: 0;
                    color: #1e293b;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    white-space: pre-wrap;
                }
            `}</style>
            </div>
        </div>
    );
};

export default LeadDetailModal;
