import React, { useState } from 'react';
import type { Lead, Stipulation } from '@leads/shared';

interface StipulationBoardProps {
    lead: Lead;
    onUpdateStips: (stips: Stipulation[]) => void;
    onClose: () => void;
}

export const StipulationBoard: React.FC<StipulationBoardProps> = ({ lead, onUpdateStips, onClose }) => {
    // Local state for optimistic UI, syncs back via onUpdateStips
    const [stips, setStips] = useState<Stipulation[]>(lead.stipulations || []);
    const [newStip, setNewStip] = useState('');

    // Columns
    const columns = {
        'Pending': { color: '#ef4444', label: '🔴 Action Required' },
        'In Review': { color: '#f59e0b', label: '🟡 In Review' },
        'Cleared': { color: '#10b981', label: '🟢 Cleared' }
    };

    const handleAddStip = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStip.trim()) return;

        const newItem: Stipulation = {
            id: Date.now().toString(),
            title: newStip,
            description: '',
            status: 'Pending',
            assignedTo: 'BDO',
            comments: [],
            createdAt: new Date().toISOString()
        };

        const updated = [...stips, newItem];
        setStips(updated);
        onUpdateStips(updated);
        setNewStip('');
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('stipId', id);
    };

    const handleDrop = (e: React.DragEvent, newStatus: any) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('stipId');

        setStips(prev => {
            const updated = prev.map(s => s.id === id ? { ...s, status: newStatus } : s);
            onUpdateStips(updated);
            return updated;
        });
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{ background: 'white', width: '900px', height: '80vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>🏓 Stipulation Manager</h2>
                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{lead.company}</div>
                    </div>
                    <button onClick={onClose} style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>✖</button>
                </div>

                {/* Add Bar */}
                <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '1rem' }}>
                    <input
                        value={newStip}
                        onChange={e => setNewStip(e.target.value)}
                        placeholder="Add new condition (e.g. 'Proof of Down Payment')..."
                        style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        onKeyDown={e => e.key === 'Enter' && handleAddStip(e)}
                    />
                    <button onClick={handleAddStip} className="btn-primary">+ Add Stip</button>
                </div>

                {/* Board */}
                <div style={{ flex: 1, display: 'flex', padding: '1rem', gap: '1rem', background: '#f1f5f9', overflowX: 'auto' }}>
                    {Object.entries(columns).map(([status, config]) => (
                        <div
                            key={status}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => handleDrop(e, status)}
                            style={{ flex: 1, minWidth: '250px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ padding: '1rem', fontWeight: 'bold', color: '#475569', borderBottom: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: config.color }}></div>
                                {config.label}
                                <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>
                                    {stips.filter(s => s.status === status).length}
                                </span>
                            </div>

                            <div style={{ padding: '1rem', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {stips.filter(s => s.status === status).map(stip => (
                                    <div
                                        key={stip.id}
                                        draggable
                                        onDragStart={e => handleDragStart(e, stip.id)}
                                        style={{ background: 'white', padding: '1rem', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'grab' }}
                                    >
                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{stip.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>Assigned: {stip.assignedTo}</div>

                                        {/* Mock Comment Count */}
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                            💬 {stip.comments.length} comments
                                        </div>
                                    </div>
                                ))}
                                {stips.filter(s => s.status === status).length === 0 && (
                                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', marginTop: '1rem' }}>
                                        Drag items here
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
