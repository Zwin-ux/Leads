import React, { useState, useMemo } from 'react';

type LoanProgram = '504_standard' | '504_refi_expansion' | '504_refi_no_expansion';

interface CalculatorState {
    loanAmount: number;
    program: LoanProgram;
    epcCount: number;
    ocCount: number;
    guarantorCount: number;
}

export const FeeCalculator: React.FC = () => {
    const [state, setState] = useState<CalculatorState>({
        loanAmount: 1000000,
        program: '504_standard',
        epcCount: 1,
        ocCount: 1,
        guarantorCount: 1
    });

    const results = useMemo(() => {
        // 1. Gross Debenture Closing Costs Logic
        // Base is derived from the "Gross Debenture" which handles the fees rolled in.
        // For simplicity in this estimator, we calculate the 'Cash' closing costs first.

        let closingCost = 0;
        const totalGuarantors = state.guarantorCount; // Additional guarantors

        // Logic from spec:
        // 1 EPC, 1 OC with 3 or less additional guarantors = $4,500
        // 1 EPC, 1 OC with 6 or less additional guarantors = $5,500
        // 1 EPC, 1 OC with 10 or more additional guarantors = $7,500
        // We'll treat "6 or less" as 4-6, and "10 or more" as 7+ for strict buckets based on the gaps? 
        // Or strictly following the text:

        if (totalGuarantors <= 3) {
            closingCost = 4500;
        } else if (totalGuarantors <= 6) {
            closingCost = 5500;
        } else {
            // >= 7 usually falls here or specific 10+ rule? 
            // The prompt said "10 or more = 7500". 
            // We will interpolate 7-9 as likely 7500 for safety or keep 5500? 
            // Let's assume >6 is the high tier for now to be safe.
            closingCost = 7500;
        }

        // 2. Guarantee Fee Logic
        // Interim Loan Fee (0.50%) + Annual Service Fee (0.2475% or 0.2590%)
        // Note: Annual Service Fee is ongoing, not upfront closing cost, but often requested to be known.
        // Interim Loan Fee is often paid at closing or netted.

        const interimFeeRate = 0.0050; // 0.50%
        const interimFee = state.loanAmount * interimFeeRate;

        // Annual Service Fee Rate
        const serviceFeeRate = state.program === '504_refi_no_expansion' ? 0.002590 : 0.002475;
        const estimatedAnnualFee = state.loanAmount * serviceFeeRate;

        // Total "Upfront" Estimated (CDC Closing Cost + Interim Fee)
        // Note: Usually there's also a CSA fee, Underwriting fee, etc. but we stick to the user's explicit request.
        const totalUpfront = closingCost + interimFee;

        return {
            closingCost,
            interimFee,
            estimatedAnnualFee,
            totalUpfront,
            serviceFeeRate
        };
    }, [state]);

    return (
        <div className="fee-calculator">
            <div className="calc-header">
                <h3>💰 504 Fee Estimator</h3>
            </div>

            <div className="calc-body">
                <div className="input-group">
                    <label>Debenture Amount ($)</label>
                    <input
                        type="number"
                        value={state.loanAmount}
                        onChange={e => setState({ ...state, loanAmount: Number(e.target.value) })}
                    />
                </div>

                <div className="input-group">
                    <label>Program</label>
                    <select
                        value={state.program}
                        onChange={e => setState({ ...state, program: e.target.value as LoanProgram })}
                    >
                        <option value="504_standard">Standard 504</option>
                        <option value="504_refi_expansion">Refi w/ Expansion</option>
                        <option value="504_refi_no_expansion">Refi w/out Expansion</option>
                    </select>
                </div>

                <div className="row">
                    <div className="input-group half">
                        <label># Guarantors</label>
                        <input
                            type="number"
                            min="0"
                            value={state.guarantorCount}
                            onChange={e => setState({ ...state, guarantorCount: Number(e.target.value) })}
                        />
                    </div>
                    <div className="input-group half">
                        <label>EPC/OC Count</label>
                        <div className="text-display">1 EPC / 1 OC (Fixed)</div>
                    </div>
                </div>

                <div className="results-panel">
                    <div className="result-row">
                        <span>Legal/Closing Cost:</span>
                        <strong>${results.closingCost.toLocaleString()}</strong>
                    </div>
                    <div className="result-row">
                        <span>Interim Loan Fee (0.50%):</span>
                        <strong>${results.interimFee.toLocaleString()}</strong>
                    </div>
                    <div className="result-row total">
                        <span>Est. Upfront Fees:</span>
                        <strong>${results.totalUpfront.toLocaleString()}</strong>
                    </div>
                    <div className="result-row detail">
                        <span>Annual Service Fee ({(results.serviceFeeRate * 100).toFixed(4)}%):</span>
                        <span>${results.estimatedAnnualFee.toLocaleString()}/yr</span>
                    </div>
                </div>
            </div>

            <style>{`
                .fee-calculator {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    height: 100%;
                }
                .calc-header h3 { margin: 0 0 1rem 0; color: #1e293b; font-size: 1.1rem; }
                .input-group { margin-bottom: 1rem; }
                .input-group label { display: block; font-size: 0.85rem; color: #64748b; margin-bottom: 0.25rem; }
                .input-group input, .input-group select {
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 0.9rem;
                }
                .row { display: flex; gap: 0.5rem; }
                .half { flex: 1; }
                .text-display {
                    padding: 0.5rem;
                    background: #f1f5f9;
                    border-radius: 6px;
                    font-size: 0.85rem;
                    color: #475569;
                }
                .results-panel {
                    margin-top: 1.5rem;
                    background: #f8fafc;
                    padding: 1rem;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .result-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                    color: #334155;
                }
                .result-row.total {
                    margin-top: 0.75rem;
                    padding-top: 0.75rem;
                    border-top: 1px dashed #cbd5e1;
                    font-weight: 700;
                    color: #0f172a;
                    font-size: 1rem;
                }
                .result-row.detail {
                    margin-top: 0.5rem;
                    font-size: 0.8rem;
                    color: #64748b;
                }
            `}</style>
        </div>
    );
};
