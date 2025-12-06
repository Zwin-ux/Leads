import React from 'react';
import type { Financials } from '../../services/underwritingService';

interface FinancialsGridProps {
    financials: Financials;
    onChange: (field: keyof Financials, value: number) => void;
}

export const FinancialsGrid: React.FC<FinancialsGridProps> = ({ financials, onChange }) => {
    return (
        <div className="financials-grid">
            <h4>Financial Spreading (Annual)</h4>
            <div className="grid-form">
                <div className="input-group">
                    <label>Gross Revenue</label>
                    <input
                        type="number"
                        value={financials.revenue}
                        onChange={e => onChange('revenue', Number(e.target.value))}
                    />
                </div>
                <div className="input-group">
                    <label>COGS</label>
                    <input
                        type="number"
                        value={financials.coqs}
                        onChange={e => onChange('coqs', Number(e.target.value))}
                    />
                </div>
                <div className="input-group">
                    <label>OpEx (Expenses)</label>
                    <input
                        type="number"
                        value={financials.opex}
                        onChange={e => onChange('opex', Number(e.target.value))}
                    />
                </div>
                <div className="input-group calc-result">
                    <label>Net Operating Income (NOI)</label>
                    <div className="value">${financials.noi.toLocaleString()}</div>
                </div>
                <div className="input-group">
                    <label>Proposed Debt Service</label>
                    <input
                        type="number"
                        value={financials.debtService}
                        onChange={e => onChange('debtService', Number(e.target.value))}
                    />
                </div>
                <div className="input-group calc-result major">
                    <label>DSCR</label>
                    <div className={`value ${financials.dscr >= 1.25 ? 'pass' : 'fail'}`}>
                        {financials.dscr}x
                    </div>
                </div>
            </div>

            <style>{`
                .financials-grid h4 { margin-top: 0; color: #475569; }
                .grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .input-group label { display: block; font-size: 0.8rem; color: #64748b; margin-bottom: 0.25rem; }
                .input-group input { width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 4px; }
                .calc-result .value { font-size: 1.1rem; font-weight: 700; color: #1e293b; padding: 0.5rem 0; }
                .calc-result.major .value { font-size: 1.5rem; }
                .calc-result.major .pass { color: #16a34a; }
                .calc-result.major .fail { color: #dc2626; }
            `}</style>
        </div>
    );
};
