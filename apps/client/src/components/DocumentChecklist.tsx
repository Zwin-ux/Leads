import React from 'react';
import type { Lead, Document, DocumentType } from '@leads/shared';

// Document type labels - inline to avoid shared package runtime export issues
const DOC_TYPE_LABELS: Record<DocumentType, string> = {
    'tax_returns_personal_1': 'Personal Tax Returns (Year 1)',
    'tax_returns_personal_2': 'Personal Tax Returns (Year 2)',
    'tax_returns_personal_3': 'Personal Tax Returns (Year 3)',
    'tax_returns_business_1': 'Business Tax Returns (Year 1)',
    'tax_returns_business_2': 'Business Tax Returns (Year 2)',
    'tax_returns_business_3': 'Business Tax Returns (Year 3)',
    'bank_statements': 'Bank Statements (6 months)',
    'financials_ytd': 'YTD Financial Statements',
    'financials_interim': 'Interim Financials',
    'purchase_agreement': 'Purchase Agreement',
    'lease_agreement': 'Lease Agreement',
    'articles_of_org': 'Articles of Organization',
    'operating_agreement': 'Operating Agreement',
    'business_license': 'Business License',
    'insurance_quote': 'Insurance Quote',
    'appraisal': 'Appraisal',
    'environmental_phase1': 'Environmental Phase I',
    'environmental_phase2': 'Environmental Phase II',
    'title_commitment': 'Title Commitment',
    'survey': 'Survey',
    'sba_form_1919': 'SBA Form 1919',
    'sba_form_1920': 'SBA Form 1920',
    'personal_financial_statement': 'Personal Financial Statement',
    'debt_schedule': 'Debt Schedule',
    'accounts_receivable': 'A/R Aging',
    'accounts_payable': 'A/P Aging',
    'equipment_list': 'Equipment List',
    'other': 'Other'
};

// 504 Loan document checklist
const DOC_CHECKLIST_504: DocumentType[] = [
    'tax_returns_personal_1',
    'tax_returns_personal_2',
    'tax_returns_personal_3',
    'tax_returns_business_1',
    'tax_returns_business_2',
    'tax_returns_business_3',
    'bank_statements',
    'financials_ytd',
    'purchase_agreement',
    'articles_of_org',
    'appraisal',
    'environmental_phase1',
    'title_commitment',
    'sba_form_1919',
    'personal_financial_statement',
    'insurance_quote'
];

// 7a Loan document checklist
const DOC_CHECKLIST_7A: DocumentType[] = [
    'tax_returns_personal_1',
    'tax_returns_personal_2',
    'tax_returns_business_1',
    'tax_returns_business_2',
    'bank_statements',
    'financials_ytd',
    'articles_of_org',
    'sba_form_1919',
    'personal_financial_statement',
    'debt_schedule'
];

interface DocumentChecklistProps {
    lead: Lead;
    onUpdateDocument: (docId: string, updates: Partial<Document>) => void;
    onRequestDocs: (docTypes: DocumentType[]) => void;
    onApplyTemplate?: (template: DocumentType[]) => void;
}

