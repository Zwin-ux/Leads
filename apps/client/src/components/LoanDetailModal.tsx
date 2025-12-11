import React from 'react';
import { LoanDetailForm } from './LoanDetailForm';
import type { Lead } from '@leads/shared';
import './LoanDetailForm.css';
import './LoanDetailModal.css';

interface LoanDetailModalProps {
    isOpen: boolean;
    lead: Lead | null;
    onClose: () => void;
    onSave: (updatedLead: Lead) => Promise<void>;
}

export const LoanDetailModal: React.FC<LoanDetailModalProps> = ({
    isOpen,
    lead,
    onClose,
    onSave
}) => {
    if (!isOpen || !lead) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleSave = async (updatedLead: Lead) => {
        await onSave(updatedLead);
        onClose();
    };

    return (
        <div className="loan-modal-backdrop" onClick={handleBackdropClick}>
            <div className="loan-modal-container">
                <LoanDetailForm
                    lead={lead}
                    onSave={handleSave}
                    onClose={onClose}
                />
            </div>
        </div>
    );
};

export default LoanDetailModal;
