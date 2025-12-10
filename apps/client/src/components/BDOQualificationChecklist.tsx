
import React, { useState, useEffect } from 'react';
import type { Lead } from '@leads/shared';

interface Props {
    lead: Lead;
    onUpdate: (updates: Partial<Lead>) => Promise<void>;
}

// BDO Pre-Flight Checklist
const CHECKLIST_ITEMS = [
    { id: 'years_business', label: 'Business Operating for 2+ Years?', weight: 20 },
    { id: 'owner_occupied', label: 'Owner Occupied (51%+)?', weight: 40 }, // Critical for 504
    { id: 'cash_flow', label: 'Cash Flow Positive?', weight: 30 },
    { id: 'credit_score', label: 'Credit Score > 650?', weight: 10 }
];

export const BDOQualificationChecklist: React.FC<Props> = ({ lead, onUpdate }) => {
    const [checklist, setChecklist] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (lead.qualificationData) {
            setChecklist(lead.qualificationData as Record<string, boolean>);
        }
    }, [lead]);

    const calculateScore = (currentChecklist: Record<string, boolean>) => {
        let score = 0;
        CHECKLIST_ITEMS.forEach(item => {
            if (currentChecklist[item.id]) score += item.weight;
        });
        return score;
    };

    const handleToggle = async (itemId: string) => {
        const newChecklist = { ...checklist, [itemId]: !checklist[itemId] };
        setChecklist(newChecklist);
        setLoading(true);

        const newScore = calculateScore(newChecklist);

        // Initialize with current stage
        let newStage = lead.dealStage;

        // Auto-promote if highly qualified
        if (newScore >= 90 && lead.dealStage === 'Prospect') {
            newStage = 'Application';
        }

        try {
            await onUpdate({
                qualificationData: newChecklist,
                leadScore: newScore,
                dealStage: newStage as any
            });
        } catch (e) {
            console.error("Failed to update qualification", e);
        } finally {
            setLoading(false);
        }
    };

    const currentScore = calculateScore(checklist);

    return (
        <div style={{
            background: 'var(--surface-card)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)'
        }}>
            <h3 style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                BDO Qualification
                <span style={{
                    fontSize: '0.9rem',
                    background: currentScore >= 70 ? '#166534' : '#854d0e',
                    color: currentScore >= 70 ? '#dcfce7' : '#fef9c3',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px'
                }}>
                    Score: {currentScore}/100
                </span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {CHECKLIST_ITEMS.map(item => (
                    <label key={item.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                        cursor: 'pointer',
                        padding: '0.8rem',
                        background: checklist[item.id] ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        border: '1px solid',
                        borderColor: checklist[item.id] ? 'rgba(34, 197, 94, 0.3)' : 'transparent',
                        transition: 'all 0.2s'
                    }}>
                        <input
                            type="checkbox"
                            checked={!!checklist[item.id]}
                            onChange={() => handleToggle(item.id)}
                            disabled={loading}
                            style={{ transform: 'scale(1.2)' }}
                        />
                        <span style={{ fontWeight: 500 }}>{item.label}</span>
                    </label>
                ))}
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Current Stage: <strong style={{ color: 'var(--text-primary)' }}>{lead.dealStage || 'New'}</strong>
                </div>
                {/* Visual Progress Bar */}
                <div style={{ height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${currentScore}%`,
                        height: '100%',
                        background: currentScore >= 70 ? '#22c55e' : '#eab308',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            </div>
        </div>
    );
};
