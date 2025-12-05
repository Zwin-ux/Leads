import React, { useState, useEffect } from 'react';
import type { Lead } from '@leads/shared';

interface SBAEligibilityScannerProps {
    lead: Lead;
    onUpdateNote: (note: string) => void;
}

interface Question {
    id: string;
    text: string;
    type: 'yes_no';
    correctAnswer: 'yes' | 'no';
    failureMessage: string;
}

const QUESTIONS: Question[] = [
    { id: 'q1', text: 'Is the business a for-profit entity?', type: 'yes_no', correctAnswer: 'yes', failureMessage: 'SBA loans are only for for-profit businesses.' },
    { id: 'q2', text: 'Does the business operate in the US?', type: 'yes_no', correctAnswer: 'yes', failureMessage: 'Business must be located in the US.' },
    { id: 'q3', text: 'Is the owner a US Citizen or Lawful Permanent Resident?', type: 'yes_no', correctAnswer: 'yes', failureMessage: 'Owner must be a US Citizen or LPR.' },
    { id: 'q4', text: 'Has the business or owner ever defaulted on a government loan?', type: 'yes_no', correctAnswer: 'no', failureMessage: 'Prior government loan defaults usually disqualify.' },
    { id: 'q5', text: 'Is the business involved in lending, gambling, or speculation?', type: 'yes_no', correctAnswer: 'no', failureMessage: 'Ineligible industry.' },
    { id: 'q6', text: 'Does the business meet SBA size standards?', type: 'yes_no', correctAnswer: 'yes', failureMessage: 'Must meet size standards (revenue/employees).' },
    { id: 'q7', text: 'Can the business demonstrate a need for credit (Credit Elsewhere Test)?', type: 'yes_no', correctAnswer: 'yes', failureMessage: 'Must demonstrate inability to get credit elsewhere on reasonable terms.' },
    { id: 'q8', text: 'Is the SBA listed as an "Intended User" on the appraisal?', type: 'yes_no', correctAnswer: 'yes', failureMessage: 'FATAL: Appraisal must list SBA as Intended User.' }
];

