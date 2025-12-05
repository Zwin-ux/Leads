import React, { useState } from 'react';
import type { Lead, BankPartnerDeal, Banker } from '@leads/shared';

interface BankPartnerPanelProps {
    lead: Lead;
    bankers: Banker[];
    onAddBankPartner: (partner: BankPartnerDeal) => void;
    onUpdateBankPartner: (bankerId: string, updates: Partial<BankPartnerDeal>) => void;
    onRemoveBankPartner: (bankerId: string) => void;
}

export const BankPartnerPanel: React.FC<BankPartnerPanelProps> = ({
    lead,
    bankers,
    onAddBankPartner,
    onUpdateBankPartner,
    onRemoveBankPartner
}) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedBankerId, setSelectedBankerId] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const partners = lead.bankPartners || [];

    // Filter out bankers already added
    const availableBankers = bankers.filter(b =>
        !partners.find(p => p.bankerId === b.id)
    );

    const getStatusColor = (status: BankPartnerDeal['status']) => {
        switch (status) {
            case 'committed': return '#22c55e';
            case 'approved': return '#3b82f6';
            case 'reviewing': return '#f59e0b';
            case 'approached': return '#94a3b8';
            case 'declined': return '#ef4444';
            default: return '#94a3b8';
        }
    };

    const handleAddPartner = () => {
        const banker = bankers.find(b => b.id === selectedBankerId);
        if (!banker) return;

        const newPartner: BankPartnerDeal = {
            bankerId: banker.id,
            bankerName: banker.name,
            bankName: banker.bank,
            status: 'approached',
            updatedAt: new Date().toISOString()
        };

        onAddBankPartner(newPartner);
        setSelectedBankerId('');
        setShowAddForm(false);
    };

    const handleStatusChange = (partner: BankPartnerDeal, newStatus: BankPartnerDeal['status']) => {
        onUpdateBankPartner(partner.bankerId, {
            status: newStatus,
            updatedAt: new Date().toISOString()
        });
    };

    return (
        <div className="bank-partner-panel">
            {/* Header */}
            <div className="panel-header">
                <span className="partner-count">
                    {partners.length} Bank Partner{partners.length !== 1 ? 's' : ''}
                </span>
                {!showAddForm && (
                    <button
                        className="btn-secondary add-btn"
                        onClick={() => setShowAddForm(true)}
                    >
                        + Add Bank
                    </button>
                )}
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="add-form">
                    <select
                        value={selectedBankerId}
                        onChange={(e) => setSelectedBankerId(e.target.value)}
                        className="banker-select"
                    >
                        <option value="">Select a banker...</option>
                        {availableBankers.map(b => (
                            <option key={b.id} value={b.id}>
                                {b.name} — {b.bank}
                            </option>
                        ))}
                    </select>
                    <div className="add-form-actions">
                        <button
                            className="btn-primary"
                            onClick={handleAddPartner}
                            disabled={!selectedBankerId}
                        >
                            Add
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                setShowAddForm(false);
                                setSelectedBankerId('');
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Partner List */}
            <div className="partner-list">
                {partners.length === 0 && !showAddForm && (
                    <div className="empty-state">
                        No bank partners added yet. Add a bank to track participation.
                    </div>
                )}

                {partners.map(partner => (
                    <div
                        key={partner.bankerId}
                        className="partner-card"
                        style={{ borderLeftColor: getStatusColor(partner.status) }}
                    >
                        <div className="partner-main">
                            <div className="partner-info">
                                <span className="partner-bank">{partner.bankName}</span>
                                <span className="partner-contact">{partner.bankerName}</span>
                            </div>
                            <select
                                className="status-select"
                                value={partner.status}
                                onChange={(e) => handleStatusChange(partner, e.target.value as BankPartnerDeal['status'])}
                                style={{ borderColor: getStatusColor(partner.status) }}
                            >
                                <option value="approached">Approached</option>
                                <option value="reviewing">Reviewing</option>
                                <option value="approved">Approved</option>
                                <option value="committed">Committed</option>
                                <option value="declined">Declined</option>
                            </select>
                        </div>

                        {/* Expanded Details */}
                        {editingId === partner.bankerId ? (
                            <div className="partner-details editing">
                                <div className="detail-row">
                                    <label>Loan Amount</label>
                                    <input
                                        type="text"
                                        placeholder="$0"
                                        defaultValue={partner.loanAmount?.toLocaleString()}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                                            onUpdateBankPartner(partner.bankerId, { loanAmount: val });
                                        }}
                                    />
                                </div>
                                <div className="detail-row">
                                    <label>Rate</label>
                                    <input
                                        type="text"
                                        placeholder="P + 0.50%"
                                        defaultValue={partner.rate}
                                        onChange={(e) => onUpdateBankPartner(partner.bankerId, { rate: e.target.value })}
                                    />
                                </div>
                                <div className="detail-row">
                                    <label>Term</label>
                                    <input
                                        type="text"
                                        placeholder="25/10"
                                        defaultValue={partner.term}
                                        onChange={(e) => onUpdateBankPartner(partner.bankerId, { term: e.target.value })}
                                    />
                                </div>
                                <button
                                    className="btn-secondary"
                                    onClick={() => setEditingId(null)}
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <div className="partner-details">
                                {partner.loanAmount && (
                                    <span className="detail">${partner.loanAmount.toLocaleString()}</span>
                                )}
                                {partner.rate && (
                                    <span className="detail">{partner.rate}</span>
                                )}
                                {partner.term && (
                                    <span className="detail">{partner.term}</span>
                                )}
                                <button
                                    className="edit-btn"
                                    onClick={() => setEditingId(partner.bankerId)}
                                >
                                    Edit Terms
                                </button>
                                <button
                                    className="remove-btn"
                                    onClick={() => onRemoveBankPartner(partner.bankerId)}
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <style>{`
                .bank-partner-panel {
                    padding: 0.5rem 0;
                }
                .panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid #e2e8f0;
                }
                .partner-count {
                    font-weight: 500;
                    color: #475569;
                }
                .add-btn {
                    padding: 0.4rem 0.75rem;
                    font-size: 0.85rem;
                }
                .add-form {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                }
                .banker-select {
                    padding: 0.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 0.9rem;
                }
                .add-form-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                .add-form-actions button {
                    padding: 0.4rem 0.75rem;
                    font-size: 0.85rem;
                }
                .partner-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .empty-state {
                    text-align: center;
                    color: #94a3b8;
                    padding: 2rem;
                    font-size: 0.9rem;
                }
                .partner-card {
                    background: #f8fafc;
                    border-radius: 8px;
                    border-left: 4px solid #e2e8f0;
                    padding: 0.75rem 1rem;
                }
                .partner-main {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .partner-info {
                    display: flex;
                    flex-direction: column;
                }
                .partner-bank {
                    font-weight: 600;
                    color: #1e293b;
                }
                .partner-contact {
                    font-size: 0.85rem;
                    color: #64748b;
                }
                .status-select {
                    padding: 0.3rem 0.5rem;
                    font-size: 0.8rem;
                    border-radius: 4px;
                    border-width: 2px;
                    background: white;
                    cursor: pointer;
                }
                .partner-details {
                    display: flex;
                    gap: 0.75rem;
                    margin-top: 0.5rem;
                    padding-top: 0.5rem;
                    border-top: 1px solid #e2e8f0;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .partner-details.editing {
                    flex-direction: column;
                    align-items: stretch;
                }
                .detail-row {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }
                .detail-row label {
                    font-size: 0.8rem;
                    color: #64748b;
                    min-width: 80px;
                }
                .detail-row input {
                    flex: 1;
                    padding: 0.3rem 0.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    font-size: 0.85rem;
                }
                .detail {
                    font-size: 0.85rem;
                    color: #475569;
                    background: white;
                    padding: 0.2rem 0.5rem;
                    border-radius: 4px;
                    border: 1px solid #e2e8f0;
                }
                .edit-btn, .remove-btn {
                    font-size: 0.75rem;
                    padding: 0.2rem 0.5rem;
                    background: transparent;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                }
                .edit-btn:hover { color: #3b82f6; }
                .remove-btn:hover { color: #ef4444; }
            `}</style>
        </div>
    );
};
