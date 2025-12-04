import React, { useState } from 'react';
import type { Lead } from '@leads/shared';

interface PlaceResult {
    id: string;
    name: string;
    address: string;
    rating: number;
    user_ratings_total: number;
    types: string[];
    website?: string;
    // AI Inferred Fields
    is504Likely: boolean;
    growthSignal: string;
}

export const LeadGenerator: React.FC<{ onAddLead: (lead: Lead) => void, onCancel: () => void }> = ({ onAddLead, onCancel }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<PlaceResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResults([]);

        try {
            // Simulate API latency
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mock Results based on query (Simulation Mode)
            const mockResults: PlaceResult[] = [
                {
                    id: 'p1',
                    name: 'Riverside Precision Machine',
                    address: '1234 Industrial Ave, Riverside, CA',
                    rating: 4.8,
                    user_ratings_total: 42,
                    types: ['machine_shop', 'manufacturing'],
                    website: 'https://riversideprecision.com',
                    is504Likely: true,
                    growthSignal: 'Hiring for 3 roles'
                },
                {
                    id: 'p2',
                    name: 'Inland Empire Metal Works',
                    address: '5678 Commerce Way, Ontario, CA',
                    rating: 4.5,
                    user_ratings_total: 18,
                    types: ['metal_fabricator', 'point_of_interest'],
                    is504Likely: true,
                    growthSignal: 'High review velocity'
                },
                {
                    id: 'p3',
                    name: 'TechFlow Systems',
                    address: '900 Innovation Dr, Irvine, CA',
                    rating: 4.2,
                    user_ratings_total: 156,
                    types: ['electronics_manufacturer'],
                    website: 'https://techflow.io',
                    is504Likely: false, // Leased office likely
                    growthSignal: 'Series B Funding News'
                }
            ];
            setResults(mockResults);

            // Simulate "AI Analysis" step
            setAnalyzing(true);
            setTimeout(() => setAnalyzing(false), 1000);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const convertToLead = (place: PlaceResult) => {
        const newLead: Lead = {
            id: crypto.randomUUID(),
            firstName: 'Unknown', // Placeholder
            lastName: 'Contact',
            email: 'contact@' + place.website?.replace('https://', '').replace('http://', '').split('/')[0] || 'contact@example.com',
            company: place.name,
            businessName: place.name,
            stage: 'New',
            dealStage: 'Prospecting',
            loanProgram: place.is504Likely ? '504' : '7a',
            owner: 'Unassigned',
            city: place.address.split(',')[1]?.trim() || '',
            notes: [{
                id: crypto.randomUUID(),
                content: `AI Scout: Detected via search "${query}". ${place.growthSignal}.`,
                timestamp: new Date().toISOString(),
                author: 'System',
                type: 'SystemEvent'
            }]
        };
        onAddLead(newLead);
    };

    return (
        <div className="lead-generator">
            <div className="generator-header">
                <button onClick={onCancel} className="back-btn">← Back to Pipeline</button>
                <h2>Lead Scout AI</h2>
            </div>

            <div className="search-box">
                <form onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="e.g. 'Machine Shops in Riverside' or 'Hotels in Ontario'"
                        autoFocus
                    />
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Scanning...' : 'Find Prospects'}
                    </button>
                </form>
            </div>

            <div className="results-area">
                {analyzing && (
                    <div className="ai-status">
                        <span className="pulse">⚡</span> Analyzing real estate ownership potential...
                    </div>
                )}

                <div className="results-grid">
                    {results.map(place => (
                        <div key={place.id} className={`result-card ${place.is504Likely ? 'highlight-504' : ''}`}>
                            <div className="card-top">
                                <h3>{place.name}</h3>
                                <div className="rating">
                                    ⭐ {place.rating} ({place.user_ratings_total})
                                </div>
                            </div>
                            <p className="address">{place.address}</p>

                            <div className="ai-badges">
                                {place.is504Likely && <span className="badge badge-504">🏭 504 Candidate</span>}
                                <span className="badge badge-growth">📈 {place.growthSignal}</span>
                            </div>

                            <button onClick={() => convertToLead(place)} className="btn-add">
                                + Add to CRM
                            </button>
                        </div>
                    ))}
                </div>

                {!loading && results.length === 0 && query && (
                    <div className="empty-search">
                        <p>Enter a search term to find new business prospects.</p>
                        <p className="hint">Try "Manufacturers in [City]" or "Medical Practices in [City]"</p>
                    </div>
                )}
            </div>

            <style>{`
                .lead-generator {
                    padding: 2rem;
                    background: #f8fafc;
                    height: 100%;
                }
                .generator-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                .back-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-size: 1rem;
                }
                .search-box form {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }
                .search-box input {
                    flex: 1;
                    padding: 1rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    font-size: 1.1rem;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }
                .results-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }
                .result-card {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s;
                }
                .result-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .highlight-504 {
                    border-color: #10b981;
                    background: linear-gradient(to bottom right, #ffffff, #f0fdf4);
                }
                .card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: start;
                    margin-bottom: 0.5rem;
                }
                .card-top h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    color: var(--text-primary);
                }
                .rating {
                    font-size: 0.9rem;
                    color: #f59e0b;
                }
                .address {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                }
                .ai-badges {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                }
                .badge {
                    font-size: 0.75rem;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-weight: 500;
                }
                .badge-504 {
                    background: #d1fae5;
                    color: #065f46;
                }
                .badge-growth {
                    background: #e0f2fe;
                    color: #075985;
                }
                .btn-add {
                    width: 100%;
                    padding: 0.75rem;
                    background: white;
                    border: 1px solid var(--primary);
                    color: var(--primary);
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                }
                .btn-add:hover {
                    background: var(--primary);
                    color: white;
                }
                .ai-status {
                    margin-bottom: 1rem;
                    color: var(--primary);
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .pulse {
                    animation: pulse 1.5s infinite;
                }
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};
