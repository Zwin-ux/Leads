import React, { useState } from 'react';
import type { Lead, ClosingItem } from '@leads/shared';

// Default closing checklist template
const DEFAULT_CLOSING_ITEMS: Omit<ClosingItem, 'id'>[] = [
    // Pre-Closing
    { category: 'pre_closing', label: 'Title Commitment Ordered', status: 'pending' },
    { category: 'pre_closing', label: 'Title Commitment Received', status: 'pending' },
    { category: 'pre_closing', label: 'Title Cleared', status: 'pending' },
    { category: 'pre_closing', label: 'Appraisal Ordered', status: 'pending' },
    { category: 'pre_closing', label: 'Appraisal Received', status: 'pending' },
    { category: 'pre_closing', label: 'Appraisal Reviewed', status: 'pending' },
    { category: 'pre_closing', label: 'Insurance Quote Received', status: 'pending' },
    { category: 'pre_closing', label: 'Insurance Binder Ordered', status: 'pending' },
    { category: 'pre_closing', label: 'Closing Docs Drafted', status: 'pending' },
    { category: 'pre_closing', label: 'Closing Docs to Parties', status: 'pending' },
    // Closing Day
    { category: 'closing_day', label: 'Wire Instructions Received', status: 'pending' },
    { category: 'closing_day', label: 'Signing Scheduled', status: 'pending' },
    { category: 'closing_day', label: 'Signing Complete', status: 'pending' },
    { category: 'closing_day', label: 'Recording Submitted', status: 'pending' },
    { category: 'closing_day', label: 'Recording Confirmed', status: 'pending' },
    { category: 'closing_day', label: 'Funding Wire Sent', status: 'pending' },
    { category: 'closing_day', label: 'Funding Confirmed', status: 'pending' },
    // Post-Closing
    { category: 'post_closing', label: 'Recorded Deed Received', status: 'pending' },
    { category: 'post_closing', label: 'Final Title Policy', status: 'pending' },
    { category: 'post_closing', label: 'Insurance Binder Filed', status: 'pending' },
    { category: 'post_closing', label: 'SBA Form 1502 Filed', status: 'pending' },
    { category: 'post_closing', label: 'File Audit Complete', status: 'pending' },
];

interface ClosingChecklistProps {
    lead: Lead;
    onUpdateClosingItem: (itemId: string, updates: Partial<ClosingItem>) => void;
    onUpdateLead: (updates: Partial<Lead>) => void;
}

