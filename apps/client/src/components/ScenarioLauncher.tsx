import React, { useState } from 'react';
import { apiService } from '../services/apiService';

export const ScenarioLauncher: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [form, setForm] = useState({
        industry: '',
        amount: '',
        collateral: '',
        story: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('msal_token') || 'demo_token';
            // Assuming current user is BDO - in prod we get this from Auth
            const bdo = "Ed Ryan";

            await apiService.triggerScenario({
                ...form,
                amount: parseInt(form.amount) || 0,
                bdo
            }, token);

            alert('✅ Scenario Sent to Underwriting Desk!');
            setIsOpen(false);
            setForm({ industry: '', amount: '', collateral: '', story: '' });
        } catch (err: any) {
            alert('❌ Failed: ' + err.message);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="btn-secondary"
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    background: '#6366f1',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '50px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    zIndex: 100
                }}
            >
                🎭 Ask Scenario
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 101
        }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '400px' }}>
                <h2 style={{ marginTop: 0 }}>🎭 Scenario Desk</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Get a quick Yes/No/Discuss from Underwriting.</p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                        placeholder="Industry (e.g. Gas Station)"
                        value={form.industry}
                        onChange={e => setForm({ ...form, industry: e.target.value })}
                        required
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                    <input
                        placeholder="Loan Amount ($)"
                        type="number"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        required
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                    <input
                        placeholder="Collateral (e.g. Real Estate)"
                        value={form.collateral}
                        onChange={e => setForm({ ...form, collateral: e.target.value })}
                        required
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                    <textarea
                        placeholder="The Story (Strengths/Weaknesses)..."
                        value={form.story}
                        onChange={e => setForm({ ...form, story: e.target.value })}
                        required
                        rows={4}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>Send to Desk</button>
                        <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
