import { Lead } from "@leads/shared";

export interface Task {
    id: string;
    leadId?: string;
    title: string;
    description?: string;
    dueDate: string;
    completed: boolean;
    type: 'call' | 'email' | 'meeting' | 'todo';
    priority: 'high' | 'normal' | 'low';
}

export interface Activity {
    id: string;
    leadId: string;
    type: 'note' | 'status_change' | 'email' | 'call' | 'task_completion';
    content: string;
    timestamp: string;
    user: string;
}

class CrmService {
    private tasks: Task[] = [];
    private activities: Activity[] = [];

    constructor() {
        this.load();

        // Seed if empty
        if (this.tasks.length === 0) {
            this.seed();
        }
    }

    private load() {
        try {
            const storedTasks = localStorage.getItem('leads_crm_tasks');
            const storedActivities = localStorage.getItem('leads_crm_activities');
            this.tasks = storedTasks ? JSON.parse(storedTasks) : [];
            this.activities = storedActivities ? JSON.parse(storedActivities) : [];
        } catch (e) {
            console.error("Failed to load CRM data", e);
            this.tasks = [];
            this.activities = [];
        }
    }

    private save() {
        localStorage.setItem('leads_crm_tasks', JSON.stringify(this.tasks));
        localStorage.setItem('leads_crm_activities', JSON.stringify(this.activities));
    }

    private seed() {
        // Create some dummy tasks for standard leads
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        this.tasks = [
            { id: '1', title: 'Call Acme Corp about tax returns', leadId: 'lead_1', dueDate: today, completed: false, type: 'call', priority: 'high' },
            { id: '2', title: 'Send term sheet to Beta Inc', leadId: 'lead_2', dueDate: today, completed: false, type: 'email', priority: 'high' },
            { id: '3', title: 'Follow up on missing insurance', leadId: 'lead_3', dueDate: tomorrow, completed: false, type: 'todo', priority: 'normal' },
            { id: '4', title: 'Lunch meeting with Referral Partner', dueDate: tomorrow, completed: false, type: 'meeting', priority: 'normal' },
        ];
        this.save();
    }

    getTasks(filter: 'all' | 'pending' | 'completed' = 'all'): Task[] {
        if (filter === 'all') return this.tasks;
        return this.tasks.filter(t => filter === 'pending' ? !t.completed : t.completed);
    }

    addTask(task: Omit<Task, 'id' | 'completed'>): Task {
        const newTask: Task = {
            ...task,
            id: crypto.randomUUID(),
            completed: false
        };
        this.tasks.push(newTask);
        this.save();
        return newTask;
    }

    toggleTask(taskId: string): Task | null {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;

            // Log activity if completed
            if (task.completed && task.leadId) {
                this.addActivity({
                    leadId: task.leadId,
                    type: 'task_completion',
                    content: `Completed task: ${task.title}`,
                    user: 'Me' // In a real app we'd pass the user
                });
            }

            this.save();
            return task;
        }
        return null;
    }

    getActivities(leadId?: string): Activity[] {
        if (!leadId) return this.activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return this.activities
            .filter(a => a.leadId === leadId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    addActivity(activity: Omit<Activity, 'id' | 'timestamp'>): Activity {
        const newActivity: Activity = {
            ...activity,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString()
        };
        this.activities.push(newActivity);
        this.save();
        return newActivity;
    }
}

export const crmService = new CrmService();
