import React, { useState, useEffect } from 'react';
import type { Lead } from '@leads/shared';
import axios from 'axios';
import { FinancialsGrid } from './FinancialsGrid';
import { StipsTracker } from './StipsTracker';
import { LocationCheck } from './LocationCheck';
import { CaEntityCheck } from './CaEntityCheck';
import { DealEnrichmentCard } from '../DealEnrichmentCard';
import { SBAEligibilityScanner } from '../SBAEligibilityScanner';
import { underwritingService, type UnderwritingAnalysis } from '../../services/underwritingService';

import { RiskScorecard } from './RiskScorecard';

// Types for AI Result (Mirrors Backend)
interface ScoreReasoning {
    score: 1 | 2 | 3 | 4 | 5;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
}
export interface RiskScorecardAI {
    character: ScoreReasoning;
    cashFlow: ScoreReasoning;
    collateral: ScoreReasoning;
    ratios: {
        dscr: number;
        ltv: number;
    };
}

interface DealWorkspaceProps {
    lead: Lead;
    onClose: () => void;
}

export const DealWorkspace: React.FC<DealWorkspaceProps> = ({ lead, onClose }) => {
    const [analysis, setAnalysis] = useState<UnderwritingAnalysis | null>(null);
    const [activeTab, setActiveTab] = useState<'financials' | 'stips' | 'sba' | 'memo' | 'diligence'>('financials');
    const [showScorecard, setShowScorecard] = useState(false);

    const [aiResult, setAiResult] = useState<RiskScorecardAI | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        setAnalysis(underwritingService.getAnalysis(lead.id));
    }, [lead.id]);

    const handleFinancialChange = (field: any, val: number) => {
        if (!analysis) return;
        const updated = underwritingService.updateFinancials(lead.id, { [field]: val });
        setAnalysis({ ...updated });
    };

    const handleAutoCalc = async () => {
        if (!analysis) return;
        setIsAnalyzing(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

            // Map analysis.financials to backend input
            const payload = {
                netIncome: analysis.financials.netIncome || 0,
                depreciation: analysis.financials.depreciation || 0,
                interestExpense: analysis.financials.interest || 0,
                taxes: analysis.financials.taxes || 0,
                amortization: analysis.financials.amortization || 0,
                annualDebtService: analysis.financials.annualDebtService || 0,
                loanAmount: lead.loanAmount || 0,
                collateralValue: analysis.financials.collateralValue || 0 // Assuming this exists or using 0
            };

            console.log("Creating AI Analysis with payload:", payload);

            const res = await axios.post(`${API_URL}/api/underwriting/financials`, payload);
            const aiData = res.data as RiskScorecardAI;

            setAiResult(aiData);

            // Auto-update local ratios if they differ
            if (aiData.ratios.dscr) {
                const updated = underwritingService.updateFinancials(lead.id, { dscr: aiData.ratios.dscr });
                setAnalysis({ ...updated });
            }

            alert(`Analysis Complete!\nDSCR: ${aiData.ratios.dscr}x\nReason: ${aiData.cashFlow.reasoning}`);

        } catch (err: any) {
            console.error("Auto-Calc Failed:", err);
            alert("Failed to calculate ratios. Check API connection.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleStipUpdate = (id: string, status: any) => {
        if (!analysis) return;
        const updated = underwritingService.updateStip(lead.id, id, status);
        setAnalysis({ ...updated });
    };

    const handleMemoChange = (text: string) => {
        if (!analysis) return;
        const updated = underwritingService.updateMemo(lead.id, text);
        setAnalysis({ ...updated });
    };

    const handleRiskUpdate = (rating: number, strengths: string[], weaknesses: string[]) => {
        if (!analysis) return;
        const updated = underwritingService.updateRiskRating(lead.id, rating, strengths, weaknesses);
        setAnalysis({ ...updated });
    };

    if (!analysis) return <div>Loading Workspace...</div>;

    // Generate Default Memo if empty
    const memoContent = analysis.memoDraft ||
        `CREDIT MEMORANDUM
Date: ${new Date().toLocaleDateString()}
Borrower: ${lead.company}
Loan Amount: $${lead.loanAmount?.toLocaleString()}

Recommendation: [APPROVE / DECLINE]

1. Transaction Overview
   Request for financing of...

2. Financial Analysis
   DSCR: ${analysis.financials.dscr}x based on $${analysis.financials.noi.toLocaleString()} NOI.
   Revenue: ${analysis.financials.revenue.toLocaleString()}

3. Risks & Mitigants
   - Risk: High leverage.
   - Mitigant: Strong guarantor support.
`;

    return (
        <div className="deal-workspace" style={{ background: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header style={{
                padding: '1rem 2rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#0f766e',
                color: 'white'
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{lead.company}</h2>
                    <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Loan Request: ${lead.loanAmount?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => setShowScorecard(true)}>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>RISK RATING ✎</div>
                        <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>{analysis.riskRating}/10</div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                        Close Workspace
                    </button>
                </div>
            </header>

            <div className="workspace-body" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <div className="workspace-nav" style={{ width: '320px', borderRight: '1px solid #e2e8f0', background: '#f8fafc', padding: '1rem', overflowY: 'auto' }}>
                    <DealEnrichmentCard leadId={lead.id} />

                    <button
                        className={`nav-item ${activeTab === 'financials' ? 'active' : ''}`}
                        onClick={() => setActiveTab('financials')}
                    >
                        💰 Financial Analysis
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'stips' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stips')}
                    >
                        📋 Stipulations
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'sba' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sba')}
                    >
                        🏛️ SBA Eligibility
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'diligence' ? 'active' : ''}`}
                        onClick={() => setActiveTab('diligence')}
                    >
                        🔍 Due Diligence (CA SOS)
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'memo' ? 'active' : ''}`}
                        onClick={() => setActiveTab('memo')}
                    >
                        📝 Credit Memo
                    </button>

                    <LocationCheck
                        address={lead.propertyAddress || `${lead.city}, ${lead.stateOfInc}`}
                        onVerified={() => { }}
                    />
                </div>

                <div className="workspace-content" style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                    {activeTab === 'financials' && (
                        <div>
                            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                    className="btn-primary"
                                    onClick={handleAutoCalc}
                                    disabled={isAnalyzing}
                                    style={{ background: isAnalyzing ? '#94a3b8' : '#2563eb' }}
                                >
                                    {isAnalyzing ? 'Analyzing...' : '✨ Auto-Calc Ratios'}
                                </button>
                            </div>
                            <FinancialsGrid financials={analysis.financials} onChange={handleFinancialChange} />
                        </div>
                    )}

                    {activeTab === 'stips' && (
                        <StipsTracker stips={analysis.stips} onUpdate={handleStipUpdate} />
                    )}

                    {activeTab === 'sba' && (
                        <SBAEligibilityScanner lead={lead} onUpdateNote={() => { }} />
                    )}

                    {activeTab === 'diligence' && (
                        <CaEntityCheck lead={lead} />
                    )}

                    {activeTab === 'memo' && (
                        <div className="memo-editor">
                            <h4>Credit Memorandum Draft</h4>
                            <textarea
                                value={activeTab === 'memo' && !analysis.memoDraft ? memoContent : analysis.memoDraft || memoContent}
                                onChange={(e) => handleMemoChange(e.target.value)}
                                style={{
                                    width: '100%',
                                    height: '500px',
                                    padding: '1.5rem',
                                    fontFamily: 'monospace',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    lineHeight: '1.6',
                                    fontSize: '0.95rem'
                                }}
                            />
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button className="btn-primary" onClick={() => {
                                    const printWindow = window.open('', '', 'height=600,width=800');
                                    if (printWindow) {
                                        printWindow.document.write('<html><head><title>Credit Memo</title>');
                                        printWindow.document.write('<style>body { font-family: sans-serif; padding: 2rem; white-space: pre-wrap; line-height: 1.5; color: #333; } h1 { color: #0f766e; border-bottom: 2px solid #ccc; padding-bottom: 1rem; }</style>');
                                        printWindow.document.write('</head><body>');
                                        printWindow.document.write('<h1>Credit Memorandum</h1>');
                                        const finalContent = analysis.memoDraft || memoContent;
                                        // Simple preserve whitespace
                                        printWindow.document.write(finalContent);
                                        printWindow.document.write('</body></html>');
                                        printWindow.document.close();
                                        // Wait a moment for styles to load
                                        setTimeout(() => {
                                            printWindow.print();
                                        }, 500);
                                    }
                                }}>
                                    🖨️ Generate PDF Package
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showScorecard && (
                <RiskScorecard
                    analysis={analysis}
                    aiResult={aiResult}
                    onUpdate={handleRiskUpdate}
                    onClose={() => setShowScorecard(false)}
                />
            )}

            <style>{`
                .nav-item {
                    display: block;
                    width: 100%;
                    text-align: left;
                    padding: 0.75rem 1rem;
                    margin-bottom: 0.5rem;
                    border: none;
                    background: none;
                    border-radius: 6px;
                    color: #64748b;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .nav-item:hover {
                    background: #e2e8f0;
                    color: #1e293b;
                }
                .nav-item.active {
                    background: #e2e8f0;
                    color: #0f766e;
                    font-weight: 700;
                }
                .nav-item.active::before {
                    content: '►';
                    margin-right: 0.5rem;
                    font-size: 0.8rem;
                }
            `}</style>
        </div>
    );
};
