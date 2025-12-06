import React from 'react';
import { Stipulation } from '../../services/underwritingService';

interface StipsTrackerProps {
    stips: Stipulation[];
    onUpdate: (id: string, status: Stipulation['status']) => void;
}

export const StipsTracker: React.FC<StipsTrackerProps> = ({ stips, onUpdate }) => {
    return (
        <div className="stips-tracker">
            <h4>Required Documents</h4>
            <div className="stips-list">
                {stips.map(stip => (
                    <div key={stip.id} className="stip-item">
                        <span className="stip-desc">{stip.description}</span>
                        <select
                            value={stip.status}
                            onChange={(e) => onUpdate(stip.id, e.target.value as any)}
                            className={`status-select ${stip.status}`}
                        >
                            <option value="outstanding">Outstanding</option>
                            <option value="received">Received</option>
                            <option value="waived">Waived</option>
                        </select>
                    </div>
                ))}
            </div>
            <style>{`
                .stips-list { display: flex; flex-direction: column; gap: 0.75rem; }
                .stip-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 1px solid #f1f5f9; }
                .stip-desc { font-size: 0.9rem; color: #334155; }
                .status-select { padding: 0.25rem; border-radius: 4px; border: 1px solid #cbd5e1; font-size: 0.85rem; }
                .status-select.received { background: #dcfce7; color: #166534; border-color: #86efac; }
                .status-select.waived { background: #f1f5f9; color: #64748b; }
            `}</style>
        </div>
    );
};
