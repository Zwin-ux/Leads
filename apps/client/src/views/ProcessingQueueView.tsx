import React, { useState, useEffect } from "react";
import { apiService } from "../services/apiService";
import { authService } from "../services/authService";
import type { Lead } from "@leads/shared";

export const ProcessingQueueView: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const user = authService.getCurrentUser();

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        try {
            const allLeads = await apiService.getLeads();
            // Filter for deals that are in "Processing", "Approved", "Closing" or "Funded"
            // Or if assigned to this processor
            const relevantLeads = allLeads.filter(l =>
                ["Processing", "Approved", "Underwriting", "Closing", "Funded"].includes(l.dealStage || "") ||
                l.processorId === user?.email
            );
            setLeads(relevantLeads);
        } catch (error) {
            console.error("Failed to load processing queue", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (lead: Lead, newStage: any) => {
        const updated = { ...lead, dealStage: newStage };
        await apiService.updateLead(updated);
        loadLeads(); // Refresh
    };

    if (loading) return <div className="p-8 text-white">Loading Queue...</div>;

    const columns = [
        { id: "Underwriting", label: "Inbox / Approvals", bg: "bg-gray-800" },
        { id: "Processing", label: "Active Processing", bg: "bg-blue-900/40" },
        { id: "Closing", label: "Clear to Close", bg: "bg-green-900/40" },
        { id: "Funded", label: "Funded", bg: "bg-purple-900/40" }
    ];

    return (
        <div className="min-h-screen bg-[#111] text-white p-6">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        Processing Queue
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Welcome, {user?.name} ({user?.role})
                    </p>
                </div>
                <button onClick={loadLeads} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors">
                    Refresh Board
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
                {columns.map(col => (
                    <div key={col.id} className={`rounded-xl p-4 flex flex-col ${col.bg} border border-white/5`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-semibold text-lg text-gray-200">{col.label}</h2>
                            <span className="bg-white/10 text-xs px-2 py-1 rounded-full">
                                {leads.filter(l => (l.dealStage || "Underwriting") === col.id).length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-600">
                            {leads
                                .filter(l => (l.dealStage || "Underwriting") === col.id)
                                .map(lead => (
                                    <div key={lead.id} className="bg-[#222] p-4 rounded-lg border border-white/5 hover:border-blue-500/50 transition-all group shadow-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-blue-200">{lead.company || lead.businessName || "Unnamed Deal"}</h3>
                                            {lead.processingPriority === 'High' && <span className="text-xs text-red-400 font-bold">HIGH</span>}
                                        </div>

                                        <div className="text-sm text-gray-400 mb-3 space-y-1">
                                            <p>👤 {lead.firstName} {lead.lastName}</p>
                                            <p>💰 ${lead.loanAmount?.toLocaleString() || '?'}</p>
                                            {lead.targetClosingDate && <p className="text-yellow-500 text-xs">📅 Target: {lead.targetClosingDate}</p>}
                                        </div>

                                        <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2 opacity-100 transition-opacity">
                                            {/* Quick Actions */}
                                            {col.id !== "Funded" && (
                                                <button
                                                    onClick={() => {
                                                        const next = col.id === "Underwriting" ? "Processing" :
                                                            col.id === "Processing" ? "Closing" : "Funded";
                                                        updateStatus(lead, next);
                                                    }}
                                                    className="flex-1 px-2 py-1.5 bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 rounded text-xs"
                                                >
                                                    Move to {col.id === "Underwriting" ? "Processing" : col.id === "Processing" ? "Closing" : "Funded"} &rarr;
                                                </button>
                                            )}
                                            <button className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300">
                                                Checklist
                                            </button>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
