import React, { useState } from 'react';
import { authService, TEAM_MEMBERS } from '../services/authService';

export const DevRoleSwitcher: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const currentUser = authService.getCurrentUser();

    // Only show in dev mode (for now, assuming we always want it based on user request)
    // In a real app we might check process.env.NODE_ENV or a specific flag

    const handleSwitchUser = (email: string) => {
        const user = TEAM_MEMBERS.find(u => u.email === email);
        if (user) {
            authService.setCurrentUser(user);
            window.location.reload(); // Hard reload to reset app state with new user
        }
    };

    if (!isOpen) {
        return (
            <div
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    width: '30px',
                    height: '30px',
                    background: 'rgba(0,0,0,0.2)',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '12px',
                    zIndex: 9999,
                    border: '1px solid rgba(255,255,255,0.3)'
                }}
                title="Dev Mode: Switch Role"
            >
                ⚙️
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            background: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '10px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            width: '280px',
            maxHeight: '400px',
            overflowY: 'auto',
            fontSize: '12px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                <strong style={{ color: '#333' }}>Dev: Switch Role</strong>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                >
                    ✕
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {TEAM_MEMBERS.map(user => (
                    <button
                        key={user.email}
                        onClick={() => handleSwitchUser(user.email)}
                        style={{
                            textAlign: 'left',
                            padding: '6px 8px',
                            background: currentUser?.email === user.email ? '#e0f2fe' : 'transparent',
                            border: currentUser?.email === user.email ? '1px solid #bae6fd' : '1px solid transparent',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            color: '#333'
                        }}
                    >
                        <span style={{ fontWeight: 600 }}>{user.name}</span>
                        <span style={{ fontSize: '10px', color: '#666' }}>{user.role} • {user.title}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
