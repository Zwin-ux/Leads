import React from 'react';
import { Task } from '../../services/crmService';

interface TaskItemProps {
    task: Task;
    onToggle: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle }) => {
    const isOverdue = !task.completed && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

    return (
        <div className={`task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem',
                borderBottom: '1px solid #f1f5f9',
                gap: '0.75rem',
                background: isOverdue ? '#fef2f2' : 'white',
                opacity: task.completed ? 0.6 : 1
            }}
        >
            <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggle(task.id)}
                style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6'
                }}
            />
            <div style={{ flex: 1 }}>
                <div style={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: isOverdue ? '#ef4444' : '#1e293b'
                }}>
                    {task.title}
                </div>
                {task.description && (
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{task.description}</div>
                )}
            </div>
            <div style={{ textAlign: 'right' }}>
                <span style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    background: getPriorityColor(task.priority),
                    color: 'white',
                    fontWeight: 500
                }}>
                    {task.priority.toUpperCase()}
                </span>
            </div>
        </div>
    );
};

function getPriorityColor(priority: string) {
    switch (priority) {
        case 'high': return '#ef4444';
        case 'normal': return '#3b82f6';
        case 'low': return '#94a3b8';
        default: return '#94a3b8';
    }
}
