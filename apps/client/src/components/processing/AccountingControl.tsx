import React, { useState } from 'react';
import { WireLog } from './WireLog';
import { FeeSheet } from './FeeSheet';
import { CheckRequest } from './CheckRequest';

export const AccountingControl: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'wires' | 'fees' | 'checks' | 'funding'>('wires');

    return (
        <div className="accounting-control" style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '2px solid #e2e8f0'
        }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, color: '#0f172a' }}>🏦 Accounting Control Center</h2>
                    <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>Restricted Access: Senior Loan Admin / Sr. Accountant</p>
                </div>
                <div className="tabs" style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.25rem', borderRadius: '8px' }}>
                    <button onClick={() => setActiveTab('wires')} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: activeTab === 'wires' ? 'white' : 'none', fontWeight: 500, boxShadow: activeTab === 'wires' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}>Wire Log</button>
                    <button onClick={() => setActiveTab('fees')} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: activeTab === 'fees' ? 'white' : 'none', fontWeight: 500, boxShadow: activeTab === 'fees' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}>Fee Calculator</button>
                    <button onClick={() => setActiveTab('checks')} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: activeTab === 'checks' ? 'white' : 'none', fontWeight: 500, boxShadow: activeTab === 'checks' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}>Check Requests</button>
                </div>
            </header>

            <div className="accounting-body">
                {activeTab === 'wires' && <WireLog />}
                {activeTab === 'fees' && <FeeSheet />}
                {activeTab === 'checks' && <CheckRequest />}
                {activeTab === 'funding' && <div>Funding Calendar Coming Soon...</div>}
            </div>
        </div>
    );
};
