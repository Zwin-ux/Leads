import React, { useState } from 'react';
import { accountingService, type FeeCalculation } from '../../services/accountingService';

export const FeeSheet: React.FC = () => {
    const [amount, setAmount] = useState(0);
    const [calc, setCalc] = useState<FeeCalculation | null>(null);

    const handleCalculate = () => {
        setCalc(accountingService.calculateFees(amount));
    };

    return (
        <div className="fee-sheet" style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>🧮 504 Fee Calculator</h3>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#64748b' }}>Loan Amount ($)</label>
                    <input
                        type="number"
                        value={amount || ''}
                        onChange={e => setAmount(parseFloat(e.target.value))}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1.1rem' }}
                    />
                </div>
                <button onClick={handleCalculate} style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Calculate Fees
                </button>
            </div>

            {calc && (
                <div className="results" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ color: '#475569' }}>CDC Processing Fee (1.5%)</div>
                        <div style={{ fontWeight: 600 }}>${calc.cdcProcessingFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ color: '#475569' }}>SBA Guarantee Fee (0.5%)</div>
                        <div style={{ fontWeight: 600 }}>${calc.sbaGuaranteeFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ color: '#475569' }}>Funding Fee (0.25%)</div>
                        <div style={{ fontWeight: 600 }}>${calc.fundingFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ color: '#475569' }}>Underwriting Fee (0.4%)</div>
                        <div style={{ fontWeight: 600 }}>${calc.underwritingFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>

                    <div style={{ borderTop: '2px solid #cbd5e1', paddingTop: '1rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total Closing Fees</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2563eb' }}>${calc.totalFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                </div>
            )}
        </div>
    );
};
