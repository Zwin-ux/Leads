import React, { useState, useEffect, useMemo } from 'react';
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
    {
        id: 'q1',
        text: 'Is the business a for-profit entity?',
        type: 'yes_no',
        correctAnswer: 'yes',
        failureMessage: 'SBA loans are only for for-profit businesses.'
    },
    {
        id: 'q2',
        text: 'Does the business operate in the US?',
        type: 'yes_no',
        correctAnswer: 'yes',
        failureMessage: 'Business must be located in the US.'
    },
    {
        id: 'q3',
        text: 'Is the owner a US Citizen or Lawful Permanent Resident?',
        type: 'yes_no',
        correctAnswer: 'yes',
        failureMessage: 'Owner must be a US Citizen or LPR.'
    },
    {
        id: 'q4',
        text: 'Has the business or owner ever defaulted on a government loan?',
        type: 'yes_no',
        correctAnswer: 'no',
        failureMessage: 'Prior government loan defaults usually disqualify.'
    },
    {
        id: 'q5',
        text: 'Is the business involved in lending, gambling, or speculation?',
        type: 'yes_no',
        correctAnswer: 'no',
        failureMessage: 'Ineligible industry.'
    },
    {
        id: 'q6',
        text: 'Does the business meet SBA size standards?',
        type: 'yes_no',
        correctAnswer: 'yes',
        failureMessage: 'Must meet size standards (revenue or employees).'
    },
    {
        id: 'q7',
        text: 'Can the business demonstrate a need for credit (Credit Elsewhere Test)?',
        type: 'yes_no',
        correctAnswer: 'yes',
        failureMessage:
            'Must demonstrate inability to get credit elsewhere on reasonable terms.'
    },
    {
        id: 'q8',
        text: 'Is the SBA listed as an "Intended User" on the appraisal?',
        type: 'yes_no',
        correctAnswer: 'yes',
        failureMessage: 'FATAL: Appraisal must list SBA as Intended User.'
    }
];

type AnswerValue = 'yes' | 'no' | null;

type ScannerResult = 'eligible' | 'ineligible' | 'review' | null;

interface OccupancyState {
    total: number;
    occupied: number;
}

interface EvaluationResult {
    result: ScannerResult;
    failureReasons: string[];
    isComplete: boolean;
    answeredCount: number;
    occupancyRatio: number | null;
}

const totalQuestions = QUESTIONS.length;

const computeEvaluation = (
    currentAnswers: Record<string, AnswerValue>,
    currentOccupancy: OccupancyState
): EvaluationResult => {
    const reasons: string[] = [];
    let isIneligible = false;
    let isComplete = true;
    let answeredCount = 0;

    QUESTIONS.forEach(q => {
        const answer = currentAnswers[q.id];
        if (answer === null || answer === undefined) {
            isComplete = false;
        } else {
            answeredCount += 1;
            if (answer !== q.correctAnswer) {
                isIneligible = true;
                reasons.push(q.failureMessage);
            }
        }
    });

    const hasOccupancy = currentOccupancy.total > 0;
    const occupancyRatio = hasOccupancy
        ? currentOccupancy.occupied / currentOccupancy.total
        : null;

    if (hasOccupancy && occupancyRatio !== null) {
        if (occupancyRatio < 0.51) {
            isIneligible = true;
            reasons.push(
                `Occupancy Ineligible: ${(occupancyRatio * 100).toFixed(
                    1
                )}% (Must be at least 51 percent)`
            );
        }
    }

    let result: ScannerResult = null;

    if (isIneligible) {
        result = 'ineligible';
    } else if (isComplete && (!hasOccupancy || occupancyRatio !== null)) {
        result = 'eligible';
    } else if (!isComplete || (hasOccupancy && occupancyRatio === null)) {
        result = 'review';
    }

    return {
        result,
        failureReasons: reasons,
        isComplete,
        answeredCount,
        occupancyRatio
    };
};

