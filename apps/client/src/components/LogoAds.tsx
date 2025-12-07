import React, { useState, useEffect } from 'react';
import logo from '../assets/ampac-logo-v2.png';

interface LogoAdsProps {
    script?: {
        hooks: string[];
        beats: string[];
        caption: string;
    } | null;
    mode?: 'rotate' | 'generator';
}

const DEFAULT_ADS = [
    { text: "SBA 504 Loans: Own Your Future", sub: "10% Down Payment" },
    { text: "Fast Closings, Happy Clients", sub: "AmPac Business Capital" },
    { text: "Grow Your Business", sub: "Community Advantage Loans" }
];

export const LogoAds: React.FC<LogoAdsProps> = ({ script, mode = 'rotate' }) => {
    const [currentAdIndex, setCurrentAdIndex] = useState(0);

    useEffect(() => {
        if (mode === 'rotate') {
            const interval = setInterval(() => {
                setCurrentAdIndex(prev => (prev + 1) % DEFAULT_ADS.length);
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [mode]);

    return (
        <div className="logo-ads-container" style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            minHeight: '300px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <img src={logo} alt="AmPac Logo" style={{ maxWidth: '180px', marginBottom: '20px' }} />

            {mode === 'rotate' && (
                <div className="ad-rotate-content" style={{ animation: 'fadeIn 0.5s ease-in' }}>
                    <h3 style={{ color: '#003366', margin: '0 0 10px 0' }}>{DEFAULT_ADS[currentAdIndex].text}</h3>
                    <p style={{ color: '#666', margin: 0 }}>{DEFAULT_ADS[currentAdIndex].sub}</p>
                </div>
            )}

            {mode === 'generator' && script && (
                <div className="ad-script-content" style={{ textAlign: 'left', width: '100%', maxWidth: '400px' }}>
                    <div style={{ background: 'white', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <strong style={{ display: 'block', color: '#003366', marginBottom: '5px' }}>Hook Option 1:</strong>
                        "{script.hooks[0]}"
                    </div>

                    <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                        <strong style={{ display: 'block', color: '#003366', marginBottom: '10px' }}>Visual Beats:</strong>
                        {script.beats.map((beat, i) => (
                            <div key={i} style={{ marginBottom: '8px', fontSize: '0.9em' }}>
                                <strong>{i + 1}.</strong> {beat}
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '15px', fontSize: '0.85em', color: '#555', fontStyle: 'italic' }}>
                        Caption: {script.caption}
                    </div>
                </div>
            )}

            {mode === 'generator' && !script && (
                <div style={{ color: '#888', fontStyle: 'italic' }}>
                    Select options to generate your ad script...
                </div>
            )}
        </div>
    );
};
