import React, { useState } from 'react';
import type { Lead } from '@leads/shared';
import { ocSearch, isOcEnabled } from '../../services/oc/ocClient';
import type { OcCompany } from '../../services/oc/ocTypes';

interface CaEntityCheckProps {
    lead: Lead;
}

export const CaEntityCheck: React.FC<CaEntityCheckProps> = ({ lead }) => {
    const [searchTerm, setSearchTerm] = useState(lead.company);
    const [results, setResults] = useState<OcCompany[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        setLoading(true);
        setSearched(true);
        try {
            // Default to US/CA search or allow global?
            // Let's do a broad search since OC matches by name well
            const data = await ocSearch(searchTerm || '');
            setResults(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const isEnabled = isOcEnabled();

    return (
        <div className="ca-entity-check" style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🌍 Entity Verification
                <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 'normal',
                    background: isEnabled ? '#e2e8f0' : '#fef3c7',
                    color: isEnabled ? 'inherit' : '#92400e',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px'
                }}>
                    {isEnabled ? 'OPENCORPORATES' : 'DEMO FIXTURES'}
                </span>
            </h3>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Enter Business Name..."
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>

            <div className="results-list" style={{ flex: 1, overflowY: 'auto' }}>
                {results.map(entity => {
                    const isActive = entity.current_status?.toLowerCase() === 'active';
                    return (
                        <div key={`${entity.jurisdiction_code}_${entity.company_number}`} style={{
                            background: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem',
                            border: '1px solid #e2e8f0', borderLeft: `4px solid ${isActive ? '#22c55e' : '#ef4444'}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e293b' }}>{entity.name}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                        {entity.company_number} ({entity.jurisdiction_code.toUpperCase()})
                                    </div>
                                </div>
                                <span style={{
                                    padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: '600',
                                    background: isActive ? '#dcfce7' : '#fee2e2',
                                    color: isActive ? '#166534' : '#991b1b'
                                }}>
                                    {entity.current_status || 'Unknown'}
                                </span>
                            </div>

                            <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div>
                                    <span style={{ color: '#94a3b8' }}>Filed:</span> {entity.incorporation_date}
                                </div>
                                <div>
                                    <span style={{ color: '#94a3b8' }}>Type:</span> {entity.company_type}
                                </div>
                                <div style={{ gridColumn: '1 / -1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    <span style={{ color: '#94a3b8' }}>Address:</span> {entity.registered_address_in_full}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {searched && results.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                        No records found for "{searchTerm}".
                        <br /><small>(Try searching for "Pure" to see fixture data)</small>
                    </div>
                )}
            </div>
        </div>
    );
};