export const SBAEligibilityScanner: React.FC<SBAEligibilityScannerProps> = ({ lead, onUpdateNote }) => {
    const [answers, setAnswers] = useState<Record<string, 'yes' | 'no' | null>>({});
    const [occupancy, setOccupancy] = useState({ total: 0, occupied: 0 });
    const [result, setResult] = useState<'eligible' | 'ineligible' | 'review' | null>(null);
    const [failureReasons, setFailureReasons] = useState<string[]>([]);

    useEffect(() => {
        // In reality, we could pull existing data from Lead object if available
    }, []);

    const handleAnswer = (questionId: string, value: 'yes' | 'no') => {
        const newAnswers = { ...answers, [questionId]: value };
        setAnswers(newAnswers);
        evaluate(newAnswers, occupancy);
    };

    const handleOccupancyChange = (field: 'total' | 'occupied', value: number) => {
        const newOccupancy = { ...occupancy, [field]: value };
        setOccupancy(newOccupancy);
        evaluate(answers, newOccupancy);
    };

    const evaluate = (
        currentAnswers: Record<string, 'yes' | 'no' | null>,
        currentOccupancy: { total: number; occupied: number }
    ) => {
        const reasons: string[] = [];
        let isIneligible = false;
        let isComplete = true;

        // 1. Check Standard Questions
        QUESTIONS.forEach(q => {
            const answer = currentAnswers[q.id];
            if (answer === null || answer === undefined) {
                isComplete = false;
            } else if (answer !== q.correctAnswer) {
                isIneligible = true;
                reasons.push(q.failureMessage);
            }
        });

        // 2. Check Occupancy Logic
        if (currentOccupancy.total > 0) {
            const ratio = currentOccupancy.occupied / currentOccupancy.total;
            if (ratio < 0.51) {
                isIneligible = true;
                reasons.push(`Occupancy Ineligible: ${(ratio * 100).toFixed(1)}% (Must be ≥ 51%)`);
            }
        } else {
            // If occupancy is 0, we assume it's not entered yet, so not complete? 
            // Or maybe it's not a RE deal? Let's check loan purpose if possible, but for now allow 0 to skip if implied.
        }

        setFailureReasons(reasons);

        if (isIneligible) {
            setResult('ineligible');
        } else if (isComplete && (currentOccupancy.total === 0 || currentOccupancy.occupied > 0)) {
            // Only mark eligible if questions are done
            setResult('eligible');
        } else {
            setResult(null);
        }
    };

    const handleSave = () => {
        const timestamp = new Date().toISOString();
        const occPct = occupancy.total > 0 ? ((occupancy.occupied / occupancy.total) * 100).toFixed(1) : 'N/A';
        const summary = `SBA Eligibility Check (${timestamp}):\n` +
            `Result: ${result?.toUpperCase()}\n` +
            `Occupancy: ${occPct}%\n\n` +
            QUESTIONS.map(q => `- ${q.text}: ${answers[q.id]?.toUpperCase()}`).join('\n') +
            (failureReasons.length > 0 ? `\n\nIssues:\n${failureReasons.join('\n')}` : '');

        onUpdateNote(summary);
        alert('Eligibility check saved to notes!');
    };

    return (
        <div className="sba-scanner">
            <div className="scanner-header">
                <h3>SBA Eligibility Scanner</h3>
                <p>Quick check for 7(a) and 504 eligibility for <strong>{lead.company || lead.businessName}</strong>.</p>
            </div>

            {/* Occupancy Section */}
            <div className="section-title">🏢 Occupancy Check (51% Rule)</div>
            <div className="occupancy-inputs">
                <div className="input-group">
                    <label>Total Building SqFt</label>
                    <input
                        type="number"
                        value={occupancy.total || ''}
                        onChange={(e) => handleOccupancyChange('total', Number(e.target.value))}
                        min="0"
                    />
                </div>
                <div className="input-group">
                    <label>Occupied by Borrower SqFt</label>
                    <input
                        type="number"
                        value={occupancy.occupied || ''}
                        onChange={(e) => handleOccupancyChange('occupied', Number(e.target.value))}
                        min="0"
                    />
                </div>
                <div className="status-display">
                    {occupancy.total > 0 && (
                        <span className={(occupancy.occupied / occupancy.total) >= 0.51 ? 'pass' : 'fail'}>
                            {((occupancy.occupied / occupancy.total) * 100).toFixed(1)}%
                        </span>
                    )}
                </div>
            </div>

            <div className="section-title">❓ Qualification Questions</div>
            <div className="questions-list">
                {QUESTIONS.map(q => (
                    <div key={q.id} className="question-item">
                        <span className="question-text">{q.text}</span>
                        <div className="question-options">
                            <button
                                className={`btn-option ${answers[q.id] === 'yes' ? 'selected' : ''}`}
                                onClick={() => handleAnswer(q.id, 'yes')}
                            >
                                Yes
                            </button>
                            <button
                                className={`btn-option ${answers[q.id] === 'no' ? 'selected' : ''}`}
                                onClick={() => handleAnswer(q.id, 'no')}
                            >
                                No
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {result && (
                <div className={`result-box ${result}`}>
                    <h4>Result: {result === 'eligible' ? 'Likely Eligible ✅' : 'Ineligible ❌'}</h4>
                    {failureReasons.length > 0 && (
                        <ul>
                            {failureReasons.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    )}
                    <button className="btn-primary" onClick={handleSave}>Save to Notes</button>
                </div>
            )}

            <style>{`
                .sba-scanner {
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 8px;
                }
                .section-title {
                    font-size: 0.95rem;
                    font-weight: 600;
                    color: #475569;
                    margin: 1.5rem 0 0.75rem 0;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .occupancy-inputs {
                    display: flex;
                    gap: 1rem;
                    align-items: flex-end;
                    background: white;
                    padding: 1rem;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                }
                .input-group label {
                    display: block;
                    font-size: 0.8rem;
                    color: #64748b;
                    margin-bottom: 0.25rem;
                }
                .input-group input {
                    padding: 0.5rem;
                    border: 1px solid #cbd5e1;
                    border-radius: 4px;
                    width: 120px;
                }
                .status-display span {
                    font-size: 1.25rem;
                    font-weight: 700;
                }
                .status-display .pass { color: #16a34a; }
                .status-display .fail { color: #dc2626; }
                
                .questions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .question-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                }
                .question-text {
                    font-size: 0.9rem;
                    color: #334155;
                    flex: 1;
                    margin-right: 1rem;
                }
                .question-options {
                    display: flex;
                    gap: 0.5rem;
                }
                .btn-option {
                    padding: 0.4rem 1rem;
                    border: 1px solid #cbd5e1;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    transition: all 0.2s;
                }
                .btn-option.selected {
                    background: #3b82f6;
                    color: white;
                    border-color: #3b82f6;
                }
                .result-box {
                    padding: 1rem;
                    border-radius: 8px;
                    margin-top: 1.5rem;
                }
                .result-box.eligible {
                    background: #dcfce7;
                    border: 1px solid #86efac;
                    color: #166534;
                }
                .result-box.ineligible {
                    background: #fee2e2;
                    border: 1px solid #fca5a5;
                    color: #991b1b;
                }
            `}</style>
        </div>
    );
};
