import React, { useState, useEffect } from 'react';
import { integrationService, type Integration } from '../services/integrationService';

export const IntegrationsPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'All' | 'Lending' | 'CRM' | 'Data'>('All');

    // Modal state
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setIntegrations(integrationService.getAll());
    }, []);

    const filteredIntegrations = integrations.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'All' || item.category === activeTab || (activeTab === 'Data' && item.category === ' Infrastructure');
        return matchesSearch && matchesTab;
    });

    const handleConnectClick = (integration: Integration) => {
        setSelectedIntegration(integration);
        setApiKey('');
    };

    const handleConfirmConnect = async () => {
        if (!selectedIntegration) return;
        setLoading(true);
        try {
            await integrationService.connect(selectedIntegration.id, { apiKey });
            setIntegrations(integrationService.getAll());
            setSelectedIntegration(null);
        } catch (err) {
            console.error(err);
            alert('Failed to connect');
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async (id: string) => {
        if (!window.confirm('Are you sure you want to disconnect this integration?')) return;
        try {
            await integrationService.disconnect(id);
            setIntegrations(integrationService.getAll());
        } catch (err) {
            console.error(err);
            alert('Failed to disconnect');
        }
    };

    return (
        <div className="integrations-panel" style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
            <header style={{ marginBottom: '2rem' }}>
                <button onClick={onBack} className="back-btn" style={{ marginBottom: '1rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ← Back to Dashboard
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>Integrations</h1>
                        <p style={{ color: '#64748b' }}>Connect and manage third-party tools and services.</p>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search integrations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '0.75rem 1rem',
                                paddingLeft: '2.5rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                width: '300px',
                                fontSize: '0.9rem'
                            }}
                        />
                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1px' }}>
                {(['All', 'Lending', 'CRM', 'Data'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                            color: activeTab === tab ? '#3b82f6' : '#64748b',
                            fontWeight: activeTab === tab ? 600 : 500,
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="integrations-grid">
                {filteredIntegrations.map(integration => (
                    <div key={integration.id} className="integration-card">
                        <div className="card-top">
                            <div className="icon-wrapper" style={{ background: integration.iconColor }}>
                                {integration.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className={`status-pill ${integration.status}`}>
                                {integration.status === 'connected' ? '● Connected' : '○ Available'}
                            </div>
                        </div>
                        <h3>{integration.name}</h3>
                        <p>{integration.description}</p>
                        <div className="card-actions">
                            {integration.status === 'connected' ? (
                                <button className="btn-manage" onClick={() => handleDisconnect(integration.id)}>Disconnect</button>
                            ) : (
                                <button className="btn-connect" onClick={() => handleConnectClick(integration)}>Connect</button>
                            )}
                            <span className="category-tag">{integration.category}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Connection Modal */}
            {selectedIntegration && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <h2>Connect {selectedIntegration.name}</h2>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                            Enter your API Key or credentials to enable this integration.
                        </p>
                        <div className="form-group">
                            <label>API Key / Client ID</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder={`Enter ${selectedIntegration.name} Key...`}
                                autoFocus
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setSelectedIntegration(null)} disabled={loading}>Cancel</button>
                            <button className="btn-primary" onClick={handleConfirmConnect} disabled={!apiKey || loading}>
                                {loading ? 'Connecting...' : 'Connect Service'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .integrations-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .integration-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                }
                .integration-card:hover {
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                    border-color: #cbd5e1;
                }
                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                }
                .icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 700;
                    font-size: 1.1rem;
                }
                .status-pill {
                    font-size: 0.75rem;
                    padding: 0.25rem 0.75rem;
                    border-radius: 999px;
                    font-weight: 500;
                }
                .status-pill.connected {
                    background: #dcfce7;
                    color: #166534;
                }
                .status-pill.disconnected {
                    background: #f1f5f9;
                    color: #64748b;
                }
                .integration-card h3 {
                    margin: 0 0 0.5rem 0;
                    font-size: 1.1rem;
                    color: #1e293b;
                }
                .integration-card p {
                    margin: 0 0 1.5rem 0;
                    color: #64748b;
                    font-size: 0.9rem;
                    line-height: 1.5;
                    flex: 1;
                }
                .card-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid #f1f5f9;
                    padding-top: 1rem;
                }
                .btn-connect {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                    font-size: 0.9rem;
                }
                .btn-connect:hover {
                    background: #2563eb;
                }
                .btn-manage {
                    background: white;
                    color: #ef4444;
                    border: 1px solid #fecaca;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                    font-size: 0.9rem;
                }
                .btn-manage:hover {
                    background: #fef2f2;
                }
                .category-tag {
                    font-size: 0.75rem;
                    color: #94a3b8;
                }
                .modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 100;
                    backdrop-filter: blur(4px);
                }
                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 12px;
                    width: 400px;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }
                .modal-content h2 { margin-top: 0; }
                .form-group { margin-bottom: 1.5rem; }
                .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #475569; }
                .form-group input { 
                    width: 100%; 
                    padding: 0.75rem; 
                    border: 1px solid #e2e8f0; 
                    border-radius: 6px;
                    font-size: 1rem;
                }
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }
                .btn-primary {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
                .btn-secondary {
                    background: white;
                    color: #64748b;
                    border: 1px solid #e2e8f0;
                    padding: 0.75rem 1.5rem;
                    border-radius: 6px;
                    cursor: pointer;
                }
                .btn-secondary:hover { background: #f8fafc; }
            `}</style>
        </div>
    );
};
