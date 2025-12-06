import React, { useState } from 'react';
import type { UnderwritingAnalysis } from '../../services/underwritingService';

interface RiskScorecardProps {
    analysis: UnderwritingAnalysis;
    onUpdate: (rating: number, strengths: string[], weaknesses: string[]) => void;
    onClose: () => void;
}

export const RiskScorecard: React.FC<RiskScorecardProps> = ({ analysis, onUpdate, onClose }) => {
    const [rating, setRating] = useState(analysis.riskRating);
    const [strengths, setStrengths] = useState<string[]>(analysis.strengths);
    const [weaknesses, setWeaknesses] = useState<string[]>(analysis.weaknesses);
    const [newStrength, setNewStrength] = useState('');
    const [newWeakness, setNewWeakness] = useState('');

    const handleSave = () => {
        onUpdate(rating, strengths, weaknesses);
        onClose();
    };

    const addStrength = () => {
        if (newStrength.trim()) {
            setStrengths([...strengths, newStrength.trim()]);
            setNewStrength('');
        }
    };

    const addWeakness = () => {
        if (newWeakness.trim()) {
            setWeaknesses([...weaknesses, newWeakness.trim()]);
            setNewWeakness('');
        }
    };

    const getRiskColor = (r: number) => {
        if (r <= 3) return '#22c55e'; // Low Risk
        if (r <= 6) return '#f59e0b'; // Moderate
        return '#ef4444'; // High Risk
    };

    return (
        <div className="modal-backdrop" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                background: 'white', padding: '2rem', borderRadius: '12px', width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, color: '#1e293b' }}>Risk Rating Scorecard</h2>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                <div className="rating-selector" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>OVERALL RISK RATING (1-10)</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <button
                                key={num}
                                onClick={() => setRating(num)}
                                style={{
                                    width: '40px', height: '40px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                                    fontWeight: 'bold', fontSize: '1rem',
                                    background: rating === num ? getRiskColor(num) : '#f1f5f9',
                                    color: rating === num ? 'white' : '#64748b',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                    <div style={{ marginTop: '0.5rem', fontWeight: 500, color: getRiskColor(rating) }}>
                        {rating <= 3 ? 'Low Risk - Preferred' : rating <= 6 ? 'Moderate Risk - Standard' : 'High Risk - Warning'}
                    </div>
                </div>

                <div className="factors-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <h4 style={{ color: '#0f766e', borderBottom: '2px solid #ccfbf1', paddingBottom: '0.5rem' }}>Strengths</h4>
                        <ul style={{ paddingLeft: '1.25rem', color: '#334155' }}>
                            {strengths.map((s, i) => (
                                <li key={i} style={{ marginBottom: '0.25rem' }}>
                                    {s} <button onClick={() => setStrengths(strengths.filter((_, idx) => idx !== i))} style={{ marginLeft: '5px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
                                </li>
                            ))}
                        </ul>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <input
                                value={newStrength}
                                onChange={e => setNewStrength(e.target.value)}
                                placeholder="Add strength..."
                                onKeyDown={e => e.key === 'Enter' && addStrength()}
                                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                            />
                            <button onClick={addStrength} style={{ background: '#0f766e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0.5rem' }}>+</button>
                        </div>
                    </div>

                    <div>
                        <h4 style={{ color: '#b91c1c', borderBottom: '2px solid #fecaca', paddingBottom: '0.5rem' }}>Weaknesses</h4>
                        <ul style={{ paddingLeft: '1.25rem', color: '#334155' }}>
                            {weaknesses.map((w, i) => (
                                <li key={i} style={{ marginBottom: '0.25rem' }}>
                                    {w} <button onClick={() => setWeaknesses(weaknesses.filter((_, idx) => idx !== i))} style={{ marginLeft: '5px', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
                                </li>
                            ))}
                        </ul>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <input
                                value={newWeakness}
                                onChange={e => setNewWeakness(e.target.value)}
                                placeholder="Add weakness..."
                                onKeyDown={e => e.key === 'Enter' && addWeakness()}
                                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                            />
                            <button onClick={addWeakness} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0.5rem' }}>+</button>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleSave} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', background: '#0f172a', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Save Rating</button>
                </div>
            </div>
        </div>
    );
};
