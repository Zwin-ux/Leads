
import React, { useState, useEffect } from 'react';
import type { Lead } from '@leads/shared';

interface Props {
    lead: Lead;
    onUpdate: (data: any) => void;
}

export const DealStructureCalculator: React.FC<Props> = ({ lead, onUpdate }) => {
    // Default Inputs
    const [price, setPrice] = useState(0);
    const [renovations, setRenovations] = useState(0);
    const [equipment, setEquipment] = useState(0);
    const [program, setProgram] = useState<'504' | '7a'>('504');

    // Calculated State
    const [structure, setStructure] = useState<any>(null);

    useEffect(() => {
        // Load existing structure if available
        if (lead.dealStructure) {
            const saved = lead.dealStructure as any;
            setPrice(saved.price || 0);
            setRenovations(saved.renovations || 0);
            setEquipment(saved.equipment || 0);
            setProgram(saved.program || '504');
        }
    }, [lead]);

    useEffect(() => {
        calculate();
    }, [price, renovations, equipment, program]);

    const calculate = () => {
        const totalProject = price + renovations + equipment;
        if (totalProject === 0) return;

        let bankShare = 0;
        let sbaShare = 0;
        let equityShare = 0;

        if (program === '504') {
            bankShare = 0.50;
            sbaShare = 0.40;
            equityShare = 0.10;
        } else {
            // 7a default
            bankShare = 0.0; // 7a is usually one loan
            sbaShare = 0.90; // Just for visualization, usually 75-90% guarantee
            equityShare = 0.10;
        }

        // Logic for 7a is different (One loan), but for "structure" visualization:
        // 504: Bank (50%), CDC (40%), Borrower (10%)
        // 7a: Lender (75-90%), Borrower (10-25%) -> We'll simplify to 90/10 for simple calculator

        const bankAmount = totalProject * bankShare;
        const sbaAmount = totalProject * sbaShare; // This is the CDC loan in 504
        const equityAmount = totalProject * equityShare;

        setStructure({
            totalProject,
            bank: { amount: bankAmount, pct: bankShare },
            sba: { amount: sbaAmount, pct: sbaShare },
            equity: { amount: equityAmount, pct: equityShare },
            inputs: { price, renovations, equipment, program }
        });
    };

    const handleSave = () => {
        if (!structure) return;
        onUpdate({
            dealStructure: {
                ...structure.inputs,
                result: structure
            }
        });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div style={{
            background: 'var(--surface-card)',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)'
        }}>
            <h3 style={{ marginTop: 0 }}>Deal Structurer ({program})</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Purchase Price</label>
                    <input
                        type="number"
                        value={price || ''}
                        onChange={e => setPrice(Number(e.target.value))}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                        placeholder="$0"
                    />
                </div>
                <div className="input-group">
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Renovations</label>
                    <input
                        type="number"
                        value={renovations || ''}
                        onChange={e => setRenovations(Number(e.target.value))}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                        placeholder="$0"
                    />
                </div>
                <div className="input-group">
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Equipment</label>
                    <input
                        type="number"
                        value={equipment || ''}
                        onChange={e => setEquipment(Number(e.target.value))}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                        placeholder="$0"
                    />
                </div>
                <div className="input-group">
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Program</label>
                    <select
                        value={program}
                        onChange={e => setProgram(e.target.value as any)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                    >
                        <option value="504">SBA 504 (Real Estate)</option>
                        <option value="7a">SBA 7(a) (General)</option>
                    </select>
                </div>
            </div>

            {structure && structure.totalProject > 0 && (
                <div className="structure-result" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 600 }}>
                        <span>Total Project</span>
                        <span>{formatCurrency(structure.totalProject)}</span>
                    </div>

                    <div style={{ margin: '1rem 0', height: '1rem', display: 'flex', borderRadius: '4px', overflow: 'hidden' }}>
                        {program === '504' ? (
                            <>
                                <div style={{ width: '50%', background: '#3b82f6' }} title="Bank (50%)" />
                                <div style={{ width: '40%', background: '#22c55e' }} title="CDC (40%)" />
                                <div style={{ width: '10%', background: '#eab308' }} title="Equity (10%)" />
                            </>
                        ) : (
                            <>
                                <div style={{ width: '90%', background: '#3b82f6' }} title="Lender (90%)" />
                                <div style={{ width: '10%', background: '#eab308' }} title="Equity (10%)" />
                            </>
                        )}
                    </div>

                    <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, background: '#3b82f6', borderRadius: '50%' }} /> {program === '504' ? 'Bank 1st Mtg' : 'Lender Note'} ({program === '504' ? '50%' : '90%'})</span>
                            <span>{formatCurrency(structure.bank.amount || structure.sba.amount)}</span>
                            {/* For 7a we just show strict lender share, but visually 7a is weird in this calc. Let's keep it simple. */}
                        </div>
                        {program === '504' && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%' }} /> SBA 2nd Mtg (40%)</span>
                                <span>{formatCurrency(structure.sba.amount)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 8, height: 8, background: '#eab308', borderRadius: '50%' }} /> Equity (10%)</span>
                            <span>{formatCurrency(structure.equity.amount)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        style={{ width: '100%', marginTop: '1rem', padding: '0.6rem', background: '#3b82f6', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Save Structure
                    </button>
                </div>
            )}
        </div>
    );
};
