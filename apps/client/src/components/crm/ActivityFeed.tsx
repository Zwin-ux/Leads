import React from 'react';
import { Activity } from '../../services/crmService';

interface ActivityFeedProps {
    activities: Activity[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
    return (
        <div className="activity-feed" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {activities.length === 0 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                    No recent activity
                </div>
            )}
            {activities.map(activity => (
                <div key={activity.id} className="activity-item" style={{
                    padding: '0.75rem',
                    borderLeft: '2px solid #e2e8f0',
                    marginLeft: '1rem',
                    position: 'relative'
                }}>
                    <div className="dot" style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: getActivityColor(activity.type),
                        position: 'absolute',
                        left: '-6px',
                        top: '1.25rem',
                        border: '2px solid white'
                    }} />
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        {new Date(activity.timestamp).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                        })}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#334155' }}>
                        {activity.content}
                    </div>
                </div>
            ))}
        </div>
    );
};

function getActivityColor(type: Activity['type']) {
    switch (type) {
        case 'note': return '#f59e0b';
        case 'status_change': return '#3b82f6';
        case 'email': return '#8b5cf6';
        case 'call': return '#22c55e';
        case 'task_completion': return '#10b981';
        default: return '#94a3b8';
    }
}
