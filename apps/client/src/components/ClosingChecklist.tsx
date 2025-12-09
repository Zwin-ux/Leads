import React from 'react';
import type { Lead, ClosingItem } from '@leads/shared';

interface ClosingChecklistProps {
    lead: Lead;
    onUpdateClosingItem: (itemId: string, updates: Partial<ClosingItem>) => void;
    onUpdateLead: (updates: Partial<Lead>) => void;
}

export const ClosingChecklist: React.FC<ClosingChecklistProps> = ({ lead, onUpdateClosingItem, onUpdateLead }) => {
    const items = lead.closingItems || [];

    // Group items by category
    const preClosing = items.filter(i => i.category === 'pre_closing');
    const closingDay = items.filter(i => i.category === 'closing_day');
    const postClosing = items.filter(i => i.category === 'post_closing');

    const renderItem = (item: ClosingItem) => {
        const isComplete = item.status === 'complete';
        return (
            <div key={item.id} className={`flex items - center justify - between p - 3 bg - gray - 800 rounded border border - gray - 700 mb - 2 ${isComplete ? 'opacity-70' : ''} `}>
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={isComplete}
                        onChange={() => onUpdateClosingItem(item.id, { status: isComplete ? 'pending' : 'complete' })}
                        className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                    />
                    <span className={`text - sm ${isComplete ? 'text-gray-400 line-through' : 'text-gray-200'} `}>
                        {item.label}
                    </span>
                </div>
                <div className="flex gap-2">
                    {item.status === 'na' && <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">N/A</span>}
                    {item.status !== 'na' && (
                        <button
                            className="text-xs text-gray-500 hover:text-white"
                            onClick={() => onUpdateClosingItem(item.id, { status: 'na' })}
                        >
                            Mark N/A
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (items.length === 0) {
        return (
            <div className="text-center p-8 border-2 border-dashed border-gray-700 rounded-lg">
                <p className="text-gray-400 mb-4">No checklist initialized.</p>
                <button
                    onClick={() => onUpdateClosingItem('closing-0', {})} // Trigger initialization in parent
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Initialize 504 Checklist
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h4 className="text-blue-400 font-bold mb-3 uppercase text-xs tracking-wider">Pre-Closing</h4>
                {preClosing.map(renderItem)}
            </div>

            <div>
                <h4 className="text-yellow-400 font-bold mb-3 uppercase text-xs tracking-wider">Closing Day</h4>
                {closingDay.map(renderItem)}
            </div>

            <div>
                <h4 className="text-purple-400 font-bold mb-3 uppercase text-xs tracking-wider">Post-Closing</h4>
                {postClosing.map(renderItem)}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-700">
                <label className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Target Closing Date:</span>
                    <input
                        type="date"
                        value={lead.targetClosingDate || ''}
                        onChange={(e) => onUpdateLead({ targetClosingDate: e.target.value })}
                        className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white"
                    />
                </label>
            </div>
        </div>
    );
};
