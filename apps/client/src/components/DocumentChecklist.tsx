import React from 'react';
import type { Lead, Document, DocumentType } from '@leads/shared';
import { EmailAction } from './EmailAction';

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
    'other': 'Other',
    'sba_form_1244': 'SBA Form 1244 (Application)',
    'credit_report': 'Credit Report'
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

    // SBA Expiration Rules Logic
    const EXPIRATION_RULES: Record<string, number> = {
        'appraisal': 365,
        'environmental_phase1': 365,
        'financials_interim': 120,
        'debt_schedule': 120,
        'personal_financial_statement': 120,
        'sba_form_1244': 90,
        'credit_report': 90,
        'default': 0 // No expiration
    };

    const checkExpiration = (type: DocumentType, dateStr?: string) => {
        if (!dateStr) return null;

        // Default rule
        let daysValid = EXPIRATION_RULES[type] || EXPIRATION_RULES['default'];

        // Group matches
        if (type.includes('financials') || type.includes('debt') || type.includes('personal')) daysValid = 120;
        if (type === 'appraisal' || type === 'environmental_phase1' || type === 'environmental_phase2') daysValid = 365;

        if (daysValid === 0) return null;

        const docDate = new Date(dateStr);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - docDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const ageInDays = diffDays;

        if (ageInDays > daysValid) {
            return { status: 'expired', message: `Expired (${ageInDays} days old)` };
        } else if (ageInDays > daysValid - 30) {
            return { status: 'warning', message: `Expires in ${daysValid - ageInDays} days` };
        }
        return null;
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <EmailAction
                        to={lead.email}
                        subject={`Missing Documents for ${lead.company || lead.businessName} - SBA Application`}
                        body={`Hi ${lead.firstName},\n\nWe are moving forward with your ${lead.loanProgram || 'SBA'} application. Please upload the following documents to the secure portal at your earliest convenience:\n\n${missingDocs.map(d => `- ${d.label}`).join('\n')}\n\nSecure Upload Link:\n${SENDNOW_URL}\n\nThank you,\nAmPac Business Capital`}
                        label={`Request ${missingDocs.length} Missing`}
                        variant="secondary"
                        icon="✉️"
                    />
                    {onApplyTemplate && (
                        <button
                            className="btn-secondary request-btn"
                            onClick={() => onApplyTemplate(checklistTemplate)}
                        >
                            Apply {lead.loanProgram || '504'} Template
                        </button>
                    )}
                </div>
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
                            <div className="doc-meta">
                                {doc.receivedDate && (
                                    <span className="doc-date">Received {doc.receivedDate}</span>
                                )}
                                {doc.requestedDate && doc.status === 'requested' && (
                                    <span className="doc-date">Requested {doc.requestedDate}</span>
                                )}
                                {doc.status === 'received' && (
                                    <div className="doc-validity">
                                        <label>Doc Date:</label>
                                        <input
                                            type="date"
                                            className="date-input"
                                            value={doc.documentDate || ''}
                                            onChange={(e) => onUpdateDocument(doc.id, { documentDate: e.target.value })}
                                        />
                                        {(() => {
                                            const status = checkExpiration(doc.type, doc.documentDate);
                                            if (!status) return null;
                                            return (
                                                <span className={`validity-badge ${status.status}`}>
                                                    {status.status === 'expired' ? '❌' : '⚠️'} {status.message}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
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
                    background: white;
                    border: 1px solid #cbd5e1;
                    border-radius: 6px;
                    cursor: pointer;
                    color: #475569;
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
                .doc-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .doc-date {
                    font-size: 0.75rem;
                    color: #64748b;
                }
                .doc-validity {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 0.25rem;
                }
                .date-input {
                    font-size: 0.75rem;
                    padding: 0.1rem 0.25rem;
                    border: 1px solid #cbd5e1;
                    border-radius: 3px;
                    color: #475569;
                }
                .validity-badge {
                    font-size: 0.75rem;
                    padding: 0.1rem 0.4rem;
                    border-radius: 999px;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.25rem;
                }
                .validity-badge.expired {
                    background: #fee2e2;
                    color: #991b1b;
                    border: 1px solid #fca5a5;
                }
                .validity-badge.warning {
                    background: #fffbeb;
                    color: #b45309;
                    border: 1px solid #fcd34d;
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
