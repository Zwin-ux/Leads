import React from 'react';
import type { Lead } from '@leads/shared';

interface BankerPortalProps {
    bankName: string;
    leads: Lead[];
    onClose: () => void;
}

export const BankerPortal: React.FC<BankerPortalProps> = ({ bankName, leads, onClose }) => {
    // Filter leads shared with this bank (Mock logic)
    // In reality, this would filter by 'partnerBank' field or similar
    // For demo, we just show a subset
    const sharedLeads = leads.slice(0, 3); // Just show top 3 for demo

    return (
        <div className="portal-container fixed inset-0 bg-slate-50 z-[100] flex flex-col">
            {/* External Header - Branding different from AmPac */}
            <header className="bg-white border-b px-8 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-900 rounded flex items-center justify-center text-white font-bold">
                        {bankName[0]}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{bankName} Partner Portal</h2>
                        <div className="text-xs text-slate-500">Powered by AmPac Connect™</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-right">
                        <div className="font-medium">External User</div>
                        <div className="text-xs text-slate-500">View Only Access</div>
                    </div>
                    <button className="btn-secondary text-sm" onClick={onClose}>Exit Portal View</button>
                </div>
            </header>

            <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold mb-2">Shared Deal Pipeline</h1>
                    <p className="text-slate-600">Real-time status of SBA 504 loans in progress with AmPac.</p>
                </div>

                <div className="grid gap-4">
                    {sharedLeads.map(lead => (
                        <div key={lead.id} className="bg-white rounded-lg shadow-sm border p-6 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-lg font-semibold text-slate-900">{lead.company || lead.businessName}</h3>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium 
                                        ${lead.dealStage === 'Funded' ? 'bg-emerald-100 text-emerald-700' :
                                            lead.dealStage === 'Closing' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {lead.dealStage || lead.stage}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-500 flex gap-4">
                                    <span>loan: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lead.loanAmount || 0)}</span>
                                    <span>•</span>
                                    <span>Program: {lead.loanProgram || 'SBA 504'}</span>
                                    <span>•</span>
                                    <span>Est. Close: {lead.closingDate || 'TBD'}</span>
                                </div>
                            </div>

                            <div className="flex gap-8 items-center">
                                {/* Simple Stage Tracker */}
                                <div className="flex flex-col gap-1 items-end">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Status</div>
                                    <div className="font-medium text-slate-800">
                                        {lead.dealStage === 'Underwriting' ? 'Credit Review' :
                                            lead.dealStage === 'Processing' ? 'Collecting Docs' :
                                                lead.dealStage || 'Application'}
                                    </div>
                                </div>

                                <button className="btn-secondary text-sm">View Documents</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-6 flex gap-4">
                    <div className="text-3xl">🤝</div>
                    <div>
                        <h4 className="font-bold text-blue-900">Need to submit a new deal?</h4>
                        <p className="text-sm text-blue-700 mt-1">
                            Upload a new package directly through this portal for instant pre-qualification.
                        </p>
                        <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors">
                            Submit New Deal
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
