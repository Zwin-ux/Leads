import React, { useState } from 'react';
import type { Lead, Contact } from '@leads/shared';
import { crmService, type Task } from '../services/crmService';
import { M365Actions } from './M365Actions';

interface LeadDrawerProps {
    lead: Lead;
    onClose: () => void;
    onUpdate: (lead: Lead) => void;
    onOpenWorkspace?: () => void; // For underwriters to open full workspace
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({
    lead,
    onClose,
    onUpdate,
    onOpenWorkspace
}) => {
    const [activeTab, setActiveTab] = useState<'details' | 'contacts' | 'tasks' | 'notes' | 'actions'>('details');
    const [editedLead, setEditedLead] = useState<Lead>({ ...lead });
    const [newNote, setNewNote] = useState('');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [tasks, setTasks] = useState<Task[]>(() =>
        crmService.getTasks('all').filter(t => t.leadId === lead.id)
    );

    const handleFieldChange = (field: keyof Lead, value: any) => {
        setEditedLead(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onUpdate(editedLead);
    };

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const notes = editedLead.notes || [];
        const updatedLead = {
            ...editedLead,
            notes: [
                {
                    id: crypto.randomUUID(),
                    content: newNote,
                    timestamp: new Date().toISOString(),
                    author: 'Me',
                    type: 'UserNote' as const
                },
                ...notes
            ]
        };
        setEditedLead(updatedLead);
        onUpdate(updatedLead);
        setNewNote('');

        crmService.addActivity({
            leadId: lead.id,
            type: 'note',
            content: newNote,
            user: 'Me'
        });
    };

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const task = crmService.addTask({
            leadId: lead.id,
            title: newTaskTitle,
            dueDate: new Date().toISOString().split('T')[0],
            type: 'todo',
            priority: 'normal'
        });

        setTasks(prev => [task, ...prev]);
        setNewTaskTitle('');
    };

    const handleToggleTask = (taskId: string) => {
        crmService.toggleTask(taskId);
        setTasks(crmService.getTasks('all').filter(t => t.leadId === lead.id));
    };

    const handleAddContact = () => {
        const contacts = editedLead.contacts || [];
        const newContact: Contact = {
            id: crypto.randomUUID(),
            name: '',
            email: '',
            phone: '',
            role: '',
            isPrimary: contacts.length === 0
        };
        setEditedLead(prev => ({
            ...prev,
            contacts: [...contacts, newContact]
        }));
    };

    const handleUpdateContact = (contactId: string, field: keyof Contact, value: any) => {
        const contacts = (editedLead.contacts || []).map(c =>
            c.id === contactId ? { ...c, [field]: value } : c
        );
        setEditedLead(prev => ({ ...prev, contacts }));
    };

    const handleDeleteContact = (contactId: string) => {
        const contacts = (editedLead.contacts || []).filter(c => c.id !== contactId);
        setEditedLead(prev => ({ ...prev, contacts }));
    };

