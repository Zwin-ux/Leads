import React, { useState } from 'react';
import type { Lead } from '@leads/shared';
import { openaiService, type BusinessResult } from '../services/openaiService';

export const LeadGenerator: React.FC<{ onAddLead: (lead: Lead) => void, onCancel: () => void }> = ({ onAddLead, onCancel }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('Riverside, CA');
    const [results, setResults] = useState<BusinessResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

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
        try {
            const businesses = await openaiService.searchBusinesses(searchQuery, location);
            setResults(businesses);
        } catch (err) {
            console.error('Search failed:', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLead = (business: BusinessResult) => {
        const newLead: Lead = {
            id: business.id || crypto.randomUUID(),
            firstName: business.firstName || 'Unknown',
            lastName: business.lastName || 'Contact',
            email: business.email || 'info@example.com',
            phone: business.phone || '',
            company: business.company,
            businessName: business.legalName || business.company,
            industry: business.industry,
            city: business.city,
            stateOfInc: business.stateOfInc,
            stage: 'New',
            dealStage: 'Prospecting',
            loanProgram: business.sbaFit === 'Unknown' ? 'Unknown' : business.sbaFit === 'Both' ? '504' : business.sbaFit || 'Unknown',
            owner: 'Unassigned',
            lastContactDate: 'Never',
            notes: [{
                id: crypto.randomUUID(),
                content: `AI Scout: ${business.legalName || business.company}
• Industry: ${business.industry}
• Est. Revenue: ${business.revenueRange || 'Unknown'}
• Employees: ${business.employeeRange || 'Unknown'}
• Years in Business: ${business.yearsInBusiness || 'Unknown'}
• SBA Fit: ${business.sbaFit} - ${business.sbaFitReason}
• Contact: ${business.firstName} ${business.lastName}, ${business.role}
• Source: AI Search (${business.confidence} confidence)`,
                timestamp: new Date().toISOString(),
                author: 'System',
                type: 'SystemEvent'
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
                <button onClick={onCancel} className="back-btn">← Back to Pipeline</button>
                <h2>🔍 Lead Scout AI</h2>
                <span className="subtitle">Find SBA-eligible businesses in CA, NV, AZ</span>
            </div>

            <div className="search-section">
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
                    <button
                        className="btn-primary search-btn"
                        onClick={handleSearch}
                        disabled={loading || !searchQuery.trim()}
                    >
                        {loading ? '🔄 Searching...' : '🔍 Find Leads'}
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
                        <p>✨ AI is searching for {searchQuery} in {location}...</p>
                        <p className="loading-sub">Analyzing SBA eligibility and generating contact info</p>
                    </div>
                )}

                {!loading && searched && results.length === 0 && (
                    <div className="empty-state">
                        <p>No businesses found. Try a different search term or location.</p>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="results-grid">
                        <div className="results-header">
                            <span>Found {results.length} potential leads</span>
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
                                                👤 {business.firstName} {business.lastName}
                                                {business.role && <span className="role"> • {business.role}</span>}
                                            </p>
                                            <p className="contact-details">
                                                📧 {business.email}
                                                {business.phone && <span> • 📞 {business.phone}</span>}
                                            </p>
                                            <p className="location">📍 {business.city}, {business.stateOfInc}</p>

                                            <div className="quick-stats">
                                                {business.revenueRange && (
                                                    <span className="stat">💰 {business.revenueRange}</span>
                                                )}
                                                {business.employeeRange && (
                                                    <span className="stat">👥 {business.employeeRange}</span>
                                                )}
                                                {business.yearsInBusiness && (
                                                    <span className="stat">📅 {business.yearsInBusiness}+ yrs</span>
                                                )}
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
                                                    <span className="label">NAICS Code</span>
                                                    <span className="value">{business.naicsCode || 'Unknown'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Website</span>
                                                    <span className="value">
                                                        {business.website ? (
                                                            <a href={business.website} target="_blank" rel="noopener noreferrer">
                                                                {business.website.replace('https://', '')}
                                                            </a>
                                                        ) : 'Unknown'}
                                                    </span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Est. Revenue</span>
                                                    <span className="value">{business.revenueRange || 'Unknown'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Employees</span>
                                                    <span className="value">{business.employeeRange || 'Unknown'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Years in Business</span>
                                                    <span className="value">{business.yearsInBusiness || 'Unknown'}</span>
                                                </div>
                                            </div>
                                            <div className="sba-analysis">
                                                <strong>🎯 SBA Fit Analysis:</strong> {business.sbaFitReason}
                                            </div>
                                            <div className="sos-link">
                                                <a
                                                    href={`https://bizfileonline.sos.ca.gov/search/business`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    🏛️ Verify on CA Secretary of State
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
                        <h3>🎯 Find Your Next Lead</h3>
                        <p>Search for SBA-eligible businesses in California, Nevada, or Arizona.</p>
                        <div className="example-searches">
                            <p><strong>Try searching for:</strong></p>
                            <ul>
                                <li>🏭 Manufacturing companies (great for 504 loans)</li>
                                <li>🏥 Medical and dental practices</li>
                                <li>🏨 Hotels and motels</li>
                                <li>🔧 Auto repair and service businesses</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .lead-generator {
                    padding: 2rem;
                    background: #f8fafc;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .generator-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                .generator-header .subtitle {
                    color: #64748b;
                    font-size: 0.9rem;
                    margin-left: auto;
                }
                .back-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 1rem;
                }
                .search-section {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    margin-bottom: 1.5rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }
                .search-row {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                .search-input {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 1rem;
                }
                .location-select {
                    padding: 0.75rem 1rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 1rem;
                    min-width: 180px;
                }
                .search-btn {
                    padding: 0.75rem 1.5rem;
                    white-space: nowrap;
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
                }
                .result-card {
                    background: white;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s;
                    overflow: hidden;
                }
                .result-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    border-color: var(--primary);
                }
                .result-card.expanded {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
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