const SENDNOW_URL = 'https://sendnow.gatewayportal.com/ampac/Send_Now_Documents/r1';

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
    lead,
    onUpdateDocument,
    onRequestDocs,
    onApplyTemplate
}) => {
    // Get checklist based on loan program
    const checklistTemplate = lead.loanProgram === '7a' ? DOC_CHECKLIST_7A : DOC_CHECKLIST_504;

    // Build document list from template, merging with existing docs
    const documents: Document[] = checklistTemplate.map(type => {
        const existing = lead.documents?.find(d => d.type === type);
        if (existing) return existing;
        return {
            id: `doc-${type}`,
            type,
            label: DOC_TYPE_LABELS[type],
            status: 'needed' as const
        };
    });

    // Calculate stats
    const received = documents.filter(d => d.status === 'received').length;
    const requested = documents.filter(d => d.status === 'requested').length;
    const needed = documents.filter(d => d.status === 'needed').length;
    const total = documents.length;
    const completionPercent = Math.round((received / total) * 100);

    // Get missing docs for request
    const missingDocs = documents.filter(d => d.status === 'needed' || d.status === 'requested');

    const getStatusIcon = (status: Document['status']) => {
        switch (status) {
            case 'received': return '✓';
            case 'requested': return '○';
            case 'ordered': return '◐';
            case 'waived': return '—';
            case 'na': return '—';
            default: return '○';
        }
    };

    const getStatusColor = (status: Document['status']) => {
        switch (status) {
            case 'received': return '#22c55e';
            case 'requested': return '#f59e0b';
            case 'ordered': return '#3b82f6';
            case 'waived': return '#94a3b8';
            case 'na': return '#94a3b8';
            default: return '#ef4444';
        }
    };

    const handleStatusChange = (doc: Document, newStatus: Document['status']) => {
        const updates: Partial<Document> = { status: newStatus };
        if (newStatus === 'received') {
            updates.receivedDate = new Date().toISOString().split('T')[0];
        } else if (newStatus === 'requested') {
            updates.requestedDate = new Date().toISOString().split('T')[0];
        }
        onUpdateDocument(doc.id, updates);
    };

    const handleRequestAll = () => {
        const missingTypes = missingDocs.map(d => d.type);
        onRequestDocs(missingTypes);
    };

    return (
        <div className="document-checklist">
            {/* Header with stats */}
            <div className="doc-header">
                <div className="doc-stats">
                    <span className="stat-bar">
                        <span
                            className="stat-fill"
                            style={{ width: `${completionPercent}%`, background: '#22c55e' }}
                        />
                    </span>
                    <span className="stat-text">
                        {received}/{total} Complete
                        {requested > 0 && <span className="pending"> • {requested} Pending</span>}
                        {needed > 0 && <span className="missing"> • {needed} Missing</span>}
                    </span>
                </div>
                <button
                    className="btn-secondary request-btn"
                    onClick={handleRequestAll}
                    disabled={missingDocs.length === 0}
                >
                    Request Docs
                </button>
                {onApplyTemplate && (
                    <button
                        className="btn-secondary"
                        onClick={() => onApplyTemplate(checklistTemplate)}
                        style={{ marginLeft: '0.5rem' }}
                    >
                        Apply {lead.loanProgram || '504'} Template
                    </button>
                )}
            </div>

            {/* Document list */}
            <div className="doc-list">
                {documents.map(doc => (
                    <div
                        key={doc.id}
                        className={`doc-item status-${doc.status}`}
                    >
                        <span
                            className="doc-status-icon"
                            style={{ color: getStatusColor(doc.status) }}
                        >
                            {getStatusIcon(doc.status)}
                        </span>
                        <div className="doc-info">
                            <span className="doc-name">{doc.label}</span>
                            {doc.receivedDate && (
                                <span className="doc-date">Received {doc.receivedDate}</span>
                            )}
                            {doc.requestedDate && doc.status === 'requested' && (
                                <span className="doc-date">Requested {doc.requestedDate}</span>
                            )}
                        </div>
                        <select
                            className="doc-status-select"
                            value={doc.status}
                            onChange={(e) => handleStatusChange(doc, e.target.value as Document['status'])}
                        >
                            <option value="needed">Needed</option>
                            <option value="requested">Requested</option>
                            <option value="received">Received</option>
                            <option value="ordered">Ordered</option>
                            <option value="waived">Waived</option>
                            <option value="na">N/A</option>
                        </select>
                    </div>
                ))}
            </div>

            {/* SendNow link */}
            <div className="sendnow-link">
                <a href={SENDNOW_URL} target="_blank" rel="noopener noreferrer">
                    Secure Upload Portal (SendNow)
                </a>
            </div>

            <style>{`
                .document-checklist {
                    padding: 0.5rem 0;
                }
                .doc-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid #e2e8f0;
                }
                .doc-stats {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .stat-bar {
                    width: 200px;
                    height: 6px;
                    background: #e2e8f0;
                    border-radius: 3px;
                    overflow: hidden;
                }
                .stat-fill {
                    height: 100%;
                    transition: width 0.3s ease;
                }
                .stat-text {
                    font-size: 0.8rem;
                    color: #64748b;
                }
                .stat-text .pending { color: #f59e0b; }
                .stat-text .missing { color: #ef4444; }
                .request-btn {
                    padding: 0.5rem 1rem;
                    font-size: 0.85rem;
                }
                .doc-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    max-height: 350px;
                    overflow-y: auto;
                }
                .doc-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem 0.75rem;
                    background: #f8fafc;
                    border-radius: 6px;
                    border-left: 3px solid #e2e8f0;
                }
                .doc-item.status-received {
                    border-left-color: #22c55e;
                    background: #f0fdf4;
                }
                .doc-item.status-requested {
                    border-left-color: #f59e0b;
                    background: #fffbeb;
                }
                .doc-item.status-needed {
                    border-left-color: #ef4444;
                }
                .doc-status-icon {
                    font-size: 1rem;
                    font-weight: 600;
                    width: 20px;
                    text-align: center;
                }
                .doc-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .doc-name {
                    font-size: 0.875rem;
                    color: #1e293b;
                }
                .doc-date {
                    font-size: 0.75rem;
                    color: #64748b;
                }
                .doc-status-select {
                    padding: 0.25rem 0.5rem;
                    font-size: 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    background: white;
                    cursor: pointer;
                }
                .sendnow-link {
                    margin-top: 1rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid #e2e8f0;
                    text-align: center;
                }
                .sendnow-link a {
                    color: #3b82f6;
                    text-decoration: none;
                    font-size: 0.85rem;
                }
                .sendnow-link a:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
};
