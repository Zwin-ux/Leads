import React, { useMemo, useState, useEffect } from 'react';
import type { Lead } from '@leads/shared';
import { authService } from '../services/authService';
import { crmService, type Task, type Activity } from '../services/crmService';
import { PipelineView } from './PipelineView';
import { FeeCalculator } from './FeeCalculator';
import { TaskItem } from './crm/TaskItem';
import { ActivityFeed } from './crm/ActivityFeed';
import { DealTable } from './crm/DealTable';

interface BDODashboardProps {
    leads: Lead[];
    onUpdateLead: (lead: Lead) => void;
    onFindLeads: () => void;
}

export const BDODashboard: React.FC<BDODashboardProps> = ({ leads, onUpdateLead, onFindLeads }) => {
    const currentUser = authService.getCurrentUser();
    const [view, setView] = useState<'pipeline' | 'list'>('pipeline');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [showNewTask, setShowNewTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    useEffect(() => {
        refreshCrmData();
    }, []);

    const refreshCrmData = () => {
        setTasks(crmService.getTasks('all'));
        setActivities(crmService.getActivities());
    };

    const handleToggleTask = (id: string) => {
        crmService.toggleTask(id);
        refreshCrmData();
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        crmService.addTask({
            title: newTaskTitle,
            dueDate: new Date().toISOString().split('T')[0],
            type: 'todo',
            priority: 'normal'
        });

        setNewTaskTitle('');
        setShowNewTask(false);
        refreshCrmData();
    };

    // Filter leads relevant to BDO (New, Qualified, Proposal, Negotiation)
    const bdoLeads = useMemo(() => {
        const huntingStages = ['New', 'In Process', 'Qualified', 'Proposal', 'Negotiation'];
        let filtered = leads.filter(l => huntingStages.includes(l.stage) || huntingStages.includes(l.dealStage || ''));

        if (currentUser && currentUser.role === 'bdo') {
            filtered = filtered.filter(l => l.owner === currentUser.name || l.owner === 'Unassigned');
        }

        return filtered;
    }, [leads, currentUser]);

    // Stats
    const stats = useMemo(() => ({
        tasksDue: tasks.filter(t => !t.completed && new Date(t.dueDate) <= new Date()).length,
        pipelineValue: bdoLeads.reduce((sum, l) => sum + (l.loanAmount || 0), 0),
        activeDeals: bdoLeads.length
    }), [tasks, bdoLeads]);

    return (
        <div className="bdo-crm-dashboard">
            {/* Top Bar */}
            <header className="crm-header">
                <div className="header-left">
                    <h1>Business Development</h1>
                    <span className="user-badge">{currentUser?.name}</span>
                </div>
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="label">Pipeline Value</span>
                        <span className="value">${(stats.pipelineValue / 1000000).toFixed(1)}M</span>
                    </div>
                    <div className="stat-item warning">
                        <span className="label">Tasks Due</span>
                        <span className="value">{stats.tasksDue}</span>
                    </div>
                    <div className="stat-item">
                        <span className="label">Active Deals</span>
                        <span className="value">{stats.activeDeals}</span>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={onFindLeads}>+ Find Leads</button>
                </div>
            </header>

            <div className="crm-grid">
                {/* Left Sidebar: Activity & Tasks */}
                <div className="crm-sidebar">
                    <div className="sidebar-section">
                        <div className="section-header">
                            <h3>My Tasks</h3>
                            <button className="icon-btn" onClick={() => setShowNewTask(!showNewTask)}>+</button>
                        </div>

                        {showNewTask && (
                            <form onSubmit={handleCreateTask} className="quick-task-form">
                                <input
                                    autoFocus
                                    placeholder="Task title..."
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                />
                            </form>
                        )}

                        <div className="task-list">
                            {tasks.filter(t => !t.completed).map(task => (
                                <TaskItem key={task.id} task={task} onToggle={handleToggleTask} />
                            ))}
                            {tasks.filter(t => t.completed).length > 0 && (
                                <details style={{ marginTop: '1rem' }}>
                                    <summary style={{ cursor: 'pointer', color: '#94a3b8', fontSize: '0.85rem' }}>
                                        Completed ({tasks.filter(t => t.completed).length})
                                    </summary>
                                    {tasks.filter(t => t.completed).map(task => (
                                        <TaskItem key={task.id} task={task} onToggle={handleToggleTask} />
                                    ))}
                                </details>
                            )}
                        </div>
                    </div>

                    <div className="sidebar-section">
                        <h3>Recent Activity</h3>
                        <ActivityFeed activities={activities.slice(0, 10)} />
                    </div>
                </div>

                {/* Main Content: Pipeline/Grid */}
                <div className="crm-main">
                    <div className="view-controls">
                        <div className="tabs">
                            <button
                                className={`tab ${view === 'pipeline' ? 'active' : ''}`}
                                onClick={() => setView('pipeline')}
                            >
                                Kanban Pipeline
                            </button>
                            <button
                                className={`tab ${view === 'list' ? 'active' : ''}`}
                                onClick={() => setView('list')}
                            >
                                List View
                            </button>
                        </div>
                    </div>

                    {view === 'pipeline' ? (
                        <div className="pipeline-container">
                            <PipelineView
                                leads={bdoLeads}
                                stages={['New', 'In Process', 'Qualified', 'Proposal', 'Negotiation']}
                                onLeadClick={(_lead: Lead) => { /* Open Drawer in future */ }}
                                onLeadMove={(id, stage) => {
                                    const lead = leads.find(l => l.id === id);
                                    if (lead) {
                                        onUpdateLead({ ...lead, stage: stage as any });
                                        crmService.addActivity({
                                            leadId: lead.id,
                                            type: 'status_change',
                                            content: `Moved ${lead.company} to ${stage}`,
                                            user: currentUser?.name || 'Me'
                                        });
                                        refreshCrmData();
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <DealTable
                            leads={bdoLeads}
                            onRowClick={(lead) => { /* Open Drawer in future */ }}
                        />
                    )}
                </div>

                {/* Right Sidebar: Tools */}
                <div className="crm-tools">
                    <div className="tool-card">
                        <h3>Quick Fee Calc</h3>
                        <FeeCalculator />
                    </div>
                </div>
            </div>

            <style>{`
                .bdo-crm-dashboard {
                    background: #f1f5f9;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                .crm-header {
                    background: white;
                    padding: 1rem 2rem;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .header-left h1 { margin: 0; font-size: 1.5rem; color: #1e293b; }
                .user-badge { background: #f1f5f9; padding: 0.25rem 0.75rem; border-radius: 99px; font-size: 0.85rem; color: #64748b; }
                .header-stats { display: flex; gap: 2rem; }
                .stat-item { display: flex; flex-direction: column; align-items: center; }
                .stat-item .label { font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; font-weight: 600; }
                .stat-item .value { font-size: 1.25rem; font-weight: 700; color: #3b82f6; }
                .stat-item.warning .value { color: #f59e0b; }
                
                .crm-grid {
                    display: grid;
                    grid-template-columns: 350px 1fr 300px;
                    gap: 1.5rem;
                    padding: 1.5rem;
                    flex: 1;
                    height: calc(100vh - 80px);
                }

                .crm-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    overflow-y: auto;
                }
                .sidebar-section {
                    background: white;
                    border-radius: 12px;
                    padding: 1.25rem;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
                .section-header h3 { margin: 0; font-size: 1rem; color: #475569; }
                .icon-btn { border: none; background: #eff6ff; color: #3b82f6; width: 24px; height: 24px; border-radius: 4px; cursor: pointer; display: flex; justify-content: center; align-items: center; }
                .icon-btn:hover { background: #dbeafe; }

                .quick-task-form input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 2px solid #3b82f6;
                    border-radius: 6px;
                    margin-bottom: 1rem;
                }

                .crm-main {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    overflow: hidden;
                }
                .view-controls { display: flex; justify-content: space-between; align-items: center; }
                .tabs { display: flex; gap: 0.5rem; background: whute; padding: 0.25rem; border-radius: 8px; }
                .tab { padding: 0.5rem 1rem; border: none; background: none; cursor: pointer; font-weight: 500; color: #64748b; border-radius: 6px; }
                .tab.active { background: white; color: #3b82f6; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
                .pipeline-container { flex: 1; overflow-x: auto; overflow-y: hidden; }

                .crm-tools {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .tool-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.25rem;
                    border: 1px solid #e2e8f0;
                }
                .tool-card h3 { margin: 0 0 1rem 0; font-size: 1rem; color: #475569; }
            `}</style>
        </div>
    );
};

