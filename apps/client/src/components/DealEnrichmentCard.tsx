import React, { useEffect, useState } from 'react';
import { enrichmentService, type BusinessEntityEnriched } from '../services/enrichmentService';

interface DealEnrichmentCardProps {
    leadId: string;
}

export const DealEnrichmentCard: React.FC<DealEnrichmentCardProps> = ({ leadId }) => {
    const [data, setData] = useState<BusinessEntityEnriched | null>(null);

    useEffect(() => {
        const enriched = enrichmentService.getEnrichedData(leadId);
        console.log(`[Card] Enriched Data for ${leadId}:`, enriched);
        setData(enriched);
    }, [leadId]);

    if (!data) return null;

    return (
        <div className="enrichment-card" style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            padding: '1.5rem',
            marginBottom: '1rem',
            border: '1px solid #e2e8f0'
        }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#334155', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🚀 Intelligence Brief
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Top Left: Entity Status */}
                <div style={{ borderRight: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>LEGAL ENTITY</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                        {data.legalName}
                    </div>
                    {data.statusCode !== undefined ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                                background: data.status?.toLowerCase() === 'active' ? '#dcfce7' : '#fee2e2',
                                color: data.status?.toLowerCase() === 'active' ? '#166534' : '#991b1b',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '99px',
                                fontSize: '0.8rem',
                                fontWeight: '700'
                            }}>
                                {data.status}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                ID: {data.entityNumber}
                            </span>
                        </div>
                    ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Verified status unavailable</span>
                    )}
                </div>

                {/* Top Right: LMI Badge */}
                <div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>HUD LMI STATUS</div>
                    {data.censusTract ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                                background: data.isLMI ? '#dcfce7' : '#f1f5f9',
                                color: data.isLMI ? '#166534' : '#475569',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '99px',
                                fontSize: '0.8rem',
                                fontWeight: '700'
                            }}>
                                {data.isLMI ? 'ELIGIBLE (LMI)' : 'NOT LMI'}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                Tract: {data.censusTract} ({data.lmiPct}%)
                            </span>
                        </div>
                    ) : (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Geocoding pending...</span>
                    )}
                </div>
            </div>

            <hr style={{ margin: '1rem 0', borderColor: '#f1f5f9' }} />

            {/* Middle: SBA Context */}
            <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>MARKET CONTEXT (SBA 504/7a)</div>
                {data.naicsCode ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '6px' }}>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>{data.sbaLoanCount || 0}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Loans in Area</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' }}>${((data.sbaLoanTotal || 0) / 1000000).toFixed(1)}M</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Volume</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', marginTop: '0.25rem' }}>{data.sbaLastLoanDate || 'N/A'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Last Funded</div>
                        </div>
                    </div>
                ) : (
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        No NAICS code provided. Market data unavailable.
                    </div>
                )}
            </div>

            {/* SEC Public Markets Data */}
            {data.cik && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🏛️ PUBLIC MARKETS (SEC EDGAR)
                        <span style={{ fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            {data.ticker}
                        </span>
                    </div>
                    <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                        <div>
                            <span style={{ color: '#64748b' }}>Recent Filing:</span>
                            <br />
                            <strong>{data.latestFilingType}</strong> ({data.latestFilingDate})
                        </div>
                        <div>
                            <span style={{ color: '#64748b' }}>CIK:</span>
                            <br />
                            {data.cik}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'right' }}>
                Enriched: {new Date(data.updatedAt).toLocaleTimeString()}
            </div>
        </div>
    );
};
