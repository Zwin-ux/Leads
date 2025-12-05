import React, { useState, useEffect } from 'react';
import type { Lead } from '@leads/shared';
import {
    searchLeads,
    getAvailableSources,
    type EnrichedLead,
    type SearchDepth,
    type DataSource
} from '../services/leadIntelligenceService';

export const LeadScout: React.FC<{ onAddLead: (lead: Lead) => void, onCancel: () => void }> = ({ onAddLead, onCancel }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('Riverside, CA');
    const [results, setResults] = useState<EnrichedLead[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [depth, setDepth] = useState<SearchDepth>('standard');
    const [availableSources, setAvailableSources] = useState<DataSource[]>([]);
    const [searchTime, setSearchTime] = useState(0);

    useEffect(() => {
        setAvailableSources(getAvailableSources());
    }, []);

    const locations = [
        'Riverside, CA', 'Los Angeles, CA', 'San Diego, CA', 'Orange County, CA',
        'Las Vegas, NV', 'Phoenix, AZ', 'San Bernardino, CA'
    ];

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        setSearched(true);
        setError(null);
        setResults([]);

        try {
            const response = await searchLeads(searchQuery, location, depth);
            setResults(response.leads);
            setSearchTime(response.searchTime);
            if (response.error) setError(response.error);
        } catch (err) {
            console.error('Search failed:', err);
            setError('Unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleAddLead = (business: EnrichedLead) => {
        const newLead: Lead = {
            id: business.id || crypto.randomUUID(),
            firstName: business.contactName?.split(' ')[0] || 'Unknown',
            lastName: business.contactName?.split(' ').slice(1).join(' ') || 'Contact',
            email: business.contactEmail || business.hunterEmail || 'info@example.com',
            phone: business.phone || '',
            company: business.company,
            businessName: business.legalName || business.company,
            industry: business.industry,
            city: business.city,
            stateOfInc: business.state,
            stage: 'New',
            dealStage: undefined,
            loanProgram: business.sbaFit === 'Unknown' ? 'Unknown' : business.sbaFit === 'Both' ? '504' : business.sbaFit || 'Unknown',
            owner: 'Unassigned',
            lastContactDate: new Date().toISOString(),
            notes: [{
                id: crypto.randomUUID(),
                content: `Lead Scout: ${business.legalName || business.company}
• Address: ${business.address}, ${business.city}, ${business.state}
• Industry: ${business.industry}
• Est. Revenue: ${business.estimatedRevenue || 'Unknown'}
• Est. Employees: ${business.estimatedEmployees || 'Unknown'}
• SBA Fit: ${business.sbaFit} - ${business.sbaFitReason}
• Lead Score: ${business.leadScore}/100
• Sources: ${business.sources.join(', ')}
• SOS Status: ${business.sosStatus || 'Not Verified'}
• Confidence: ${business.confidence}`,
                timestamp: new Date().toISOString(),
                author: 'System',
                type: 'SystemEvent',
                context: 'System'
            }]
        };
        onAddLead(newLead);
        setResults(results.filter(r => r.id !== business.id));
    };

    const getSbaFitColor = (fit?: string) => {
        switch (fit) {
            case '504': return { bg: '#dcfce7', color: '#166534', label: '504' };
            case '7a': return { bg: '#dbeafe', color: '#1e40af', label: '7a' };
            case 'Both': return { bg: '#fef3c7', color: '#92400e', label: '504/7a' };
            default: return { bg: '#f1f5f9', color: '#475569', label: '?' };
        }
    };

    return (
        <div className="lead-scout">
            {/* Hero Section */}
            <div className="scout-hero">
                <div className="hero-content">
                    <button onClick={onCancel} className="back-link">← Back to Dashboard</button>
                    <h1>Lead Scout Intelligence</h1>
                    <p>Find, verify, and enrich high-value business leads.</p>

                    <div className="search-bar-container">
                        <div className="search-input-group">
                            <span className="icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search businesses (e.g., 'Machine Shops', 'Dental Clinics')"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="location-group">
                            <span className="icon">📍</span>
                            <select value={location} onChange={(e) => setLocation(e.target.value)}>
                                {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                            </select>
                        </div>
                        <button
                            className="search-button"
                            onClick={handleSearch}
                            disabled={loading}
                        >
                            {loading ? 'Scouting...' : 'Scout Market'}
                        </button>
                    </div>

                    <div className="search-options">
                        <label className="depth-toggle">
                            <span>Analysis Depth:</span>
                            <select value={depth} onChange={(e) => setDepth(e.target.value as SearchDepth)}>
                                <option value="quick">Quick (Google Only)</option>
                                <option value="standard">Standard (AI + SOS)</option>
                                <option value="deep">Deep (Full Enrichment)</option>
                            </select>
                        </label>
                        <div className="source-badges">
                            {availableSources.includes('google_places') && <span className="badge google">Google</span>}
                            {availableSources.includes('sos_api') && <span className="badge sos">CA SOS</span>}
                            {availableSources.includes('hunter_io') && <span className="badge hunter">Hunter</span>}
                            {availableSources.includes('ai_enriched') && <span className="badge ai">OpenAI</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="results-container">
                {loading && (
                    <div className="loading-state">
                        <div className="radar-spinner"></div>
                        <h3>Scanning Market...</h3>
                        <p>Analyzing SBA eligibility and verifying entities.</p>
                    </div>
                )}

                {error && (
                    <div className="error-message" style={{ textAlign: 'center', color: '#ef4444', marginBottom: '1rem' }}>
                        ⚠️ {error}
                    </div>
                )}

                {!loading && searched && results.length === 0 && (
                    <div className="empty-state">
                        <h3>No Leads Found</h3>
                        <p>Try adjusting your search terms or location.</p>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <>
                        <div className="results-meta">
                            <span>Found {results.length} leads in {(searchTime / 1000).toFixed(1)}s</span>
                        </div>
                        <div className="leads-grid">
                            {results.map(lead => {
                                const sbaStyle = getSbaFitColor(lead.sbaFit);
                                const isExpanded = expandedId === lead.id;

                                return (
                                    <div key={lead.id} className={`lead-card ${isExpanded ? 'expanded' : ''}`}>
                                        <div className="card-header">
                                            <div className="header-top">
                                                <span className="sba-tag" style={{ background: sbaStyle.bg, color: sbaStyle.color }}>
                                                    SBA {sbaStyle.label}
                                                </span>
                                                <span className="score-badge" title="Lead Score">
                                                    {lead.leadScore}
                                                </span>
                                            </div>
                                            <h3>{lead.company}</h3>
                                            <p className="industry">{lead.industry}</p>
                                        </div>

                                        <div className="card-body">
                                            <div className="info-row">
                                                <span className="label">Location</span>
                                                <span className="value">{lead.city}, {lead.state}</span>
                                            </div>
                                            <div className="info-row">
                                                <span className="label">Revenue</span>
                                                <span className="value">{lead.estimatedRevenue || 'N/A'}</span>
                                            </div>

                                            {/* Verification Badges */}
                                            <div className="verification-row">
                                                {lead.sosStatus === 'Active' && (
                                                    <span className="verified-badge sos" title={`Entity: ${lead.sosEntityNumber}`}>
                                                        ✅ SOS Active
                                                    </span>
                                                )}
                                                {lead.hunterEmail && (
                                                    <span className="verified-badge hunter" title="Email Found">
                                                        📧 Email Found
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="card-actions">
                                            <button
                                                className="details-btn"
                                                onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                                            >
                                                {isExpanded ? 'Hide Details' : 'View Details'}
                                            </button>
                                            <button
                                                className="add-btn"
                                                onClick={() => handleAddLead(lead)}
                                            >
                                                + Add Lead
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <div className="card-details">
                                                <div className="detail-section">
                                                    <h4>Analysis</h4>
                                                    <p>{lead.sbaFitReason}</p>
                                                </div>
                                                <div className="detail-section">
                                                    <h4>Contact Info</h4>
                                                    {lead.contactName && <p><strong>Name:</strong> {lead.contactName}</p>}
                                                    {lead.contactRole && <p><strong>Role:</strong> {lead.contactRole}</p>}
                                                    {lead.hunterEmail && <p><strong>Email:</strong> {lead.hunterEmail}</p>}
                                                    {lead.phone && <p><strong>Phone:</strong> {lead.phone}</p>}
                                                    {lead.website && (
                                                        <a href={lead.website} target="_blank" rel="noreferrer" className="website-link">
                                                            Visit Website ↗
                                                        </a>
                                                    )}
                                                </div>
                                                {lead.sosEntityNumber && (
                                                    <div className="detail-section">
                                                        <h4>Legal Entity</h4>
                                                        <p><strong>Status:</strong> {lead.sosStatus}</p>
                                                        <p><strong>Entity #:</strong> {lead.sosEntityNumber}</p>
                                                        {lead.legalName && <p><strong>Legal Name:</strong> {lead.legalName}</p>}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            <style>{`
                .lead-scout {
                    min-height: 100vh;
                    background: #f8fafc;
                    font-family: 'Inter', sans-serif;
                }
                .scout-hero {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    color: white;
                    padding: 3rem 2rem 4rem;
                    text-align: center;
                }
                .hero-content {
                    max-width: 800px;
                    margin: 0 auto;
                }
                .back-link {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                }
                .back-link:hover { color: white; }
                .scout-hero h1 {
                    font-size: 2.5rem;
                    margin: 0 0 0.5rem;
                    background: linear-gradient(to right, #60a5fa, #a78bfa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .scout-hero p {
                    color: #cbd5e1;
                    margin-bottom: 2rem;
                }
                .search-bar-container {
                    background: white;
                    padding: 0.5rem;
                    border-radius: 12px;
                    display: flex;
                    gap: 0.5rem;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }
                .search-input-group, .location-group {
                    display: flex;
                    align-items: center;
                    background: #f1f5f9;
                    border-radius: 8px;
                    padding: 0 1rem;
                    flex: 1;
                }
                .search-input-group input, .location-group select {
                    border: none;
                    background: transparent;
                    padding: 1rem;
                    font-size: 1rem;
                    width: 100%;
                    outline: none;
                }
                .location-group { flex: 0 0 200px; }
                .search-button {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 0 2rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .search-button:hover { background: #2563eb; }
                .search-button:disabled { background: #94a3b8; cursor: not-allowed; }
                
                .search-options {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 1.5rem;
                    color: #94a3b8;
                    font-size: 0.9rem;
                }
                .depth-toggle select {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    margin-left: 0.5rem;
                }
                .source-badges { display: flex; gap: 0.5rem; }
                .badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .badge.google { background: #e0f2fe; color: #0369a1; }
                .badge.sos { background: #dcfce7; color: #15803d; }
                .badge.hunter { background: #ffedd5; color: #c2410c; }
                .badge.ai { background: #f3e8ff; color: #7e22ce; }

                .results-container {
                    max-width: 1200px;
                    margin: -2rem auto 2rem;
                    padding: 0 2rem;
                    position: relative;
                    z-index: 10;
                }
                .leads-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .lead-card {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    transition: transform 0.2s, box-shadow 0.2s;
                    display: flex;
                    flex-direction: column;
                }
                .lead-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                }
                .card-header { margin-bottom: 1rem; }
                .header-top { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
                .sba-tag {
                    font-size: 0.75rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-weight: 600;
                }
                .score-badge {
                    background: #f1f5f9;
                    color: #475569;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 700;
                }
                .lead-card h3 { margin: 0; font-size: 1.1rem; color: #1e293b; }
                .industry { margin: 0.25rem 0 0; font-size: 0.85rem; color: #64748b; }
                
                .card-body { flex: 1; }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                    color: #334155;
                }
                .info-row .label { color: #94a3b8; }
                
                .verification-row {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1rem;
                    flex-wrap: wrap;
                }
                .verified-badge {
                    font-size: 0.75rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    border: 1px solid;
                }
                .verified-badge.sos { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
                .verified-badge.hunter { background: #fff7ed; border-color: #fed7aa; color: #9a3412; }

                .card-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 1.5rem;
                }
                .details-btn, .add-btn {
                    flex: 1;
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                }
                .details-btn {
                    background: white;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                }
                .details-btn:hover { background: #f8fafc; color: #334155; }
                .add-btn {
                    background: #3b82f6;
                    border: none;
                    color: white;
                }
                .add-btn:hover { background: #2563eb; }

                .card-details {
                    margin-top: 1.5rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid #e2e8f0;
                    font-size: 0.9rem;
                }
                .detail-section { margin-bottom: 1rem; }
                .detail-section h4 {
                    margin: 0 0 0.5rem;
                    color: #475569;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                }
                .detail-section p { margin: 0.25rem 0; color: #334155; }
                .website-link {
                    display: inline-block;
                    margin-top: 0.5rem;
                    color: #3b82f6;
                    text-decoration: none;
                }
                .website-link:hover { text-decoration: underline; }

                .loading-state, .empty-state {
                    text-align: center;
                    padding: 4rem;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                }
                .radar-spinner {
                    width: 60px;
                    height: 60px;
                    border: 4px solid #e2e8f0;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    margin: 0 auto 1.5rem;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};
