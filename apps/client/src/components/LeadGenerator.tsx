import React, { useState, useEffect, useRef } from 'react';
import type { Lead } from '@leads/shared';



interface PlaceResult {
    id: string;
    name: string;
    address: string;
    rating?: number;
    user_ratings_total?: number;
    website?: string;
    types?: string[];
    formattedAddress?: string;
    location?: any;
    photos?: any[];
}

export const LeadGenerator: React.FC<{ onAddLead: (lead: Lead) => void, onCancel: () => void }> = ({ onAddLead, onCancel }) => {
    const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
    const pickerRef = useRef<any>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    useEffect(() => {
        const picker = pickerRef.current;
        const map = mapRef.current;
        const marker = markerRef.current;

        if (!picker || !map || !marker) return;

        const handlePlaceChange = () => {
            const place = picker.value;

            if (!place || !place.location) {
                setSelectedPlace(null);
                marker.position = null;
                return;
            }

            if (place.viewport) {
                map.innerMap.fitBounds(place.viewport);
            } else {
                map.center = place.location;
                map.zoom = 17;
            }

            marker.position = place.location;

            // Extract data
            const extractedPlace: PlaceResult = {
                id: place.id,
                name: place.displayName,
                address: place.formattedAddress,
                formattedAddress: place.formattedAddress,
                rating: place.rating,
                user_ratings_total: place.userRatingCount,
                website: place.websiteUri,
                types: place.types,
                location: place.location,
                photos: place.photos
            };

            setSelectedPlace(extractedPlace);
        };

        picker.addEventListener('gmpx-placechange', handlePlaceChange);

        return () => {
            picker.removeEventListener('gmpx-placechange', handlePlaceChange);
        };
    }, []);

    const handleAddLead = () => {
        if (!selectedPlace) return;

        const is504Likely = (selectedPlace.types?.includes('manufacturing') ||
            selectedPlace.types?.includes('industrial') ||
            selectedPlace.types?.includes('health') ||
            selectedPlace.types?.includes('doctor') ||
            selectedPlace.types?.includes('dentist')) ?? false;

        const newLead: Lead = {
            id: crypto.randomUUID(),
            firstName: 'Unknown',
            lastName: 'Contact',
            email: selectedPlace.website ? `info@${new URL(selectedPlace.website).hostname.replace('www.', '')}` : 'info@example.com',
            company: selectedPlace.name,
            businessName: selectedPlace.name,
            stage: 'New',
            dealStage: 'Prospecting',
            loanProgram: is504Likely ? '504' : '7a',
            owner: 'Unassigned',
            city: selectedPlace.address?.split(',').slice(-3)[0]?.trim() || '',
            phone: '', // Place picker object might not have phone directly accessible in this simple view, would need fetchFields
            notes: [{
                id: crypto.randomUUID(),
                content: `AI Scout: Sourced from Google Maps. Rating: ${selectedPlace.rating} (${selectedPlace.user_ratings_total} reviews). Address: ${selectedPlace.address}`,
                timestamp: new Date().toISOString(),
                author: 'System',
                type: 'SystemEvent'
            }]
        };
        onAddLead(newLead);
    };

    return (
        <div className="lead-generator">
            {/* Load Google Maps API */}
            <gmpx-api-loader key="AIzaSyD1K_Wmih7d1BHz24hgGGwEHcDqu3rPgxI" solution-channel="GMP_GE_mapsandplacesautocomplete_v2">
            </gmpx-api-loader>

            <div className="generator-header">
                <button onClick={onCancel} className="back-btn">← Back to Pipeline</button>
                <h2>Lead Scout AI (Live Search)</h2>
            </div>

            <div className="map-container">
                <div className="search-overlay">
                    <gmpx-place-picker
                        ref={pickerRef}
                        placeholder="Search for a business (e.g. 'Machine Shops in Riverside')"
                        style={{ width: '100%' }}
                    ></gmpx-place-picker>
                </div>

                <gmp-map ref={mapRef} center="33.9533, -117.3961" zoom="11" map-id="DEMO_MAP_ID" style={{ height: '500px', width: '100%', borderRadius: '12px' }}>
                    <gmp-advanced-marker ref={markerRef}></gmp-advanced-marker>
                </gmp-map>
            </div>

            {selectedPlace && (
                <div className="selected-place-card">
                    <div className="place-info">
                        <h3>{selectedPlace.name}</h3>
                        <p>{selectedPlace.address}</p>
                        <div className="place-meta">
                            {selectedPlace.rating && <span>⭐ {selectedPlace.rating} ({selectedPlace.user_ratings_total})</span>}
                            {selectedPlace.website && <a href={selectedPlace.website} target="_blank" rel="noopener noreferrer">Website</a>}
                        </div>
                    </div>
                    <div className="place-actions">
                        <button className="btn-primary" onClick={handleAddLead}>
                            + Add to CRM
                        </button>
                    </div>
                </div>
            )}

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
                .map-container {
                    position: relative;
                    flex: 1;
                    min-height: 500px;
                }
                .search-overlay {
                    position: absolute;
                    top: 1rem;
                    left: 1rem;
                    width: 400px;
                    z-index: 10;
                    background: white;
                    padding: 0.5rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .selected-place-card {
                    margin-top: 1.5rem;
                    background: white;
                    padding: 1.5rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    animation: slideUp 0.3s ease-out;
                }
                .place-info h3 { margin: 0 0 0.5rem 0; color: var(--text-primary); }
                .place-info p { margin: 0 0 0.5rem 0; color: var(--text-secondary); }
                .place-meta { display: flex; gap: 1rem; font-size: 0.9rem; color: #64748b; }
                .place-meta a { color: var(--primary); }
                
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