export const SBAEligibilityScanner: React.FC<SBAEligibilityScannerProps> = ({
    lead,
    onUpdateNote
}) => {
    const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
    const [occupancy, setOccupancy] = useState<OccupancyState>({
        total: 0,
        occupied: 0
    });

    // could later hydrate answers from lead metadata here
    useEffect(() => {
        setAnswers({});
        setOccupancy({ total: 0, occupied: 0 });
    }, [lead?.id]);

    const evaluation = useMemo(
        () => computeEvaluation(answers, occupancy),
        [answers, occupancy]
    );

    const { result, failureReasons, answeredCount, occupancyRatio } = evaluation;

    const handleAnswer = (questionId: string, value: 'yes' | 'no') => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleOccupancyChange = (field: 'total' | 'occupied', value: number) => {
        if (Number.isNaN(value) || value < 0) {
            return;
        }
        setOccupancy(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        const timestamp = new Date().toISOString();
        const occPct =
            occupancy.total > 0
                ? ((occupancy.occupied / occupancy.total) * 100).toFixed(1)
                : 'N/A';

        const headerLine = `SBA Eligibility Check ${timestamp}`;
        const resultLine = `Result: ${result ? result.toUpperCase() : 'PENDING'}`;
        const companyLine = `Borrower: ${
            lead.company || (lead as any).businessName || 'Unknown'
        }`;
        const occLine = `Occupancy: ${occPct}%   Total: ${
            occupancy.total || 0
        } sf   Borrower: ${occupancy.occupied || 0} sf`;

        const questionsSummary = QUESTIONS.map(q => {
            const ans = answers[q.id];
            const ansText = ans ? ans.toUpperCase() : 'N/A';
            return `• ${q.text}: ${ansText}`;
        }).join('\n');

        const issuesBlock =
            failureReasons.length > 0
                ? `\nIssues:\n${failureReasons.map(r => `• ${r}`).join('\n')}`
                : '';

        const summary =
            `${headerLine}\n` +
            `${companyLine}\n` +
            `${resultLine}\n` +
            `${occLine}\n\n` +
            `Question Summary:\n${questionsSummary}` +
            issuesBlock;

        onUpdateNote(summary);
        alert('Eligibility check saved to notes.');
    };

    const progressPct = Math.round((answeredCount / totalQuestions) * 100);

    return (
        <div className="sba-scanner">
            <div className="scanner-header">
                <h3>SBA Eligibility Scanner</h3>
                <p>
                    Quick screen for 7(a) and 504 eligibility for{' '}
                    <strong>{lead.company || (lead as any).businessName}</strong>.
                </p>
                <p className="scanner-subtitle">
                    This is a guide for the BDO and credit team. Final decision is
                    always underwriting.
                </p>
            </div>

            <div className="scanner-status-bar">
                <div className="status-left">
                    <span className="status-label">Question progress</span>
                    <span className="status-value">
                        {answeredCount} of {totalQuestions} answered ({progressPct}
                        %)
                    </span>
                </div>
                <div className="status-right">
                    {result === 'eligible' && (
                        <span className="chip chip-pass">Likely eligible</span>
                    )}
                    {result === 'ineligible' && (
                        <span className="chip chip-fail">Screen indicates ineligible</span>
                    )}
                    {result === 'review' && (
                        <span className="chip chip-review">Needs more info</span>
                    )}
                    {!result && (
                        <span className="chip chip-neutral">Incomplete screen</span>
                    )}
                </div>
            </div>

            <div className="section-title">🏢 Occupancy check 51 percent rule</div>
            <div className="occupancy-inputs">
                <div className="input-group">
                    <label>Total building square feet</label>
                    <input
                        type="number"
                        value={occupancy.total || ''}
                        onChange={e =>
                            handleOccupancyChange('total', Number(e.target.value))
                        }
                        min={0}
                    />
                </div>
                <div className="input-group">
                    <label>Occupied by borrower square feet</label>
                    <input
                        type="number"
                        value={occupancy.occupied || ''}
                        onChange={e =>
                            handleOccupancyChange('occupied', Number(e.target.value))
                        }
                        min={0}
                    />
                </div>
                <div className="status-display">
                    {occupancyRatio !== null && occupancy.total > 0 && (
                        <span
                            className={
                                occupancyRatio >= 0.51 ? 'pass occupancy' : 'fail occupancy'
                            }
                        >
                            {(occupancyRatio * 100).toFixed(1)}%
                        </span>
                    )}
                    {occupancy.total === 0 && (
                        <span className="hint-text">
                            Leave blank if this is not a real estate deal.
                        </span>
                    )}
                </div>
            </div>

            <div className="section-title">❓ Qualification questions</div>
            <div className="questions-list">
                {QUESTIONS.map(q => (
                    <div key={q.id} className="question-item">
                        <span className="question-text">{q.text}</span>
                        <div className="question-options">
                            <button
                                type="button"
                                className={`btn-option ${
                                    answers[q.id] === 'yes' ? 'selected' : ''
                                }`}
                                onClick={() => handleAnswer(q.id, 'yes')}
                            >
                                Yes
                            </button>
                            <button
                                type="button"
                                className={`btn-option ${
                                    answers[q.id] === 'no' ? 'selected' : ''
                                }`}
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
                    <h4>
                        Result:{' '}
                        {result === 'eligible'
                            ? 'Likely eligible ✅'
                            : result === 'ineligible'
                            ? 'Ineligible ❌'
                            : 'Needs more information'}
                    </h4>

                    {failureReasons.length === 0 && result === 'eligible' && (
                        <p className="result-note">
                            No red flags in this quick screen. Confirm with full SBA
                            checklist.
                        </p>
                    )}

                    {failureReasons.length === 0 && result === 'review' && (
                        <p className="result-note">
                            Some answers missing or unclear. Finish questions or clarify
                            with credit or underwriting.
                        </p>
                    )}

                    {failureReasons.length > 0 && (
                        <ul className="failure-list">
                            {failureReasons.map((r, i) => (
                                <li key={i}>{r}</li>
                            ))}
                        </ul>
                    )}

                    <button className="btn-primary" onClick={handleSave}>
                        Save to notes
                    </button>
                </div>
            )}

            <style>{`
                .sba-scanner {
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                .scanner-header h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    color: #0f172a;
                }
                .scanner-header p {
                    margin: 0.25rem 0;
                    font-size: 0.9rem;
                    color: #475569;
                }
                .scanner-subtitle {
                    font-size: 0.75rem;
                    color: #64748b;
                }
                .scanner-status-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 0.75rem;
                    padding: 0.5rem 0.75rem;
                    background: #e2e8f0;
                    border-radius: 6px;
                }
                .status-left {
                    display: flex;
                    flex-direction: column;
                }
                .status-label {
                    font-size: 0.7rem;
                    color: #64748b;
                }
                .status-value {
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: #0f172a;
                }
                .status-right {
                    display: flex;
                    align-items: center;
                }
                .chip {
                    padding: 0.25rem 0.5rem;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .chip-pass {
                    background: #bbf7d0;
                    color: #166534;
                }
                .chip-fail {
                    background: #fecaca;
                    color: #991b1b;
                }
                .chip-review {
                    background: #fef9c3;
                    color: #854d0e;
                }
                .chip-neutral {
                    background: #e5e7eb;
                    color: #374151;
                }

                .section-title {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #475569;
                    margin: 1.25rem 0 0.75rem 0;
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
                    width: 140px;
                    font-size: 0.85rem;
                }
                .status-display {
                    min-width: 150px;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .status-display span.occupancy {
                    font-size: 1.1rem;
                    font-weight: 700;
                }
                .status-display .pass {
                    color: #16a34a;
                }
                .status-display .fail {
                    color: #dc2626;
                }
                .hint-text {
                    font-size: 0.75rem;
                    color: #9ca3af;
                }

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
                    transition: all 0.15s ease;
                }
                .btn-option.selected {
                    background: #3b82f6;
                    color: white;
                    border-color: #3b82f6;
                }
                .btn-option:hover {
                    background: #eff6ff;
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
                .result-box.review {
                    background: #fef9c3;
                    border: 1px solid #facc15;
                    color: #854d0e;
                }
                .result-box h4 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1rem;
                }
                .result-note {
                    font-size: 0.85rem;
                    margin-bottom: 0.5rem;
                }
                .failure-list {
                    font-size: 0.85rem;
                    margin: 0 0 0.75rem 1rem;
                }
                .btn-primary {
                    padding: 0.5rem 1.25rem;
                    background: #0f766e;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    cursor: pointer;
                }
                .btn-primary:hover {
                    background: #0d6a63;
                }

                @media (max-width: 768px) {
                    .occupancy-inputs {
                        flex-direction: column;
                        align-items: stretch;
                    }
                    .question-item {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .question-options {
                        margin-top: 0.5rem;
                    }
                    .scanner-status-bar {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.5rem;
                    }
                }
            `}</style>
        </div>
    );
};
