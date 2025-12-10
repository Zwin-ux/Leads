import React from 'react';

export const SkeletonLoader: React.FC = () => {
    return (
        <div className="skeleton-dashboard" style={{
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
            height: '100vh',
            background: '#f8fafc',
            animation: 'pulse 2s infinite ease-in-out'
        }}>
            {/* Header Skeleton */}
            <div style={{
                background: 'white',
                padding: '1rem 2rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: '80px'
            }}>
                <div style={{ width: '200px', height: '32px', background: '#e2e8f0', borderRadius: '8px' }}></div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ width: '100px', height: '40px', background: '#e2e8f0', borderRadius: '8px' }}></div>
                    <div style={{ width: '100px', height: '40px', background: '#e2e8f0', borderRadius: '8px' }}></div>
                </div>
            </div>

            {/* Grid Skeleton */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 350px',
                height: '100%',
                overflow: 'hidden'
            }}>
                {/* Kanban Skeleton */}
                <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', overflowX: 'auto' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{
                            flex: '0 0 280px',
                            background: '#f1f5f9',
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            padding: '1rem'
                        }}>
                            <div style={{ width: '50%', height: '20px', background: '#e2e8f0', borderRadius: '4px' }}></div>
                            <div style={{ height: '100px', background: 'white', borderRadius: '8px' }}></div>
                            <div style={{ height: '100px', background: 'white', borderRadius: '8px' }}></div>
                            <div style={{ height: '100px', background: 'white', borderRadius: '8px' }}></div>
                        </div>
                    ))}
                </div>

                {/* Sidebar Skeleton */}
                <div style={{
                    background: 'white',
                    borderLeft: '1px solid #e2e8f0',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem'
                }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0' }}></div>
                        <div style={{ width: '150px', height: '20px', background: '#e2e8f0', borderRadius: '4px' }}></div>
                    </div>
                    <div style={{ height: '200px', background: '#f8fafc', borderRadius: '12px' }}></div>
                    <div style={{ height: '200px', background: '#f8fafc', borderRadius: '12px' }}></div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.6; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};
