import React, { useState, useMemo } from 'react';
import type { Lead } from '@leads/shared';
import { TEAM_MEMBERS } from '../services/authService';
import { ReferralStats } from './ReferralStats';
import { ResourceLibrary } from './ResourceLibrary';
import { EmailAction } from './EmailAction';
import { BankerPortal } from './BankerPortal';

interface ManagerDashboardProps {
    leads: Lead[];
    onReassignLead: (leadId: string, newOwner: string) => void;
    onSelectLead: (lead: Lead) => void;
    onBack: () => void;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
    leads,
    onReassignLead,
    onSelectLead,
    onBack
}) => {
    const [selectedRep, setSelectedRep] = useState<string | null>(null);
    const [reassignLeadId, setReassignLeadId] = useState<string | null>(null);
    const [newOwner, setNewOwner] = useState('');

    // Calculate metrics
    const metrics = useMemo(() => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const funded = leads.filter(l => l.dealStage === 'Funded');
        const closing = leads.filter(l => l.dealStage === 'Closing' || l.dealStage === 'Approved');

        const ytdFunded = funded.reduce((sum, l) => sum + (l.loanAmount || 0), 0);
        const closingThisMonth = closing.filter(l => {
            if (!l.closingDate) return true; // No date = needs attention
            const d = new Date(l.closingDate);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        });

        // Stale leads (not touched in 7+ days)
        const staleLeads = leads.filter(l => {
            if (!l.lastContactDate || l.lastContactDate === 'Never') return true;
            const last = new Date(l.lastContactDate);
            const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
            return daysSince > 7;
        });

        return {
            total: leads.length,
            ytdFunded,
            fundedCount: funded.length,
            closingThisMonth: closingThisMonth.length,
            staleCount: staleLeads.length,
            staleLeads
        };
    }, [leads]);

    const [showPortal, setShowPortal] = useState(false);

    // Pipeline by rep
    const pipelineByRep = useMemo(() => {
        const byRep: Record<string, { total: number; new: number; inProcess: number; closing: number }> = {};

        leads.forEach(lead => {
            const owner = lead.owner || 'Unassigned';
            if (!byRep[owner]) {
                byRep[owner] = { total: 0, new: 0, inProcess: 0, closing: 0 };
            }
            byRep[owner].total++;
            if (lead.stage === 'New') byRep[owner].new++;
            if (lead.stage === 'In Process' || lead.dealStage === 'Processing' || lead.dealStage === 'Underwriting') byRep[owner].inProcess++;
            if (lead.dealStage === 'Closing' || lead.dealStage === 'Approved') byRep[owner].closing++;
        });

        return Object.entries(byRep).sort((a, b) => b[1].total - a[1].total);
    }, [leads]);

    // Get rep's leads
    const repLeads = selectedRep
        ? leads.filter(l => l.owner === selectedRep)
        : [];

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

    const handleReassign = (leadId: string) => {
        if (newOwner) {
            onReassignLead(leadId, newOwner);
            setReassignLeadId(null);
            setNewOwner('');
        }
    };

    return (
        <div className="dashboard-container">
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button className="btn-secondary" onClick={onBack}>← Back</button>
                    <h1>Team Dashboard</h1>
                </div>
                <button
                    className="btn-secondary flex items-center gap-2 text-sm"
                    onClick={() => setShowPortal(true)}
                >
                    🌐 Demo Bank Portal
                </button>
            </header>

            {showPortal && (
                <BankerPortal
                    bankName="Comerica"
                    leads={leads}
                    onClose={() => setShowPortal(false)}
                />
            )}

            {/* Metrics Row */}
            <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="card-base p-6">
                    <div className="text-3xl font-bold text-slate-900">{formatCurrency(metrics.ytdFunded)}</div>
                    <div className="text-xs font-bold text-muted uppercase tracking-wider mt-1">YTD Funded</div>
                </div>
                <div className="card-base p-6">
                    <div className="text-3xl font-bold text-slate-900">{metrics.fundedCount}</div>
                    <div className="text-xs font-bold text-muted uppercase tracking-wider mt-1">Deals Closed</div>
                </div>
                <div className="card-base p-6 bg-blue-50 border-blue-200">
                    <div className="text-3xl font-bold text-blue-700">{metrics.closingThisMonth}</div>
                    <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-1">Closing This Month</div>
                </div>
                <div className="card-base p-6 bg-amber-50 border-amber-200">
                    <div className="text-3xl font-bold text-amber-700">{metrics.staleCount}</div>
                    <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mt-1">Stale Leads (7+ days)</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Pipeline by Rep */}
                <div className="card-base p-6">
                    <h3>Pipeline by Rep</h3>
                    <div className="flex flex-col gap-2 mt-4">
                        {pipelineByRep.map(([rep, data]) => (
                            <div
                                key={rep}
                                className={`flex items-center gap-4 p-2 rounded-lg cursor-pointer transition-colors ${selectedRep === rep ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-slate-50'}`}
                                onClick={() => setSelectedRep(selectedRep === rep ? null : rep)}
                            >
                                <div className="min-w-[120px]">
                                    <div className="font-medium text-slate-800 text-sm">{rep}</div>
                                    <div className="text-xs text-muted">{data.total} leads</div>
                                </div>
                                <div className="flex-1 flex h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <span style={{ width: `${(data.new / data.total) * 100}%` }} className="bg-blue-500 h-full" title="New" />
                                    <span style={{ width: `${(data.inProcess / data.total) * 100}%` }} className="bg-amber-500 h-full" title="Processing" />
                                    <span style={{ width: `${(data.closing / data.total) * 100}%` }} className="bg-emerald-500 h-full" title="Closing" />
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <EmailAction
                                        to={`${rep.toLowerCase().replace(' ', '.')}@ampac.com`}
                                        subject={`Update on Pipeline`}
                                        body={`Hi ${rep},\n\nCan we sync up on your active deals? I see you have ${data.closing} closing soon.\n\nThanks,`}
                                        variant="icon"
                                        icon="👋"
                                        label="Nudge"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4 mt-4 text-xs text-muted">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> New</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Processing</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Closing</span>
                    </div>
                </div>

                {/* Stale Leads Alert */}
                <div className="card-base p-6">
                    <h3>🚨 Stale Lead Alerts</h3>
                    <div className="flex flex-col gap-2 mt-4 max-h-[300px] overflow-y-auto pr-2">
                        {metrics.staleLeads.slice(0, 10).map(lead => (
                            <div key={lead.id} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                                <div className="cursor-pointer" onClick={() => onSelectLead(lead)}>
                                    <div className="font-medium text-slate-800 text-sm">{lead.company || lead.businessName}</div>
                                    <div className="text-xs text-muted">{lead.owner}</div>
                                </div>
                                <span className="text-xs font-bold text-amber-800">{lead.lastContactDate || 'Never'}</span>
                            </div>
                        ))}
                        {metrics.staleLeads.length === 0 && (
                            <div className="p-8 text-center text-muted">No stale leads! 🎉</div>
                        )}
                    </div>
                </div>

                {/* Referral Stats */}
                <div className="card-base p-6 col-span-2">
                    <h3>Referral Intelligence</h3>
                    <ReferralStats
                        leads={leads}
                        bankers={(() => {
                            const stored = localStorage.getItem('leads_bankers_v1');
                            if (stored) return JSON.parse(stored);
                            return [
                                { id: 'b1', name: 'John Mitchell', bank: 'Comerica', branch: 'Riverside', title: 'VP Commercial Banking', phone: '951-555-0101', email: 'jmitchell@comerica.com', trustScore: 5, totalFunded: 12500000, lastDealDate: '2024-10-15', notes: 'Great partner.' },
                                { id: 'b2', name: 'Sarah Chen', bank: 'Pacific Premier', branch: 'Los Angeles', title: 'SVP', phone: '213-555-0202', email: 'schen@ppbi.com', trustScore: 5, totalFunded: 18200000, lastDealDate: '2024-11-01', notes: 'Top performer.' },
                                { id: 'b3', name: 'Mike Thompson', bank: 'First Republic', branch: 'Newport Beach', title: 'Director', phone: '949-555-0303', email: 'mthompson@firstrepublic.com', trustScore: 4, totalFunded: 8500000, lastDealDate: '2024-09-20', notes: 'Good for larger deals.' },
                                { id: 'b4', name: 'Lisa Wong', bank: 'US Bank', branch: 'San Diego', title: 'VP SBA Lending', phone: '619-555-0404', email: 'lwong@usbank.com', trustScore: 4, totalFunded: 6800000, lastDealDate: '2024-08-10', notes: 'SBA preferred lender.' },
                            ];
                        })()}
                    />
                </div>

                {/* Resource Library (New) */}
                <div className="card-base p-6 col-span-2">
                    <ResourceLibrary />
                </div>
            </div>

            {/* Rep's Leads (when selected) */}
            {selectedRep && (
                <div className="card-base p-6 w-full">
                    <h3 className="mb-4">{selectedRep}'s Leads ({repLeads.length})</h3>
                    <div className="w-full text-sm">
                        <div className="grid grid-cols-6 gap-4 p-3 bg-slate-100 rounded-t-lg font-semibold text-slate-600">
                            <span className="col-span-2">Company</span>
                            <span>Stage</span>
                            <span>Program</span>
                            <span>Amount</span>
                            <span>Actions</span>
                        </div>
                        {repLeads.map(lead => (
                            <div key={lead.id} className="grid grid-cols-6 gap-4 p-3 border-b border-slate-100 items-center hover:bg-slate-50">
                                <span className="col-span-2 font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => onSelectLead(lead)}>
                                    {lead.company || lead.businessName}
                                </span>
                                <span>{lead.dealStage || lead.stage}</span>
                                <span>{lead.loanProgram}</span>
                                <span>{lead.loanAmount ? formatCurrency(lead.loanAmount) : '—'}</span>
                                <span className="flex items-center gap-2">
                                    {reassignLeadId === lead.id ? (
                                        <div className="flex bg-white border rounded p-1 shadow-sm items-center gap-1 absolute z-10">
                                            <select
                                                value={newOwner}
                                                onChange={e => setNewOwner(e.target.value)}
                                                className="text-xs p-1 border rounded"
                                            >
                                                <option value="">Select...</option>
                                                {TEAM_MEMBERS.filter(m => m.name !== selectedRep).map(m => (
                                                    <option key={m.email} value={m.name}>{m.name}</option>
                                                ))}
                                            </select>
                                            <button className="text-green-600 px-2 font-bold" onClick={() => handleReassign(lead.id)}>✓</button>
                                            <button className="text-red-500 px-2 font-bold" onClick={() => setReassignLeadId(null)}>✕</button>
                                        </div>
                                    ) : (
                                        <button className="text-xs text-blue-500 hover:text-blue-700" onClick={() => setReassignLeadId(lead.id)}>
                                            Reassign
                                        </button>
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style>{`
                .grid { display: grid; }
                .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
                .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
                .grid-cols-6 { grid-template-columns: repeat(6, 1fr); }
                .col-span-2 { grid-column: span 2; }
                .gap-6 { gap: 1.5rem; }
                .gap-4 { gap: 1rem; }
                .gap-2 { gap: 0.5rem; }
                .flex { display: flex; }
                .flex-col { flex-direction: column; }
                .justify-between { justify-content: space-between; }
                .items-center { align-items: center; }
                .flex-1 { flex: 1; }
                .p-6 { padding: 1.5rem; }
                .p-3 { padding: 0.75rem; }
                .p-2 { padding: 0.5rem; }
                .p-8 { padding: 2rem; }
                .mb-8 { margin-bottom: 2rem; }
                .mb-4 { margin-bottom: 1rem; }
                .mt-1 { margin-top: 0.25rem; }
                .mt-4 { margin-top: 1rem; }
                .w-full { width: 100%; }
                .min-w-\[120px\] { min-width: 120px; }
                .h-3 { height: 0.75rem; }
                .h-full { height: 100%; }
                .rounded-lg { border-radius: 0.5rem; }
                .rounded-full { border-radius: 9999px; }
                .bg-blue-50 { background-color: #eff6ff; }
                .border-blue-200 { border-color: #bfdbfe; }
                .text-blue-700 { color: #1d4ed8; }
                .text-blue-600 { color: #2563eb; }
                .bg-blue-500 { background-color: #3b82f6; }
                .bg-amber-50 { background-color: #fffbeb; }
                .border-amber-200 { border-color: #fde68a; }
                .text-amber-700 { color: #b45309; }
                .text-amber-800 { color: #92400e; }
                .text-amber-600 { color: #d97706; }
                .bg-amber-500 { background-color: #f59e0b; }
                .bg-emerald-500 { background-color: #10b981; }
                .font-bold { font-weight: 700; }
                .font-medium { font-weight: 500; }
                .text-3xl { font-size: 1.875rem; }
                .uppercase { text-transform: uppercase; }
                .tracking-wider { letter-spacing: 0.05em; }
                .overflow-hidden { overflow: hidden; }
                .cursor-pointer { cursor: pointer; }
                .hover\:bg-slate-50:hover { background-color: #f8fafc; }
                .bg-white { background-color: white; }
                .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
                .absolute { position: absolute; }
                .z-10 { z-index: 10; }
                .border { border: 1px solid #e2e8f0; }
                .max-h-\[300px\] { max-height: 300px; }
                .overflow-y-auto { overflow-y: auto; }
            `}</style>
        </div>
    );
};

export default ManagerDashboard;
