import React, { useState } from 'react';
import { apiService } from '../services/apiService';
import { mockSalesTeam } from '../mockData';
import { LogoAds } from './LogoAds';
import type { SalesPerson, AdRequest } from '@leads/shared';

interface AdGeneratorProps {
    onBack: () => void;
}

export const AdGenerator: React.FC<AdGeneratorProps> = ({ onBack }) => {
    const [loading, setLoading] = useState(false);
    const [resultScript, setResultScript] = useState<any>(null);

    const [formData, setFormData] = useState<AdRequest>({
        product: 'SBA 504 Loan',
        goal: 'Drive applications',
        tone: 'Professional but urgent',
        length: 'Short',
        salesPersonId: '',
        notes: ''
    });

    const handleChange = (field: keyof AdRequest, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const result = await apiService.generateAd(formData);
            setResultScript(result);
        } catch (error) {
            console.error(error);
            alert("Failed to generate ad. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    return (
        <div className="ad-generator-page" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{
                padding: '1.5rem 2rem',
                background: 'white',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>←</button>
                <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Ad Generator</h1>
            </div>

            <div style={{ flex: 1, padding: '2rem', display: 'flex', gap: '2rem', overflowY: 'auto', background: '#f8fafc' }}>
                {/* Left Column: Controls */}
                <div style={{ flex: 1, maxWidth: '500px', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <h2 style={{ marginTop: 0, color: '#334155' }}>Campaign Settings</h2>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Product Focus</label>
                        <select
                            value={formData.product}
                            onChange={(e) => handleChange('product', e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="SBA 504 Loan">SBA 504 Loan (Real Estate)</option>
                            <option value="SBA 7(a) Loan">SBA 7(a) Loan (Working Capital)</option>
                            <option value="Community Advantage">Community Advantage</option>
                            <option value="Microloan">Microloan</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Primary Goal</label>
                        <select
                            value={formData.goal}
                            onChange={(e) => handleChange('goal', e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="Drive applications">Drive Applications</option>
                            <option value="Brand awareness">Brand Awareness</option>
                            <option value="Educate borrowers">Educate Borrowers</option>
                            <option value="Event sign-up">Event Sign-up</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Tone</label>
                        <select
                            value={formData.tone}
                            onChange={(e) => handleChange('tone', e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="Professional but urgent">Professional but Urgent</option>
                            <option value="Friendly and educational">Friendly and Educational</option>
                            <option value="Confident and authoritative">Confident and Authoritative</option>
                            <option value="Local and community-focused">Local and Community-Focused</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Length</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {['Short', 'Medium', 'Long'].map((len) => (
                                <label key={len} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="length"
                                        value={len}
                                        checked={formData.length === len}
                                        onChange={(e) => handleChange('length', e.target.value)}
                                        style={{ marginRight: '0.5rem' }}
                                    />
                                    {len}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Call to Action Person</label>
                        <select
                            value={formData.salesPersonId}
                            onChange={(e) => handleChange('salesPersonId', e.target.value)}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        >
                            <option value="">-- General AmPac Line --</option>
                            {mockSalesTeam.map((sp: any) => (
                                <option key={sp.id} value={sp.id}>{sp.name} - {sp.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#475569' }}>Additional Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="e.g. Mention the upcoming webinar on Tuesday..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', minHeight: '80px' }}
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: loading ? 'wait' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Generatin Script...' : '✨ Generate Ad Script'}
                    </button>
                </div>

                {/* Right Column: Preview */}
                <div style={{ flex: 1 }}>
                    <h2 style={{ marginTop: 0, color: '#334155' }}>Preview</h2>
                    <LogoAds script={resultScript} mode="generator" />

                    {resultScript && (
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => copyToClipboard(resultScript.beats.join('\n'))}
                                style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', cursor: 'pointer' }}
                            >
                                📋 Copy Script
                            </button>
                            <button
                                onClick={() => copyToClipboard(resultScript.caption)}
                                style={{ flex: 1, padding: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', cursor: 'pointer' }}
                            >
                                📝 Copy Caption
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
