import React, { useState } from 'react';
import type { Lead } from '@leads/shared';

const AddLeadForm: React.FC<{ onAdd: (lead: Lead) => void, onCancel: () => void }> = ({ onAdd, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Lead>>({
        stage: 'New',
        dealStage: 'Prospecting',
        loanProgram: '504'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(formData as Lead);
    };

    return (
        <form onSubmit={handleSubmit} className="add-lead-form">
            <h3>Add New Lead</h3>
            <input
                placeholder="First Name"
                value={formData.firstName || ''}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                required
            />
            <input
                placeholder="Last Name"
                value={formData.lastName || ''}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                required
            />
            <input
                placeholder="Email"
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
            />
            <input
                placeholder="Company"
                value={formData.company || ''}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
            />
            <div className="form-row" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <select
                    value={formData.loanProgram}
                    onChange={e => setFormData({ ...formData, loanProgram: e.target.value as any })}
                    style={{ flex: 1, padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                >
                    <option value="504">SBA 504</option>
                    <option value="7a">SBA 7(a)</option>
                    <option value="Micro">Microloan</option>
                </select>
                <select
                    value={formData.dealStage}
                    onChange={e => setFormData({ ...formData, dealStage: e.target.value as any })}
                    style={{ flex: 1, padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                >
                    <option value="Prospecting">Prospecting</option>
                    <option value="Prequal">Prequal</option>
                    <option value="App">App</option>
                    <option value="Underwriting">Underwriting</option>
                    <option value="Closing">Closing</option>
                </select>
            </div>
            <div className="form-actions">
                <button type="submit" className="primary">Save</button>
                <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
};

export default AddLeadForm;
