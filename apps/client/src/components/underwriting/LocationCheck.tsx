import React, { useState } from 'react';
import { underwritingService } from '../../services/underwritingService';

interface LocationCheckProps {
    address: string;
    onVerified: (data: any) => void;
}

export const LocationCheck: React.FC<LocationCheckProps> = ({ address, onVerified }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ lat: number, lon: number, displayName: string } | null>(null);
    const [error, setError] = useState('');

    const handleVerify = async () => {
        if (!address) {
            setError('No address provided');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await underwritingService.verifyLocation(address);
            if (data) {
                setResult(data);
                onVerified(data);
            } else {
                setError('Location not found. Check address format.');
            }
        } catch (e) {
            setError('Network error verifying location.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="location-check" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, color: '#475569' }}>📍 Site Verification</h4>
                <button
                    onClick={handleVerify}
                    disabled={loading}
                    style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', borderRadius: '4px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? 'Verifying...' : 'Verify Address'}
                </button>
            </div>

            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>
                {address || 'No address on file'}
            </div>

            {error && <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>}

            {result && (
                <div className="map-preview">
                    <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#16a34a', fontWeight: 500 }}>
                        ✓ Verified: {result.displayName.split(',')[0]}
                    </div>
                    {/* Using Static Map or Iframe for simplicity */}
                    <iframe
                        width="100%"
                        height="200"
                        frameBorder="0"
                        style={{ borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${result.lon - 0.005},${result.lat - 0.005},${result.lon + 0.005},${result.lat + 0.005}&layer=mapnik&marker=${result.lat},${result.lon}`}
                    ></iframe>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        Source: OpenStreetMap contributors
                    </div>
                </div>
            )}
        </div>
    );
};
