import React, { useState, useEffect } from 'react';
import { accountingService, type WireTransaction } from '../../services/accountingService';

export const WireLog: React.FC = () => {
    const [wires, setWires] = useState<WireTransaction[]>([]);
    const [newWire, setNewWire] = useState({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        type: 'inbound' as const,
        description: '',
        referenceNumber: '',
    });

    useEffect(() => {
        setWires(accountingService.getWires());
    }, []);

    const handleAdd = () => {
        if (!newWire.description || !newWire.amount) return;
        accountingService.addWire({ ...newWire, status: 'pending' });
        setWires(accountingService.getWires());
        setNewWire({ ...newWire, amount: 0, description: '', referenceNumber: '' });
    };

    const toggleStatus = (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'pending' ? 'cleared' : 'pending';
        setWires(accountingService.updateWireStatus(id, newStatus));
    };

    const totalInbound = wires.filter(w => w.type === 'inbound' && w.status === 'cleared').reduce((sum, w) => sum + w.amount, 0);
    const totalOutbound = wires.filter(w => w.type === 'outbound' && w.status === 'cleared').reduce((sum, w) => sum + w.amount, 0);

    return (
        <div className="wire-log" style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>💸 Wire Transfer Ledger</span>
                <div style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>
                    <span style={{ color: '#16a34a', marginRight: '1rem' }}>In: ${totalInbound.toLocaleString()}</span>
                    <span style={{ color: '#dc2626' }}>Out: ${totalOutbound.toLocaleString()}</span>
                </div>
            </h3>

            <div className="add-wire-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: '0.5rem', marginBottom: '1.5rem', background: '#f8fafc', padding: '1rem', borderRadius: '6px' }}>
                <input type="date" value={newWire.date} onChange={e => setNewWire({ ...newWire, date: e.target.value })} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                <select value={newWire.type} onChange={e => setNewWire({ ...newWire, type: e.target.value as any })} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                    <option value="inbound">Inbound (Credit)</option>
                    <option value="outbound">Outbound (Debit)</option>
                </select>
                <input type="number" placeholder="Amount" value={newWire.amount || ''} onChange={e => setNewWire({ ...newWire, amount: parseFloat(e.target.value) })} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                <input type="text" placeholder="Description / Client" value={newWire.description} onChange={e => setNewWire({ ...newWire, description: e.target.value })} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                <input type="text" placeholder="Ref #" value={newWire.referenceNumber} onChange={e => setNewWire({ ...newWire, referenceNumber: e.target.value })} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                <button onClick={handleAdd} style={{ background: '#0f172a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0.5rem 1rem' }}>Add Log</button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ background: '#f1f5f9', textAlign: 'left', color: '#64748b' }}>
                        <th style={{ padding: '0.75rem' }}>Date</th>
                        <th style={{ padding: '0.75rem' }}>Type</th>
                        <th style={{ padding: '0.75rem' }}>Amount</th>
                        <th style={{ padding: '0.75rem' }}>Description</th>
                        <th style={{ padding: '0.75rem' }}>Ref #</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {wires.map(wire => (
                        <tr key={wire.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '0.75rem' }}>{wire.date}</td>
                            <td style={{ padding: '0.75rem' }}>
                                <span style={{
                                    padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600',
                                    background: wire.type === 'inbound' ? '#dcfce7' : '#fee2e2',
                                    color: wire.type === 'inbound' ? '#166534' : '#991b1b'
                                }}>
                                    {wire.type.toUpperCase()}
                                </span>
                            </td>
                            <td style={{ padding: '0.75rem', fontWeight: '600' }}>${wire.amount.toLocaleString()}</td>
                            <td style={{ padding: '0.75rem' }}>{wire.description}</td>
                            <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>{wire.referenceNumber}</td>
                            <td style={{ padding: '0.75rem' }}>
                                <button
                                    onClick={() => toggleStatus(wire.id, wire.status)}
                                    style={{
                                        border: 'none', background: 'none', cursor: 'pointer',
                                        color: wire.status === 'cleared' ? '#16a34a' : '#ca8a04',
                                        fontWeight: '600'
                                    }}
                                >
                                    {wire.status === 'cleared' ? '✓ CLEARED' : '⏳ PENDING'}
                                </button>
                            </td>
                        </tr>
                    ))}
                    {wires.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No wire logs found.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
