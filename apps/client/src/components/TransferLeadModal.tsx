import React, { useState } from 'react';
import { TEAM_MEMBERS } from '../services/authService';
import type { Lead } from '@leads/shared';

interface TransferLeadModalProps {
    lead: Lead;
    onClose: () => void;
    onTransfer: (leadId: string, newOwner: string, message: string, type: 'transfer' | 'collaborate') => void;
}

const TransferLeadModal: React.FC<TransferLeadModalProps> = ({ lead, onClose, onTransfer }) => {
    const [selectedMember, setSelectedMember] = useState(TEAM_MEMBERS[0].name);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'transfer' | 'collaborate'>('transfer');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onTransfer(lead.id, selectedMember, message, type);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3>Transfer Lead: {lead.company}</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Action Type</label>
                        <div className="segmented-control" style={{ width: '100%', display: 'flex' }}>
                            <button
                                type="button"
                                className={type === 'transfer' ? 'active' : ''}
                                onClick={() => setType('transfer')}
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                ➡️ Transfer Ownership
                            </button>
                            <button
                                type="button"
                                className={type === 'collaborate' ? 'active' : ''}
                                onClick={() => setType('collaborate')}
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                🤝 Add Collaborator
                            </button>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                            {type === 'transfer'
                                ? "You will lose ownership of this lead. The new owner will be notified."
                                : "You will remain the owner. The selected member will be added to the deal team."}
                        </p>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Team Member</label>
                        <select
                            value={selectedMember}
                            onChange={(e) => setSelectedMember(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                        >
                            {TEAM_MEMBERS.map(member => (
                                <option key={member.email} value={member.name}>
                                    {member.name} ({member.title})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Message (Optional)</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Add a note about why you're transferring this lead..."
                            rows={3}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                        />
                    </div>

                    <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary">
                            {type === 'transfer' ? 'Transfer Lead' : 'Add Collaborator'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TransferLeadModal;
