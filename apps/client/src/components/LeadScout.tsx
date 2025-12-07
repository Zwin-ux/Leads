import React, { useState, useEffect } from 'react';
import type { Lead } from '@leads/shared';
import {
    searchLeads,
    getAvailableSources,
    type EnrichedLead,
    type SearchDepth,
    type DataSource
} from '../services/leadIntelligenceService';
import { AdGenerator } from './AdGenerator';

export const LeadScout: React.FC<{ onAddLead: (lead: Lead) => void, onCancel: () => void }> = ({ onAddLead, onCancel }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('Riverside, CA');
    const [results, setResults] = useState<EnrichedLead[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedForAd, setSelectedForAd] = useState<EnrichedLead | null>(null);

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
        <div className="lead-scout-container">
            <div className="scout-header">
                <button onClick={onCancel} className="back-btn">← Back</button>
                <h2>Lead Scout Intelligence</h2>
                <span className="subtitle">Find SBA-eligible businesses</span>
            </div>

            <div className="search-section">
                {/* Source Status Banner */}
                {availableSources.length === 0 && (
                    <div style={{
                        padding: '0.75rem 1rem',
                        background: 'rgba(253, 224, 71, 0.1)',
                        border: '1px solid rgba(253, 224, 71, 0.2)',
                        borderRadius: '6px',
                        color: '#fef3c7',
                        marginBottom: '1rem',
                        fontSize: '0.85rem'
                    }}>
                        <strong>Demo Mode</strong> — No API keys configured. Add VITE_GOOGLE_PLACES_API_KEY for real results.
                    </div>
                )}

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'stretch',
                    marginBottom: '1rem'
                }}>
                    <input
                        type="text"
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for businesses (e.g. 'Machine Shops', 'Medical Clinics')"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <select
                        className="location-select"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    >
                        {locations.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                    <select
                        className="depth-select"
                        value={depth}
                        onChange={(e) => setDepth(e.target.value as SearchDepth)}
                        title="Search Depth"
                    >
                        <option value="quick">Quick</option>
                        <option value="standard">Standard</option>
                        <option value="deep">Deep</option>
                    </select>
                    <button
                        className="search-btn"
                        onClick={handleSearch}
                        disabled={loading || !searchQuery.trim()}
                    >
                        {loading ? '⏳ Searching...' : '🔍 Search'}
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
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        color: '#fecaca',
                        marginBottom: '1rem',
                        textAlign: 'center'
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
                                background: 'rgba(253, 224, 71, 0.1)',
                                border: '1px solid rgba(253, 224, 71, 0.2)',
                                borderRadius: '6px',
                                color: '#fef3c7',
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
                                                    background: business.leadScore >= 70 ? 'rgba(22, 101, 52, 0.2)' : business.leadScore >= 40 ? 'rgba(133, 77, 14, 0.2)' : 'rgba(153, 27, 27, 0.2)',
                                                    color: business.leadScore >= 70 ? '#86efac' : business.leadScore >= 40 ? '#fde047' : '#fca5a5'
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
                                                className="expand-btn"
                                                onClick={() => setSelectedForAd(business)}
                                                style={{ color: '#f472b6', fontWeight: 500 }}
                                            >
                                                ✨ Generate Ad
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
                .lead-scout-container {
                    padding: 0;
                    background: #0f172a;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 50;
                }
                .scout-header {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    padding: 1.5rem 3rem;
                    background: rgba(15, 23, 42, 0.8);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                .scout-header h2 {
                    color: white;
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0;
                    letter-spacing: -0.02em;
                    background: linear-gradient(135deg, white 0%, #94a3b8 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .scout-header .subtitle {
                    color: #64748b;
                    font-size: 0.9rem;
                    font-weight: 500;
                    margin-left: auto;
                    padding: 0.5rem 1rem;
                    background: rgba(255,255,255,0.03);
                    border-radius: 99px;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .back-btn {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #e2e8f0;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 500;
                    padding: 0.6rem 1.2rem;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }
                .back-btn:hover {
                    background: rgba(255,255,255,0.08);
                    border-color: rgba(255,255,255,0.2);
                    transform: translateX(-2px);
                }
                .search-section {
                    background: rgba(30, 41, 59, 0.4);
                    padding: 2rem;
                    margin: 2rem auto;
                    width: 90%;
                    max-width: 1200px;
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.05);
                    box-shadow: 0 0 0 1px rgba(0,0,0,0.2), 0 20px 40px -10px rgba(0,0,0,0.3);
                }
                .search-input {
                    flex: 1;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: white;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    transition: all 0.2s;
                }
                .search-input:focus {
                    background: rgba(15, 23, 42, 0.9);
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
                }
                .location-select, .depth-select {
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #e2e8f0;
                    padding: 0 1.2rem;
                    border-radius: 12px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    min-width: 150px;
                }
                .location-select:hover, .depth-select:hover {
                    border-color: rgba(255,255,255,0.2);
                    background: rgba(15, 23, 42, 0.8);
                }
                .search-btn {
                    padding: 0 2.5rem;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
                    transition: all 0.2s;
                }
                .search-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
                }
                .search-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .quick-tags {
                    margin-top: 1rem;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    align-items: center;
                }
                .quick-tags span { color: #64748b; font-size: 0.9rem; }
                .tag-btn {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.05);
                    color: #94a3b8;
                    border-radius: 8px;
                    padding: 0.5rem 1rem;
                    font-weight: 500;
                    letter-spacing: 0.02em;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .tag-btn:hover {
                    background: rgba(59, 130, 246, 0.1);
                    border-color: rgba(59, 130, 246, 0.2);
                    color: #60a5fa;
                }
                /* Results */
                .results-section {
                    flex: 1;
                    overflow-y: auto;
                    padding-bottom: 2rem;
                }
                .results-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    color: #94a3b8;
                    font-size: 0.9rem;
                    padding: 0 2rem;
                    max-width: 1600px;
                    margin-left: auto;
                    margin-right: auto;
                }
                .results-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
                    gap: 1.5rem;
                    padding: 0 3rem 3rem;
                    max-width: 1600px;
                    margin: 0 auto;
                }
                .result-card {
                    background: rgba(30, 41, 59, 0.4);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 16px;
                    overflow: hidden;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(4px);
                    display: flex;
                    flex-direction: column;
                }
                .result-card:hover {
                    transform: translateY(-4px);
                    background: rgba(30, 41, 59, 0.6);
                    border-color: rgba(255,255,255,0.1);
                    box-shadow: 0 20px 40px -5px rgba(0,0,0,0.4);
                }
                .result-main {
                    padding: 1.5rem;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }
                .result-info { flex: 1; }
                .result-card h3 {
                    color: #f1f5f9;
                    font-size: 1.1rem;
                    line-height: 1.4;
                    margin-right: 0.5rem;
                    margin-top: 0;
                }
                .company-row {
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
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
                .contact-name {
                    color: #e2e8f0;
                    margin: 0.25rem 0;
                    font-weight: 500;
                }
                .contact-details {
                    color: #94a3b8;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                }
                .quick-stats {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-top: 1rem;
                }
                .stat {
                    background: rgba(15, 23, 42, 0.5);
                    border: 1px solid rgba(255,255,255,0.05);
                    color: #cbd5e1;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.75rem;
                }
                .result-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.5rem;
                    margin-top: 1.5rem;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    padding-top: 1rem;
                }
                .expand-btn {
                    background: transparent;
                    border: none;
                    color: #64748b;
                    font-size: 0.8rem;
                    padding: 0.5rem;
                    cursor: pointer;
                }
                .expand-btn:hover {
                    color: #f1f5f9;
                    background: rgba(255,255,255,0.05);
                    border-radius: 6px;
                }
                .add-btn {
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .add-btn:hover { background: #2563eb; }
                .result-details {
                    background: rgba(15, 23, 42, 0.5);
                    border-top: 1px solid rgba(255,255,255,0.05);
                    color: #cbd5e1;
                    padding: 1.5rem;
                }
                .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
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
                    color: #f1f5f9;
                    font-size: 0.9rem;
                }
                .detail-item .value a { color: #3b82f6; }
                .sba-analysis {
                    background: rgba(30, 41, 59, 0.5);
                    border-left: 3px solid #3b82f6;
                    color: #e2e8f0;
                    padding: 1rem;
                    border-radius: 0 8px 8px 0;
                    margin-bottom: 1rem;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                .sos-link a { color: #94a3b8; font-size: 0.85rem; text-decoration: none; }
                .sos-link a:hover { color: #3b82f6; text-decoration: underline; }

                .loading-state, .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 4rem;
                    text-align: center;
                    color: #94a3b8;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(255,255,255,0.1);
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 1rem;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            {/* Same Ad Generator Modal */}
            {selectedForAd && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: '#0f172a',
                    zIndex: 2000,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: '1rem 2rem', background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center' }}>
                        <button
                            onClick={() => setSelectedForAd(null)}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            ← Back to Results
                        </button>
                    </div>
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <AdGenerator
                            onBack={() => setSelectedForAd(null)}
                            initialData={{
                                targetBusiness: {
                                    name: selectedForAd.company,
                                    industry: selectedForAd.industry,
                                    city: selectedForAd.city,
                                    state: selectedForAd.state
                                },
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
