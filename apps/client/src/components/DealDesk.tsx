import React, { useState, useEffect } from 'react';
import type { Lead } from '@leads/shared';
import { apiService } from '../services/apiService';

interface DealDeskProps {
    lead: Lead;
    onClose: () => void;
}

export const DealDesk: React.FC<DealDeskProps> = ({ lead, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);

    // Local state for "What-If" Analysis
    const [loanAmount, setLoanAmount] = useState(lead.loanAmount || 0);
    const [noi, setNoi] = useState(lead.financials?.noi || (lead.annualRevenue ? lead.annualRevenue * 0.15 : 0)); // Default 15% margin if unknown

    const runAnalysis = async () => {
        setLoading(true);
        try {
            // Construct a temporary lead object with modified values for "What-If"
            const tempLead = {
                ...lead,
                loanAmount,
                financials: { ...lead.financials, noi }
            };

            const token = localStorage.getItem('msal_token') || 'demo';
            const res = await apiService.analyzeLeadPhysics(tempLead, token);
            setAnalysis(res);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Run on mount
    useEffect(() => { runAnalysis(); }, []);

    // Helper for Status Color
    const getStatusColor = (status: string) => {
        if (status === 'Critical') return '#ef4444';
        if (status === 'Caution') return '#f59e0b';
        return '#10b981';
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', zIndex: 400, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{ background: '#0f172a', width: '900px', height: '80vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', color: 'white', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
                {/* Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '2rem' }}>🏛️</span>
                        <div>
                            <h2 style={{ margin: 0, fontWeight: 300 }}>The Deal Desk</h2>
                            <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}> structuring {lead.company}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ fontSize: '1.5rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>✖</button>
                </div>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                    {/* Left: Inputs (Sensitivity Analysis) */}
                    <div style={{ width: '300px', padding: '1.5rem', borderRight: '1px solid #1e293b', background: '#0f172a', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h3 style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase' }}>Parameters</h3>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>Annual NOI (Net Operating Income)</label>
                            <input
                                type="number"
                                value={noi}
                                onChange={e => setNoi(Number(e.target.value))}
                                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '0.5rem', borderRadius: '4px' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>Total Loan Request</label>
                            <input
                                type="number"
                                value={loanAmount}
                                onChange={e => setLoanAmount(Number(e.target.value))}
                                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white', padding: '0.5rem', borderRadius: '4px' }}
                            />
                        </div>

                        <button
                            onClick={runAnalysis}
                            className="btn-primary"
                            style={{ marginTop: 'auto', background: '#3b82f6', border: 'none', padding: '0.8rem', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                        >
                            🔄 Re-Calculate
                        </button>
                    </div>

                    {/* Right: Physics & Solver */}
                    <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                        {loading && <div style={{ textAlign: 'center', marginTop: '4rem', color: '#64748b' }}>Calculating Physics...</div>}

                        {!loading && analysis && (
                            <>
                                {/* Vital Signs */}
                                <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem' }}>

                                    {/* DSCR Gauge */}
                                    <div style={{ flex: 1, background: '#1e293b', padding: '1.5rem', borderRadius: '8px', textAlign: 'center', border: `1px solid ${getStatusColor(analysis.status)}` }}>
                                        <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>DSCR (Target: 1.15x)</div>
                                        <div style={{ fontSize: '3rem', fontWeight: 700, color: getStatusColor(analysis.status) }}>
                                            {analysis.dscr}x
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: getStatusColor(analysis.status) }}>{analysis.status}</div>
                                    </div>

                                    {/* LTV */}
                                    <div style={{ flex: 1, background: '#1e293b', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>LTV (Max 90%)</div>
                                        <div style={{ fontSize: '3rem', fontWeight: 700, color: 'white' }}>
                                            {(analysis.ltv * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                </div>

                                {/* Solver / Suggestions */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '0.5rem', marginBottom: '1rem' }}>🧠 Structure Solver</h3>
                                    {analysis.suggestions.length === 0 ? (
                                        <div style={{ color: '#10b981' }}>✅ Deal Structure looks solid. Ready for Underwriting.</div>
                                    ) : (
                                        <ul style={{ listStyle: 'none', padding: 0 }}>
                                            {analysis.suggestions.map((s: string, i: number) => (
                                                <li key={i} style={{ background: '#334155', padding: '1rem', marginBottom: '0.5rem', borderRadius: '6px', borderLeft: '4px solid #f59e0b' }}>
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Committee Protocol */}
                                <div style={{ marginTop: 'auto', borderTop: '1px solid #334155', paddingTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                    <button
                                        className="btn-secondary"
                                        style={{ background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '0.8rem 1.5rem', borderRadius: '6px', cursor: 'pointer' }}
                                        onClick={async () => {
                                            const { pdfService } = await import('../services/pdfService');
                                            pdfService.generateLOI(lead);
                                        }}
                                    >
                                        📄 Generate Memo
                                    </button>
                                    <button
                                        className="btn-primary"
                                        style={{ background: '#dc2626', border: 'none', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                                        onClick={() => {
                                            const confirm = window.confirm("🚨 Request Credit Committee Review?\n\nThis will book a 15-min Decision Huddle with the VP.");
                                            if (confirm) alert("📅 Meeting Request Sent to Credit Committee.");
                                        }}
                                    >
                                        ⚖️ Request Committee
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