export const ClosingChecklist: React.FC<ClosingChecklistProps> = ({
    lead,
    onUpdateClosingItem,
    onUpdateLead
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Initialize with defaults if empty
    const items: ClosingItem[] = lead.closingItems?.length
        ? lead.closingItems
        : DEFAULT_CLOSING_ITEMS.map((item, i) => ({ ...item, id: `closing-${i}` }));

    // Group by category
    const preClosing = items.filter(i => i.category === 'pre_closing');
    const closingDay = items.filter(i => i.category === 'closing_day');
    const postClosing = items.filter(i => i.category === 'post_closing');

    // Stats
    const total = items.length;
    const complete = items.filter(i => i.status === 'complete' || i.status === 'na').length;
    const percent = Math.round((complete / total) * 100);

    const getStatusIcon = (status: ClosingItem['status']) => {
        switch (status) {
            case 'complete': return '✓';
            case 'in_progress': return '◐';
            case 'na': return '—';
            default: return '○';
        }
    };

    const getStatusColor = (status: ClosingItem['status']) => {
        switch (status) {
            case 'complete': return '#22c55e';
            case 'in_progress': return '#f59e0b';
            case 'na': return '#94a3b8';
            default: return '#e2e8f0';
        }
    };

    const handleStatusChange = (item: ClosingItem, newStatus: ClosingItem['status']) => {
        const updates: Partial<ClosingItem> = { status: newStatus };
        if (newStatus === 'complete') {
            updates.completedDate = new Date().toISOString().split('T')[0];
        }
        onUpdateClosingItem(item.id, updates);
    };

    const renderSection = (title: string, sectionItems: ClosingItem[], icon: string) => {
        const sectionComplete = sectionItems.filter(i => i.status === 'complete' || i.status === 'na').length;
        return (
            <div className="closing-section">
                <div className="section-header">
                    <span className="section-icon">{icon}</span>
                    <span className="section-title">{title}</span>
                    <span className="section-count">{sectionComplete}/{sectionItems.length}</span>
                </div>
                <div className="section-items">
                    {sectionItems.map(item => (
                        <div
                            key={item.id}
                            className={`closing-item status-${item.status}`}
                            style={{ borderLeftColor: getStatusColor(item.status) }}
                        >
                            <div className="item-main" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                                <span className="item-icon" style={{ color: getStatusColor(item.status) }}>
                                    {getStatusIcon(item.status)}
                                </span>
                                <span className="item-label">{item.label}</span>
                                <select
                                    className="status-select"
                                    value={item.status}
                                    onClick={e => e.stopPropagation()}
                                    onChange={e => handleStatusChange(item, e.target.value as ClosingItem['status'])}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="complete">Complete</option>
                                    <option value="na">N/A</option>
                                </select>
                            </div>
                            {expandedId === item.id && (
                                <div className="item-details">
                                    <div className="detail-row">
                                        <label>Due Date</label>
                                        <input
                                            type="date"
                                            value={item.dueDate || ''}
                                            onChange={e => onUpdateClosingItem(item.id, { dueDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="detail-row">
                                        <label>Third Party</label>
                                        <input
                                            type="text"
                                            placeholder="Title co, escrow, etc."
                                            value={item.thirdParty || ''}
                                            onChange={e => onUpdateClosingItem(item.id, { thirdParty: e.target.value })}
                                        />
                                    </div>
                                    <div className="detail-row">
                                        <label>Contact</label>
                                        <input
                                            type="text"
                                            placeholder="Name / phone"
                                            value={item.thirdPartyContact || ''}
                                            onChange={e => onUpdateClosingItem(item.id, { thirdPartyContact: e.target.value })}
                                        />
                                    </div>
                                    <div className="detail-row">
                                        <label>Notes</label>
                                        <input
                                            type="text"
                                            placeholder="Notes..."
                                            value={item.notes || ''}
                                            onChange={e => onUpdateClosingItem(item.id, { notes: e.target.value })}
                                        />
                                    </div>
                                    {item.completedDate && (
                                        <div className="completed-date">
                                            Completed: {item.completedDate}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="closing-checklist">
            {/* Header with progress and dates */}
            <div className="checklist-header">
                <div className="progress-section">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="progress-text">{percent}% Complete ({complete}/{total})</span>
                </div>
                <div className="date-inputs">
                    <div className="date-field">
                        <label>Closing Date</label>
                        <input
                            type="date"
                            value={lead.closingDate || ''}
                            onChange={e => onUpdateLead({ closingDate: e.target.value })}
                        />
                    </div>
                    <div className="date-field">
                        <label>Funding Date</label>
                        <input
                            type="date"
                            value={lead.fundingDate || ''}
                            onChange={e => onUpdateLead({ fundingDate: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Checklist Sections */}
            <div className="checklist-body">
                {renderSection('Pre-Closing', preClosing, '📋')}
                {renderSection('Closing Day', closingDay, '✍️')}
                {renderSection('Post-Close', postClosing, '📁')}
            </div>

            <style>{`
                .closing-checklist {
                    padding: 0.5rem 0;
                }
                .checklist-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 1rem;
                    margin-bottom: 1rem;
                    border-bottom: 1px solid #e2e8f0;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                .progress-section {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .progress-bar {
                    width: 200px;
                    height: 8px;
                    background: #e2e8f0;
                    border-radius: 4px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #22c55e, #16a34a);
                    transition: width 0.3s ease;
                }
                .progress-text {
                    font-size: 0.85rem;
                    color: #64748b;
                }
                .date-inputs {
                    display: flex;
                    gap: 1rem;
                }
                .date-field {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }
                .date-field label {
                    font-size: 0.75rem;
                    color: #64748b;
                }
                .date-field input {
                    padding: 0.4rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    font-size: 0.85rem;
                }
                .checklist-body {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    max-height: 400px;
                    overflow-y: auto;
                }
                .closing-section {
                    background: #f8fafc;
                    border-radius: 8px;
                    padding: 0.75rem;
                }
                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.75rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid #e2e8f0;
                }
                .section-icon {
                    font-size: 1.1rem;
                }
                .section-title {
                    font-weight: 600;
                    color: #1e293b;
                    flex: 1;
                }
                .section-count {
                    font-size: 0.8rem;
                    color: #64748b;
                    background: white;
                    padding: 0.15rem 0.5rem;
                    border-radius: 10px;
                }
                .section-items {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .closing-item {
                    background: white;
                    border-radius: 6px;
                    border-left: 3px solid #e2e8f0;
                    overflow: hidden;
                }
                .item-main {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    cursor: pointer;
                }
                .item-main:hover {
                    background: #f1f5f9;
                }
                .item-icon {
                    font-size: 0.9rem;
                    font-weight: 600;
                }
                .item-label {
                    flex: 1;
                    font-size: 0.875rem;
                    color: #1e293b;
                }
                .status-select {
                    padding: 0.2rem 0.4rem;
                    font-size: 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    background: white;
                    cursor: pointer;
                }
                .item-details {
                    padding: 0.75rem;
                    background: #f8fafc;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .detail-row {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .detail-row label {
                    font-size: 0.75rem;
                    color: #64748b;
                    min-width: 70px;
                }
                .detail-row input {
                    flex: 1;
                    padding: 0.3rem 0.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    font-size: 0.8rem;
                }
                .completed-date {
                    font-size: 0.75rem;
                    color: #22c55e;
                    font-style: italic;
                }
                .closing-item.status-complete {
                    opacity: 0.7;
                }
                .closing-item.status-complete .item-label {
                    text-decoration: line-through;
                }
            `}</style>
        </div>
    );
};

export default ClosingChecklist;
