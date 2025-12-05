import React, { useState, useEffect } from 'react';
import type { Lead } from '@leads/shared';
import {
    searchLeads,
    getAvailableSources,
    type EnrichedLead,
    type SearchDepth,
    type DataSource
} from '../services/leadIntelligenceService';

export const LeadGenerator: React.FC<{ onAddLead: (lead: Lead) => void, onCancel: () => void }> = ({ onAddLead, onCancel }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('Riverside, CA');
    const [results, setResults] = useState<EnrichedLead[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // New: Depth selector and source info
    const [depth, setDepth] = useState<SearchDepth>('standard');
    const [usedSources, setUsedSources] = useState<DataSource[]>([]);
    const [searchTime, setSearchTime] = useState(0);
    const [availableSources, setAvailableSources] = useState<DataSource[]>([]);

    // Check what sources are configured
    useEffect(() => {
        setAvailableSources(getAvailableSources());
    }, []);

    const locations = [
        'Riverside, CA',
        'Los Angeles, CA',
        'San Diego, CA',
        'Orange County, CA',
        'Las Vegas, NV',
        'Phoenix, AZ',
        'Tucson, AZ',
        'Sacramento, CA',
        'San Francisco, CA',
        'Oakland, CA',
        'Fresno, CA',
        'San Bernardino, CA'
    ];

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        setSearched(true);
        setError(null);
        setIsDemoMode(false);

        try {
            const response = await searchLeads(searchQuery, location, depth);
            setResults(response.leads);
            setIsDemoMode(response.isDemoMode);
            setUsedSources(response.sources);
            setSearchTime(response.searchTime);
            if (response.error) {
                setError(response.error);
            }
        } catch (err) {
            console.error('Search failed:', err);
            setResults([]);
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
            email: business.contactEmail || 'info@example.com',
            phone: business.phone || '',
            company: business.company,
            businessName: business.legalName || business.company,
            industry: business.industry,
            city: business.city,
            stateOfInc: business.state,
            stage: 'New',
            dealStage: 'Prospect',
            loanProgram: business.sbaFit === 'Unknown' ? 'Unknown' : business.sbaFit === 'Both' ? '504' : business.sbaFit || 'Unknown',
            owner: 'Unassigned',
            lastContactDate: 'Never',
            notes: [{
                id: crypto.randomUUID(),
                content: `Lead Scout: ${business.legalName || business.company}
• Address: ${business.address}, ${business.city}, ${business.state}
• Industry: ${business.industry}
• Est. Revenue: ${business.estimatedRevenue || 'Unknown'}
• Est. Employees: ${business.estimatedEmployees || 'Unknown'}
• SBA Fit: ${business.sbaFit} - ${business.sbaFitReason}
• Lead Score: ${business.leadScore}/100
• Sources: ${business.sources.join(', ') || 'Demo'}
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

    const getConfidenceColor = (conf?: string) => {
        switch (conf) {
            case 'high': return '#22c55e';
            case 'medium': return '#f59e0b';
            case 'low': return '#ef4444';
            default: return '#94a3b8';
        }
    };

    return (
        <div className="lead-generator">
            <div className="generator-header">
                <button onClick={onCancel} className="back-btn">← Back</button>
                <h2>Lead Scout</h2>
                <span className="subtitle">Find SBA-eligible businesses</span>
            </div>

            <div className="search-section">
                {/* Source Status Banner */}
                {availableSources.length === 0 && (
                    <div style={{
                        padding: '0.75rem 1rem',
                        background: '#fefce8',
                        border: '1px solid #fde047',
                        borderRadius: '6px',
                        color: '#854d0e',
                        marginBottom: '1rem',
                        fontSize: '0.85rem'
                    }}>
                        <strong>Demo Mode</strong> — No API keys configured. Add VITE_GOOGLE_PLACES_API_KEY for real results.
                    </div>
                )}

                <div className="search-row">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for businesses (e.g. 'Machine Shops', 'Medical Clinics', 'Hotels')"
                        className="search-input"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="location-select"
                    >
                        {locations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                    <select
                        value={depth}
                        onChange={(e) => setDepth(e.target.value as SearchDepth)}
                        className="depth-select"
                        title="Search Depth"
                        style={{ minWidth: '100px' }}
                    >
                        <option value="quick">Quick</option>
                        <option value="standard">Standard</option>
                        <option value="deep">Deep</option>
                    </select>
                    <button
                        className="btn-primary search-btn"
                        onClick={handleSearch}
                        disabled={loading || !searchQuery.trim()}
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>

                <div className="quick-tags">
                    <span>Quick search:</span>
                    {['Machine Shops', 'Medical Clinics', 'Hotels/Motels', 'Auto Repair', 'Manufacturing', 'Dental Offices', 'Restaurants'].map(tag => (
                        <button
                            key={tag}
                            className="tag-btn"
                            onClick={() => {
                                setSearchQuery(tag);
                            }}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            <div className="results-section">
                {loading && (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Searching for {searchQuery} in {location}...</p>
                        <p className="loading-sub">Analyzing SBA eligibility</p>
                    </div>
                )}

                {/* Error Banner */}
                {!loading && error && (
                    <div className="error-banner" style={{
                        padding: '1rem',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#991b1b',
                        marginBottom: '1rem'
                    }}>
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {!loading && searched && results.length === 0 && !error && (
                    <div className="empty-state">
                        <p>No businesses found. Try a different search term or location.</p>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="results-grid">
                        {/* Demo Mode Banner */}
                        {isDemoMode && (
                            <div className="demo-banner" style={{
                                padding: '0.75rem 1rem',
                                background: '#fefce8',
                                border: '1px solid #fde047',
                                borderRadius: '6px',
                                color: '#854d0e',
                                marginBottom: '1rem',
                                fontSize: '0.875rem'
                            }}>
                                <strong>Sample Data</strong> — No API key configured. These are example leads for demonstration purposes.
                            </div>
                        )}
                        <div className="results-header">
                            <span>
                                Found {results.length} {isDemoMode ? 'sample' : ''} leads
                                {!isDemoMode && searchTime > 0 && (
                                    <span style={{ color: '#94a3b8', marginLeft: '0.5rem', fontWeight: 400 }}>
                                        ({(searchTime / 1000).toFixed(1)}s via {usedSources.join(' + ') || 'demo'})
                                    </span>
                                )}
                            </span>
                            <span className="confidence-legend">
                                <span style={{ color: '#22c55e' }}>● High</span>
                                <span style={{ color: '#f59e0b' }}>● Medium</span>
                                <span style={{ color: '#ef4444' }}>● Low</span>
                            </span>
                        </div>
                        {results.map(business => {
                            const sbaStyle = getSbaFitColor(business.sbaFit);
                            const isExpanded = expandedId === business.id;

                            return (
                                <div key={business.id} className={`result-card ${isExpanded ? 'expanded' : ''}`}>
                                    <div className="result-main">
                                        <div className="result-info">
                                            <div className="company-row">
                                                <h3>{business.company}</h3>
                                                <span
                                                    className="sba-badge"
                                                    style={{ background: sbaStyle.bg, color: sbaStyle.color }}
                                                >
                                                    SBA {sbaStyle.label}
                                                </span>
                                                <span
                                                    className="confidence-dot"
                                                    style={{ background: getConfidenceColor(business.confidence) }}
                                                    title={`${business.confidence} confidence`}
                                                />
                                            </div>
                                            {business.legalName && business.legalName !== business.company && (
                                                <p className="legal-name">Legal: {business.legalName}</p>
                                            )}
                                            <p className="contact-name">
                                                {business.contactName || 'Contact not found'}
                                                {business.contactRole && <span className="role"> · {business.contactRole}</span>}
                                            </p>
                                            <p className="contact-details">
                                                {business.address}
                                            </p>
                                            <p className="location">{business.city}, {business.state}</p>

                                            <div className="quick-stats">
                                                {business.estimatedRevenue && (
                                                    <span className="stat">{business.estimatedRevenue}</span>
                                                )}
                                                {business.estimatedEmployees && (
                                                    <span className="stat">{business.estimatedEmployees} emp</span>
                                                )}
                                                <span className="stat" style={{
                                                    background: business.leadScore >= 70 ? '#dcfce7' : business.leadScore >= 40 ? '#fefce8' : '#fee2e2',
                                                    color: business.leadScore >= 70 ? '#166534' : business.leadScore >= 40 ? '#854d0e' : '#991b1b'
                                                }}>
                                                    Score: {business.leadScore}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="result-actions">
                                            <button
                                                className="expand-btn"
                                                onClick={() => setExpandedId(isExpanded ? null : business.id)}
                                            >
                                                {isExpanded ? '▲ Less' : '▼ More'}
                                            </button>
                                            <button
                                                className="btn-primary add-btn"
                                                onClick={() => handleAddLead(business)}
                                            >
                                                + Add to CRM
                                            </button>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="result-details">
                                            <div className="detail-grid">
                                                <div className="detail-item">
                                                    <span className="label">Industry</span>
                                                    <span className="value">{business.industry}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Phone</span>
                                                    <span className="value">{business.phone || 'Unknown'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Website</span>
                                                    <span className="value">
                                                        {business.website ? (
                                                            <a href={business.website} target="_blank" rel="noopener noreferrer">
                                                                {business.website.replace('https://', '').replace('http://', '')}
                                                            </a>
                                                        ) : 'Unknown'}
                                                    </span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Est. Revenue</span>
                                                    <span className="value">{business.estimatedRevenue || 'Unknown'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Est. Employees</span>
                                                    <span className="value">{business.estimatedEmployees || 'Unknown'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Sources</span>
                                                    <span className="value">{business.sources.join(', ') || 'Demo'}</span>
                                                </div>
                                            </div>
                                            <div className="sba-analysis">
                                                <strong>SBA Fit:</strong> {business.sbaFitReason}
                                            </div>
                                            <div className="sos-link">
                                                <a
                                                    href={`https://bizfileonline.sos.ca.gov/search/business`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Verify on CA Secretary of State
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {!searched && (
                    <div className="empty-state">
                        <h3>Find Your Next Lead</h3>
                        <p>Search for SBA-eligible businesses in California, Nevada, or Arizona.</p>
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                            Depth: Quick (Google only) | Standard (Google + Yelp + AI) | Deep (All sources)
                        </p>
                    </div>
                )}
            </div>

            <style>{`
                .lead-generator {
                    padding: 0;
                    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .generator-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1.5rem 2rem;
                    background: rgba(255,255,255,0.05);
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .generator-header h2 {
                    color: white;
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 0;
                    background: linear-gradient(90deg, #22d3ee, #a78bfa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .generator-header .subtitle {
                    color: rgba(255,255,255,0.6);
                    font-size: 0.9rem;
                    margin-left: auto;
                }
                .back-btn {
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    cursor: pointer;
                    font-size: 0.9rem;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .back-btn:hover {
                    background: rgba(255,255,255,0.2);
                }
                .search-section {
                    background: rgba(255,255,255,0.95);
                    padding: 1.5rem 2rem;
                    margin: 1.5rem 2rem;
                    border-radius: 16px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                }
                .search-row {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                .search-input {
                    flex: 1;
                    padding: 0.875rem 1.25rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 1rem;
                    transition: all 0.2s;
                }
                .search-input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 4px rgba(59,130,246,0.1);
                }
                .location-select, .depth-select {
                    padding: 0.875rem 1rem;
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    font-size: 1rem;
                    background: white;
                    cursor: pointer;
                }
                .location-select {
                    min-width: 180px;
                }
                .search-btn {
                    padding: 0.875rem 2rem;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    border: none;
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px rgba(59,130,246,0.3);
                }
                .search-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(59,130,246,0.4);
                }
                .search-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .quick-tags {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    color: #64748b;
                    flex-wrap: wrap;
                }
                .tag-btn {
                    padding: 0.375rem 0.75rem;
                    background: #f1f5f9;
                    border: none;
                    border-radius: 16px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    transition: all 0.2s;
                }
                .tag-btn:hover {
                    background: #e0f2fe;
                    color: #0284c7;
                }
                .results-section {
                    flex: 1;
                    overflow-y: auto;
                }
                .results-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                    font-size: 0.9rem;
                    color: #64748b;
                }
                .confidence-legend {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.8rem;
                }
                .loading-state, .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem;
                    text-align: center;
                    color: #64748b;
                }
                .loading-sub {
                    font-size: 0.85rem;
                    opacity: 0.7;
                }
                .example-searches {
                    text-align: left;
                    margin-top: 1rem;
                    padding: 1rem;
                    background: #f8fafc;
                    border-radius: 8px;
                }
                .example-searches ul {
                    margin: 0.5rem 0 0 0;
                    padding-left: 1.5rem;
                }
                .example-searches li {
                    margin: 0.5rem 0;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid #e2e8f0;
                    border-top-color: var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 1rem;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .results-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    padding: 0 2rem 2rem;
                }
                .result-card {
                    background: white;
                    border-radius: 16px;
                    border: none;
                    transition: all 0.3s ease;
                    overflow: hidden;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                }
                .result-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 40px rgba(0,0,0,0.15);
                }
                .result-card.expanded {
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                }
                .result-main {
                    padding: 1.25rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .result-info h3 {
                    margin: 0;
                    color: var(--text-primary);
                    display: inline;
                }
                .company-row {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 0.5rem;
                }
                .sba-badge {
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                .confidence-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .legal-name {
                    font-size: 0.8rem;
                    color: #94a3b8;
                    margin: 0 0 0.25rem 0;
                    font-style: italic;
                }
                .contact-name {
                    font-weight: 500;
                    color: #475569;
                    margin: 0 0 0.25rem 0;
                }
                .contact-name .role {
                    color: #94a3b8;
                    font-weight: 400;
                }
                .contact-details, .location {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin: 0 0 0.25rem 0;
                }
                .quick-stats {
                    display: flex;
                    gap: 1rem;
                    margin-top: 0.5rem;
                }
                .stat {
                    font-size: 0.8rem;
                    color: #64748b;
                    background: #f8fafc;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                }
                .result-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    align-items: flex-end;
                }
                .expand-btn {
                    background: none;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    font-size: 0.8rem;
                    padding: 0.25rem 0.5rem;
                }
                .expand-btn:hover {
                    color: var(--primary);
                }
                .add-btn {
                    padding: 0.5rem 1rem;
                    white-space: nowrap;
                }
                .result-details {
                    padding: 1rem 1.25rem 1.25rem;
                    border-top: 1px solid #e2e8f0;
                    background: #f8fafc;
                }
                .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                .detail-item .label {
                    display: block;
                    font-size: 0.75rem;
                    color: #94a3b8;
                    text-transform: uppercase;
                    margin-bottom: 0.25rem;
                }
                .detail-item .value {
                    color: #334155;
                    font-size: 0.9rem;
                }
                .detail-item .value a {
                    color: var(--primary);
                }
                .sba-analysis {
                    background: white;
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    margin-bottom: 0.75rem;
                    border-left: 3px solid var(--primary);
                }
                .sos-link {
                    font-size: 0.85rem;
                }
                .sos-link a {
                    color: #64748b;
                    text-decoration: none;
                }
                .sos-link a:hover {
                    color: var(--primary);
                }
            `}</style>
        </div>
    );
};
