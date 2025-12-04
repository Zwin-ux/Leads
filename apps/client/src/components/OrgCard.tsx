import React from 'react';

const OrgCard: React.FC = () => {
    return (
        <div className="org-section">
            <div className="org-header">
                <h3>Built for your org</h3>
                <p>Created and approved by your organization's technology team</p>
            </div>
            <div className="org-card">
                <div className="org-card-content">
                    <div className="org-icon">
                        <img src="/assets/icon-64.png" alt="AmPac Brain" />
                    </div>
                    <div className="org-details">
                        <div className="org-title-row">
                            <h4>AmPac Brain</h4>
                            <button className="open-btn">Open</button>
                        </div>
                        <span className="org-subtitle">AmPac Business Capital</span>
                        <p className="org-desc">24/7 AI Underwriter for SBA Lending</p>
                        <span className="org-tag">Built for your org</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrgCard;