    const handleSetPrimary = (contactId: string) => {
        const contacts = (editedLead.contacts || []).map(c => ({
            ...c,
            isPrimary: c.id === contactId
        }));
        setEditedLead(prev => ({ ...prev, contacts }));
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.3)',
                    zIndex: 999
                }}
            />

            {/* Drawer */}
            <div style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: 'min(500px, 90vw)',
                background: 'white',
                boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                animation: 'slideIn 0.2s ease-out'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{editedLead.company}</h2>
                            <p style={{ margin: '0.25rem 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
                                {editedLead.firstName} {editedLead.lastName}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                border: 'none',
                                color: 'white',
                                width: '32px',
                                height: '32px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '1.25rem'
                            }}
                        >×</button>
                    </div>

                    {/* Quick Stats */}
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.7 }}>Loan Amount</div>
                            <div style={{ fontWeight: 600 }}>${(editedLead.loanAmount || 0).toLocaleString()}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.7 }}>Stage</div>
                            <div style={{ fontWeight: 600 }}>{editedLead.dealStage || editedLead.stage}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.7 }}>Tasks</div>
                            <div style={{ fontWeight: 600 }}>{tasks.filter(t => !t.completed).length} pending</div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid #e2e8f0',
                    background: '#f8fafc'
                }}>
                    {(['details', 'contacts', 'tasks', 'notes', 'actions'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                border: 'none',
                                background: activeTab === tab ? 'white' : 'transparent',
                                borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                                color: activeTab === tab ? '#3b82f6' : '#64748b',
                                fontWeight: 500,
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                                fontSize: '0.9rem'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '1.25rem' }}>
                    {activeTab === 'details' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="field-group">
                                <label style={labelStyle}>Company Name</label>
                                <input
                                    style={inputStyle}
                                    value={editedLead.company}
                                    onChange={e => handleFieldChange('company', e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>First Name</label>
                                    <input
                                        style={inputStyle}
                                        value={editedLead.firstName}
                                        onChange={e => handleFieldChange('firstName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Last Name</label>
                                    <input
                                        style={inputStyle}
                                        value={editedLead.lastName}
                                        onChange={e => handleFieldChange('lastName', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Email</label>
                                    <input
                                        style={inputStyle}
                                        type="email"
                                        value={editedLead.email}
                                        onChange={e => handleFieldChange('email', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Phone</label>
                                    <input
                                        style={inputStyle}
                                        value={editedLead.phone || ''}
                                        onChange={e => handleFieldChange('phone', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Loan Amount</label>
                                <input
                                    style={inputStyle}
                                    type="number"
                                    value={editedLead.loanAmount || ''}
                                    onChange={e => handleFieldChange('loanAmount', parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={labelStyle}>Stage</label>
                                    <select
                                        style={inputStyle}
                                        value={editedLead.stage}
                                        onChange={e => handleFieldChange('stage', e.target.value)}
                                    >
                                        <option value="New">New</option>
                                        <option value="In Process">In Process</option>
                                        <option value="Qualified">Qualified</option>
                                        <option value="Proposal">Proposal</option>
                                        <option value="Negotiation">Negotiation</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Deal Stage</label>
                                    <select
                                        style={inputStyle}
                                        value={editedLead.dealStage || ''}
                                        onChange={e => handleFieldChange('dealStage', e.target.value)}
                                    >
                                        <option value="">Not Set</option>
                                        <option value="Processing">Processing</option>
                                        <option value="Underwriting">Underwriting</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Closing">Closing</option>
                                        <option value="Funded">Funded</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Industry</label>
                                <input
                                    style={inputStyle}
                                    value={editedLead.industry || ''}
                                    onChange={e => handleFieldChange('industry', e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Property Address</label>
                                <input
                                    style={inputStyle}
                                    value={(editedLead as any).propertyAddress || ''}
                                    onChange={e => handleFieldChange('propertyAddress' as any, e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'contacts' && (
                        <div>
                            <button
                                onClick={handleAddContact}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    marginBottom: '1rem',
                                    border: '2px dashed #cbd5e1',
                                    background: 'white',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    color: '#3b82f6',
                                    fontWeight: 500
                                }}
                            >
                                + Add Contact
                            </button>

                            {(editedLead.contacts || []).map(contact => (
                                <div
                                    key={contact.id}
                                    style={{
                                        padding: '1rem',
                                        marginBottom: '0.75rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        background: contact.isPrimary ? '#eff6ff' : 'white'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {contact.isPrimary && (
                                                <span style={{
                                                    background: '#3b82f6',
                                                    color: 'white',
                                                    padding: '0.125rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.75rem'
                                                }}>Primary</span>
                                            )}
                                            {!contact.isPrimary && (
                                                <button
                                                    onClick={() => handleSetPrimary(contact.id)}
                                                    style={{
                                                        background: 'none',
                                                        border: '1px solid #cbd5e1',
                                                        padding: '0.125rem 0.5rem',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >Set Primary</button>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDeleteContact(contact.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#ef4444',
                                                cursor: 'pointer'
                                            }}
                                        >🗑️</button>
                                    </div>
                                    <input
                                        placeholder="Full Name"
                                        style={inputStyle}
                                        value={contact.name}
                                        onChange={e => handleUpdateContact(contact.id, 'name', e.target.value)}
                                    />
                                    <input
                                        placeholder="Email"
                                        style={{ ...inputStyle, marginTop: '0.5rem' }}
                                        value={contact.email}
                                        onChange={e => handleUpdateContact(contact.id, 'email', e.target.value)}
                                    />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <input
                                            placeholder="Phone"
                                            style={inputStyle}
                                            value={contact.phone || ''}
                                            onChange={e => handleUpdateContact(contact.id, 'phone', e.target.value)}
                                        />
                                        <input
                                            placeholder="Role/Title"
                                            style={inputStyle}
                                            value={contact.role || ''}
                                            onChange={e => handleUpdateContact(contact.id, 'role', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}

                            {(editedLead.contacts || []).length === 0 && (
                                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                                    No contacts yet. Add one above.
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div>
                            <form onSubmit={handleAddTask} style={{ marginBottom: '1rem' }}>
                                <input
                                    placeholder="Add a task..."
                                    style={inputStyle}
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                />
                            </form>

                            {tasks.filter(t => !t.completed).map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => handleToggleTask(task.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem',
                                        marginBottom: '0.5rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        background: 'white'
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        border: '2px solid #3b82f6',
                                        borderRadius: '4px'
                                    }} />
                                    <span style={{ flex: 1 }}>{task.title}</span>
                                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                        {task.dueDate}
                                    </span>
                                </div>
                            ))}

                            {tasks.filter(t => t.completed).length > 0 && (
                                <details style={{ marginTop: '1rem' }}>
                                    <summary style={{ cursor: 'pointer', color: '#64748b', fontSize: '0.9rem' }}>
                                        Completed ({tasks.filter(t => t.completed).length})
                                    </summary>
                                    {tasks.filter(t => t.completed).map(task => (
                                        <div
                                            key={task.id}
                                            onClick={() => handleToggleTask(task.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.75rem',
                                                marginTop: '0.5rem',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                background: '#f8fafc',
                                                opacity: 0.7
                                            }}
                                        >
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                background: '#22c55e',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '0.75rem'
                                            }}>✓</div>
                                            <span style={{ flex: 1, textDecoration: 'line-through' }}>{task.title}</span>
                                        </div>
                                    ))}
                                </details>
                            )}

                            {tasks.length === 0 && (
                                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                                    No tasks for this lead. Add one above.
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div>
                            <div style={{ marginBottom: '1rem' }}>
                                <textarea
                                    placeholder="Add a note..."
                                    style={{
                                        ...inputStyle,
                                        minHeight: '80px',
                                        resize: 'vertical'
                                    }}
                                    value={newNote}
                                    onChange={e => setNewNote(e.target.value)}
                                />
                                <button
                                    onClick={handleAddNote}
                                    disabled={!newNote.trim()}
                                    style={{
                                        marginTop: '0.5rem',
                                        padding: '0.5rem 1rem',
                                        background: newNote.trim() ? '#3b82f6' : '#94a3b8',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: newNote.trim() ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    Add Note
                                </button>
                            </div>

                            {(editedLead.notes || []).map(note => (
                                <div
                                    key={note.id}
                                    style={{
                                        padding: '1rem',
                                        marginBottom: '0.75rem',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        background: '#f8fafc'
                                    }}
                                >
                                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                                        {note.author} • {new Date(note.timestamp).toLocaleDateString()}
                                    </div>
                                    <p style={{ margin: 0, color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                                        {note.content}
                                    </p>
                                </div>
                            ))}

                            {(editedLead.notes || []).length === 0 && (
                                <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                                    No notes yet. Add one above.
                                </p>
                            )}
                        </div>
                    )}

                    {activeTab === 'actions' && (
                        <div>
                            <div style={{ marginBottom: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>📅 Microsoft 365 Actions</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
                                    Schedule meetings, send emails, and find available times using your M365 account.
                                </p>
                            </div>
                            <M365Actions
                                lead={editedLead}
                                onActionComplete={(action, result) => {
                                    crmService.addActivity({
                                        leadId: lead.id,
                                        type: action === 'meeting' ? 'call' : 'email',
                                        content: action === 'meeting'
                                            ? `Scheduled: ${result.subject} on ${result.date}`
                                            : `Email sent to ${result.to}: ${result.subject}`,
                                        user: 'Me'
                                    });
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    background: '#f8fafc'
                }}>
                    {onOpenWorkspace && (
                        <button
                            onClick={onOpenWorkspace}
                            style={{
                                padding: '0.75rem 1rem',
                                background: '#0f766e',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            📝 Open Workspace
                        </button>
                    )}
                    <div style={{ flex: 1 }} />
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        Save Changes
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </>
    );
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#64748b',
    marginBottom: '0.25rem',
    textTransform: 'uppercase',
    letterSpacing: '0.025em'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
};

export default LeadDrawer;
