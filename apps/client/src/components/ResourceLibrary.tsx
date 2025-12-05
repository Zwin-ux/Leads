import React from 'react';

const RESOURCES = [
    {
        category: 'Compliance & Search',
        links: [
            { label: 'CA SOS Entity Search', url: 'https://businesssearch.sos.ca.gov/' },
            { label: 'SBA Franchise Directory', url: 'https://www.sba.gov/document/support-sba-franchise-directory' },
            { label: 'NAICS Code Search', url: 'https://www.census.gov/naics/' },
            { label: 'SAM.gov Exclusion Search', url: 'https://sam.gov/content/exclusions' }
        ]
    },
    {
        category: 'Rates & Forms',
        links: [
            { label: 'SBA 504 Interest Rates (Eagle)', url: 'https://eaglecompliance.com/504-rates' },
            { label: 'SBA Form 1244', url: 'https://www.sba.gov/sites/default/files/2018-04/Form%201244%20%28FINAL%29%20%2810-18%29.pdf' },
            { label: 'SBA Form 1919', url: 'https://www.sba.gov/sites/default/files/2020-11/SBA%20Form%201919_1.pdf' }
        ]
    }
];

export const ResourceLibrary: React.FC = () => {
    return (
        <div className="resource-library">
            <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>📚 SBA Quick Links</h3>

            <div className="resource-grid">
                {RESOURCES.map((section, idx) => (
                    <div key={idx} className="resource-section">
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            {section.category}
                        </h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {section.links.map((link, lIdx) => (
                                <li key={lIdx} style={{ marginBottom: '0.5rem' }}>
                                    <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ textDecoration: 'none', color: '#3b82f6', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        🔗 {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <style>{`
                .resource-library {
                    background: white;
                    border-radius: 12px;
                    padding: 1.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                .resource-grid {
                    display: grid;
                    gap: 1.5rem;
                }
                .resource-section {
                    padding-bottom: 0.5rem;
                    border-bottom: 1px solid #f1f5f9;
                }
                .resource-section:last-child {
                    border-bottom: none;
                }
                a:hover {
                    text-decoration: underline !important;
                }
            `}</style>
        </div>
    );
};
