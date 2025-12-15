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
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 1000,
            display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <form onSubmit={handleSubmit} className="add-lead-form" style={{
                background: '#18181b', padding: '2rem', borderRadius: '12px',
                width: '100%', maxWidth: '600px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, color: 'white' }}>Add New Lead</h3>
                    <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

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

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <input
                        placeholder="First Name"
                        value={formData.firstName || ''}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                        required
                    />
                    <input
                        placeholder="Last Name"
                        value={formData.lastName || ''}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                        required
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <input
                        placeholder="Email"
                        type="email"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                        required
                    />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                    <input
                        placeholder="Company (Display Name)"
                        value={formData.company || ''}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                        required
                    />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                    <input
                        placeholder="Legal Business Name"
                        value={formData.businessName || ''}
                        onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                    />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <input
                        placeholder="Property Address (Street)"
                        value={formData.propertyAddress || ''}
                        onChange={e => setFormData({ ...formData, propertyAddress: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                    />
                    <input
                        placeholder="State (e.g. CA)"
                        value={formData.stateOfInc || ''}
                        onChange={e => setFormData({ ...formData, stateOfInc: e.target.value })}
                        maxLength={2}
                        style={{ width: '100%', padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                    />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <input
                        placeholder="City"
                        value={formData.city || ''}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                    />
                    <input
                        placeholder="Phone"
                        value={formData.phone || ''}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                    />
                    <input
                        placeholder="NAICS Code"
                        value={formData.naicsCode || ''}
                        onChange={e => setFormData({ ...formData, naicsCode: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#fff' }}
                    />
                </div>

                <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
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
                <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button type="button" className="secondary" onClick={onCancel} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid #3f3f46', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                    <button type="submit" className="primary" style={{ padding: '0.75rem 1.5rem', background: '#2563eb', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Save & Enrich</button>
                </div>
            </form>
        </div>
    );
};

export default AddLeadForm;
