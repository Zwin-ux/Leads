import React, { useState } from 'react';
import type { Lead } from '@leads/shared';
import { TEAM_MEMBERS } from '../services/authService';
import { enrichmentService } from '../services/enrichmentService';

const AddLeadForm: React.FC<{ onAdd: (lead: Lead) => void, onCancel: () => void }> = ({ onAdd, onCancel }) => {
    const [formData, setFormData] = useState<Partial<Lead>>({
        stage: 'New',
        dealStage: 'Prospect',
        loanProgram: '504',
        owner: 'Unassigned',
        stateOfInc: 'CA' // Default to CA for demo
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // 1. Add Lead (Optimistic)
        const newLead = { ...formData, id: crypto.randomUUID() } as Lead;
        onAdd(newLead);

        // 2. Trigger Enrichment in Background
        try {
            await enrichmentService.enrichIntake(newLead);
            console.log("Enrichment complete for", newLead.company);
        } catch (err) {
            console.error("Enrichment failed", err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="add-lead-form">
            <h3>Add New Lead</h3>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Assign To</label>
                <select
                    value={formData.owner || ''}
                    onChange={e => setFormData({ ...formData, owner: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                >
                    <option value="Unassigned">Unassigned</option>
                    {TEAM_MEMBERS.map(member => (
                        <option key={member.email} value={member.name}>{member.name}</option>
                    ))}
                </select>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
            </div>

            <input
                placeholder="Email"
                type="email"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
            />
            <input
                placeholder="Company (Display Name)"
                value={formData.company || ''}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                required
            />
            <input
                placeholder="Legal Business Name"
                value={formData.businessName || ''}
                onChange={e => setFormData({ ...formData, businessName: e.target.value })}
            />

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <input
                    placeholder="Property Address (Street)"
                    value={formData.propertyAddress || ''}
                    onChange={e => setFormData({ ...formData, propertyAddress: e.target.value })}
                />
                <input
                    placeholder="State (e.g. CA)"
                    value={formData.stateOfInc || ''}
                    onChange={e => setFormData({ ...formData, stateOfInc: e.target.value })}
                    maxLength={2}
                />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <input
                    placeholder="City"
                    value={formData.city || ''}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                />
                <input
                    placeholder="Phone"
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
                <input
                    placeholder="NAICS Code"
                    value={formData.naicsCode || ''}
                    onChange={e => setFormData({ ...formData, naicsCode: e.target.value })}
                />
            </div>

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
                <button type="submit" className="primary">Save & Enrich</button>
                <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
};

export default AddLeadForm;
