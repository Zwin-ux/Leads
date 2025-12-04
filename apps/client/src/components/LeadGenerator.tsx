import React, { useState } from 'react';
import type { Lead } from '@leads/shared';
import { openaiService } from '../services/openaiService';

interface BusinessResult {
    id: string;
    company: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    industry?: string;
    city?: string;
    stateOfInc?: string;
}

export const LeadGenerator: React.FC<{ onAddLead: (lead: Lead) => void, onCancel: () => void }> = ({ onAddLead, onCancel }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [location, setLocation] = useState('Riverside, CA');
    const [results, setResults] = useState<BusinessResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const locations = [
        'Riverside, CA',
        'Los Angeles, CA',
        'San Diego, CA',
        'Las Vegas, NV',
        'Phoenix, AZ',
        'Tucson, AZ',
        'Sacramento, CA',
        'San Francisco, CA',
        'Oakland, CA',
        'Fresno, CA'
    ];

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        setSearched(true);
        try {
            const businesses = await openaiService.searchBusinesses(searchQuery, location);
            setResults(businesses as BusinessResult[]);
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
            businessName: business.company,
            industry: business.industry,
            city: business.city,
            stateOfInc: business.stateOfInc,
            stage: 'New',
            dealStage: 'Prospecting',
            loanProgram: 'Unknown',
            owner: 'Unassigned',
            lastContactDate: 'Never',
            notes: [{
                id: crypto.randomUUID(),
                content: `AI Scout: Sourced from business search. Query: "${searchQuery}" in ${location}`,
                timestamp: new Date().toISOString(),
                author: 'System',
                type: 'SystemEvent'
            }]
        };
        onAddLead(newLead);
        // Remove from results after adding
        setResults(results.filter(r => r.id !== business.id));
    };

    return (
        <div className="lead-generator">
            <div className="generator-header">
                <button onClick={onCancel} className="back-btn">← Back to Pipeline</button>
                <h2>🔍 Lead Scout AI</h2>
            </div>

            <div className="search-section">
                <div className="search-row">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for businesses (e.g. 'Machine Shops', 'Medical Clinics', 'Restaurants')"
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
                    {['Machine Shops', 'Medical Clinics', 'Restaurants', 'Auto Repair', 'Manufacturing'].map(tag => (
                        <button
                            key={tag}
                            className="tag-btn"
                            onClick={() => {
                                setSearchQuery(tag);
                                setTimeout(handleSearch, 100);
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
                    </div>
                )}

                {!loading && searched && results.length === 0 && (
                    <div className="empty-state">
                        <p>No businesses found. Try a different search term or location.</p>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="results-grid">
                        {results.map(business => (
                            <div key={business.id} className="result-card">
                                <div className="result-info">
                                    <h3>{business.company}</h3>
                                    <p className="contact-name">{business.firstName} {business.lastName}</p>
                                    <p className="contact-details">
                                        📧 {business.email}
                                        {business.phone && <span> • 📞 {business.phone}</span>}
                                    </p>
                                    <p className="location">📍 {business.city}, {business.stateOfInc}</p>
                                </div>
                                <button
                                    className="btn-primary add-btn"
                                    onClick={() => handleAddLead(business)}
                                >
                                    + Add to CRM
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {!searched && (
                    <div className="empty-state">
                        <h3>🎯 Find Your Next Lead</h3>
                        <p>Search for businesses in California, Nevada, or Arizona to find potential clients for SBA loans.</p>
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
                }
                .generator-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
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
                .loading-state, .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem;
                    text-align: center;
                    color: #64748b;
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
                    display: grid;
                    gap: 1rem;
                }
                .result-card {
                    background: white;
                    padding: 1.25rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: all 0.2s;
                }
                .result-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    border-color: var(--primary);
                }
                .result-info h3 {
                    margin: 0 0 0.25rem 0;
                    color: var(--text-primary);
                }
                .contact-name {
                    font-weight: 500;
                    color: #475569;
                    margin: 0 0 0.25rem 0;
                }
                .contact-details, .location {
                    font-size: 0.875rem;
                    color: #64748b;
                    margin: 0 0 0.25rem 0;
                }
                .add-btn {
                    padding: 0.5rem 1rem;
                    white-space: nowrap;
                }
            `}</style>
        </div>
    );
};
