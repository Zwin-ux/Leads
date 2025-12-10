
import React, { useState, useMemo } from 'react';
import type { Lead } from '@leads/shared';
import { PipelineView } from './PipelineView';
import { FeeCalculator } from './FeeCalculator';
import { TaskItem } from './crm/TaskItem';
import { ActivityFeed } from './crm/ActivityFeed';
import { ScenarioLauncher } from './ScenarioLauncher';
import { authService } from '../services/authService';
import { crmService, type Task, type Activity } from '../services/crmService';

interface MainDashboardProps {
    leads: Lead[];
    onUpdateLead: (lead: Lead) => void;
    onViewChange: (mode: 'list' | 'pipeline' | 'generator' | 'bankers' | 'integrations' | 'ad_generator' | 'import') => void;
    onAddLead: () => void;
    onEmailLead: (lead: Lead) => void;
    onSelectLead: (lead: Lead) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
    leads,
    onUpdateLead,
    onViewChange,
    onAddLead,
    onEmailLead,
    onSelectLead
}) => {
    const currentUser = authService.getCurrentUser();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [showFeeCalc, setShowFeeCalc] = useState(true);

    // Initial Load & Polling & Deep Links
    React.useEffect(() => {
        const loadData = () => {
            setTasks(crmService.getTasks());
            setActivities(crmService.getActivities());
        };
        loadData();
        const interval = setInterval(loadData, 5000); // Poll for updates

        // Deep Link Handling (Teams/Outlook)
        const params = new URLSearchParams(window.location.search);
        const claimLeadId = params.get('claimLead');
        const leadId = params.get('leadId');
        const action = params.get('action');

        if (claimLeadId && currentUser) {
            // JUMP BALL: Claim Lead
            const lead = leads.find(l => l.id === claimLeadId);
            if (lead) {
                const updatedLead = { ...lead, owner: currentUser.name, status: 'In Process' };
                onUpdateLead(updatedLead);
                // Clean URL
                window.history.replaceState({}, '', window.location.pathname);
                // Show notification (simple alert for now)
                alert(`🏀 You successfully claimed ${lead.company}!`);
                onSelectLead(updatedLead);
            }
        }

        if (leadId && action === 'touch') {
            // STALLED DEAL: Touch
            const lead = leads.find(l => l.id === leadId);
            if (lead) {
                const updatedLead = { ...lead, lastContactDate: new Date().toISOString() };
                onUpdateLead(updatedLead);
                window.history.replaceState({}, '', window.location.pathname);
                alert(`✅ ${lead.company} status updated (Stall timer reset).`);
            }
        } else if (leadId) {
            // Just Open
            const lead = leads.find(l => l.id === leadId);
            if (lead) onSelectLead(lead);
        }

        return () => clearInterval(interval);
    }, [leads, currentUser]); // Added dependencies to ensure we have leads loaded

    // Stats Calculation
    const stats = useMemo(() => {
        const activeLeads = leads.filter(l => !['Closed Lost', 'Funded', 'Archived'].includes(l.dealStage || l.stage));
        const pipelineValue = activeLeads.reduce((sum, l) => sum + (l.loanAmount || 0), 0);
        const tasksDue = tasks.filter(t => !t.completed).length;

        return {
            pipelineValue: (pipelineValue / 1000000).toFixed(1) + 'M',
            activeCount: activeLeads.length,
            tasksDue
        };
    }, [leads, tasks]);

    const handleTaskToggle = (id: string) => {
        const updated = crmService.toggleTask(id);
        if (updated) {
            setTasks(prev => prev.map(t => t.id === id ? updated : t));
        }
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const input = form.elements.namedItem('taskTitle') as HTMLInputElement;
        if (input.value.trim()) {
            const newTask = crmService.addTask({
                title: input.value,
                assignedTo: currentUser?.name || 'Self',
                dueDate: new Date().toISOString(), // Today
                type: 'todo',
                priority: 'normal'
            });
            setTasks([newTask, ...tasks]);
            input.value = '';
        }
    };

    return (
        <div className="main-dashboard" style={{
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
            height: '100vh',
            background: '#f8fafc',
            overflow: 'hidden'
        }}>
            {/* 1. Header & Toolbar */}
            <div className="dashboard-header" style={{
                background: 'white',
                padding: '1rem 2rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Dashboard</h1>

                    {/* Metrics Pills */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="metric-pill" style={{ display: 'flex', flexDirection: 'column', paddingRight: '1rem', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Pipeline Value</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>${stats.pipelineValue}</span>
                        </div>
                        <div className="metric-pill" style={{ display: 'flex', flexDirection: 'column', paddingRight: '1rem', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Active Deals</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>{stats.activeCount}</span>
                        </div>
                        <div className="metric-pill" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Apps / Closing</span>
                            {/* Mock sub-metric for now */}
                            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                                {leads.filter(l => l.dealStage === 'Application').length} / {leads.filter(l => l.dealStage === 'Closing').length} closings
                            </span>
                        </div>
                    </div>
                </div>

                {/* Toolbar Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => onViewChange('generator')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🔍 Find Leads
                    </button>
                    <button onClick={() => onViewChange('bankers')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', borderColor: '#fcd34d' }}>
                        🏦 Rolodex
                    </button>
                    <div className="dropdown-toolbar" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => onViewChange('ad_generator')} className="btn-icon" title="Ad Creator" style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            🎬
                        </button>
                        <button onClick={() => onViewChange('integrations')} className="btn-icon" title="Integrations" style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            🔌
                        </button>
                    </div>
                    <div style={{ width: '1px', background: '#e2e8f0', margin: '0 0.5rem' }} />
                    <button onClick={onAddLead} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        + New Lead
                    </button>
                </div>
            </div>

            {/* 2. Main Content Grid */}
            <div className="dashboard-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 350px', // Kanban takes remaining space, Sidebar fixed 350px
                gap: '0',
                height: '100%',
                overflow: 'hidden'
            }}>
                {/* Kanban Area */}
                <div className="kanban-area" style={{
                    overflowY: 'auto',
                    overflowX: 'auto',
                    padding: '1.5rem',
                    background: '#f1f5f9'
                }}>
                    <PipelineView
                        leads={leads}
                        onLeadClick={onSelectLead}
                        onLeadMove={(id, stage) => {
                            const lead = leads.find(l => l.id === id);
                            if (lead) onUpdateLead({ ...lead, dealStage: stage as any });
                        }}
                        onEmailLead={onEmailLead}
                    />
                </div>

                {/* Right Sidebar Widgets */}
                <div className="dashboard-sidebar" style={{
                    background: 'white',
                    borderLeft: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto',
                    padding: '1.5rem',
                    gap: '1.5rem'
                }}>
                    {/* User Profile Snippet */}
                    <div className="user-snippet" style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ width: '40px', height: '40px', background: '#3b82f6', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {currentUser?.name.charAt(0)}
                        </div>
                        <div>
                            <div style={{ fontWeight: 600 }}>{currentUser?.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{currentUser?.title}</div>
                        </div>
                    </div>

                    {/* Tasks Widget */}
                    <div className="widget tasks-widget">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>My Tasks</h3>
                            <span className="badge" style={{ background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem' }}>{stats.tasksDue}</span>
                        </div>

                        <form onSubmit={handleCreateTask} style={{ marginBottom: '1rem' }}>
                            <input
                                name="taskTitle"
                                placeholder="+ Add new task..."
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                            />
                        </form>

                        <div className="task-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                            {tasks.filter(t => !t.completed).map(task => (
                                <TaskItem key={task.id} task={task} onToggle={() => handleTaskToggle(task.id)} />
                            ))}
                            {tasks.filter(t => !t.completed).length === 0 && (
                                <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', padding: '1rem' }}>No pending tasks</div>
                            )}

                            {/* Completed Tasks (Collapsed/Small) */}
                            {tasks.filter(t => t.completed).length > 0 && (
                                <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#94a3b8' }}>Completed</h4>
                                    {tasks.filter(t => t.completed).slice(0, 3).map(task => (
                                        <TaskItem key={task.id} task={task} onToggle={() => handleTaskToggle(task.id)} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fee Calculator Widget */}
                    <div className="widget fee-widget" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                        <div
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', cursor: 'pointer' }}
                            onClick={() => setShowFeeCalc(!showFeeCalc)}
                        >
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>💰 504 Fee Estimator</h3>
                            <span>{showFeeCalc ? '▼' : '▶'}</span>
                        </div>
                        {showFeeCalc && <FeeCalculator />}
                    </div>

                    {/* Recent Activity */}
                    <div className="widget activity-widget" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Recent Activity</h3>
                        <ActivityFeed activities={activities.slice(0, 5)} />
                    </div>
                </div>
            </div>
            <ScenarioLauncher />
        </div >
    );
};
