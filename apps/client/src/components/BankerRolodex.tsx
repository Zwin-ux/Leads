import React, { useState, useEffect } from 'react';
import type { Banker } from '@leads/shared';

// Pre-seeded bankers with relationship data
const DEFAULT_BANKERS: Banker[] = [
    { id: 'b1', name: 'John Mitchell', bank: 'Comerica', branch: 'Riverside', title: 'VP Commercial Banking', phone: '951-555-0101', email: 'jmitchell@comerica.com', trustScore: 5, totalFunded: 12500000, lastDealDate: '2024-10-15', notes: 'Great partner. Fast underwriting. Loves 504 RE deals.' },
    { id: 'b2', name: 'Sarah Chen', bank: 'Pacific Premier', branch: 'Los Angeles', title: 'SVP', phone: '213-555-0202', email: 'schen@ppbi.com', trustScore: 5, totalFunded: 18200000, lastDealDate: '2024-11-01', notes: 'Top performer. Waives points for repeat clients. Quick to term sheet.' },
    { id: 'b3', name: 'Mike Thompson', bank: 'First Republic', branch: 'Newport Beach', title: 'Director', phone: '949-555-0303', email: 'mthompson@firstrepublic.com', trustScore: 4, totalFunded: 8500000, lastDealDate: '2024-09-20', notes: 'Good for larger deals ($2M+). Takes longer but solid approval rates.' },
    { id: 'b4', name: 'Lisa Wong', bank: 'US Bank', branch: 'San Diego', title: 'VP SBA Lending', phone: '619-555-0404', email: 'lwong@usbank.com', trustScore: 4, totalFunded: 6800000, lastDealDate: '2024-08-10', notes: 'SBA preferred lender. Good for 7a crossover deals.' },
    { id: 'b5', name: 'Robert Garcia', bank: 'Banner Bank', branch: 'Orange County', title: 'Commercial Banker', phone: '714-555-0505', email: 'rgarcia@bannerbank.com', trustScore: 4, totalFunded: 5200000, lastDealDate: '2024-07-22', notes: 'New relationship. Growing portfolio. Eager to do more 504.' },
    { id: 'b6', name: 'Jennifer Lee', bank: 'Torrey Pines Bank', branch: 'La Jolla', title: 'VP', phone: '858-555-0606', email: 'jlee@torreypinesbank.com', trustScore: 5, totalFunded: 9100000, lastDealDate: '2024-10-28', notes: 'Excellent communicator. Boutique feel, fast decisions.' },
    { id: 'b7', name: 'David Martinez', bank: 'Mechanics Bank', branch: 'Inland Empire', title: 'Commercial Banking Officer', phone: '909-555-0707', email: 'dmartinez@mechanicsbank.com', trustScore: 3, totalFunded: 3200000, lastDealDate: '2024-06-15', notes: 'Good for smaller deals. Takes longer on credit approval.' },
    { id: 'b8', name: 'Amanda Foster', bank: 'Western Alliance', branch: 'Phoenix', title: 'SVP', phone: '602-555-0808', email: 'afoster@westernalliance.com', trustScore: 4, totalFunded: 7500000, lastDealDate: '2024-09-05', notes: 'Strong in construction. Willing to go out-of-state.' },
    { id: 'b9', name: 'Chris Anderson', bank: 'Opus Bank', branch: 'Irvine', title: 'VP', phone: '949-555-0909', email: 'canderson@opusbank.com', trustScore: 4, totalFunded: 4800000, lastDealDate: '2024-08-28', notes: 'Tech-focused. Faster digital process.' },
    { id: 'b10', name: 'Michelle Kim', bank: 'Bank of the West', branch: 'Los Angeles', title: 'Senior VP', phone: '213-555-1010', email: 'mkim@bankofthewest.com', trustScore: 3, totalFunded: 2900000, lastDealDate: '2024-05-10', notes: 'Larger bank, more bureaucracy. Good for big deals.' },
];

const STORAGE_KEY = 'leads_bankers_v1';

interface BankerRolodexProps {
    onSelectBanker?: (banker: Banker) => void;
    selectionMode?: boolean;
    onBack?: () => void;
}

export const BankerRolodex: React.FC<BankerRolodexProps> = ({ onSelectBanker, selectionMode = false, onBack }) => {
    const [bankers, setBankers] = useState<Banker[]>([]);
    const [search, setSearch] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingBanker, setEditingBanker] = useState<Banker | null>(null);
    const [sortBy, setSortBy] = useState<'name' | 'bank' | 'trustScore' | 'totalFunded'>('trustScore');

    // Load bankers from localStorage or use defaults
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setBankers(JSON.parse(stored));
        } else {
            setBankers(DEFAULT_BANKERS);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BANKERS));
        }
    }, []);

    // Save bankers to localStorage
    const saveBankers = (newBankers: Banker[]) => {
        setBankers(newBankers);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newBankers));
    };

    // Filter and sort
    const filteredBankers = bankers
        .filter(b =>
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.bank.toLowerCase().includes(search.toLowerCase()) ||
            b.branch.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === 'trustScore') return b.trustScore - a.trustScore;
            if (sortBy === 'totalFunded') return b.totalFunded - a.totalFunded;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return a.bank.localeCompare(b.bank);
        });

    const handleAddBanker = (banker: Omit<Banker, 'id'>) => {
        const newBanker: Banker = {
            ...banker,
            id: `b${Date.now()}`
        };
        saveBankers([...bankers, newBanker]);
        setShowAddForm(false);
    };

    const handleUpdateBanker = (banker: Banker) => {
        saveBankers(bankers.map(b => b.id === banker.id ? banker : b));
        setEditingBanker(null);
    };

    const handleDeleteBanker = (id: string) => {
        if (confirm('Remove this banker from your rolodex?')) {
            saveBankers(bankers.filter(b => b.id !== id));
        }
    };

    const getTrustStars = (score: number) => '★'.repeat(score) + '☆'.repeat(5 - score);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

    return (
        <div className="banker-rolodex">
            {/* Header */}
            <div className="rolodex-header">
                <div className="header-left">
                    {onBack && (
                        <button onClick={onBack} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', marginRight: '0.5rem' }}>
                            ←
                        </button>
                    )}
                    <h2>Banker Rolodex</h2>
                    <span className="count">{filteredBankers.length} bankers</span>
                </div>
                {!selectionMode && (
                    <button className="btn-primary" onClick={() => setShowAddForm(true)}>
                        + Add Banker
                    </button>
                )}
            </div>

            {/* Search & Sort */}
            <div className="rolodex-controls">
                <input
                    type="text"
                    placeholder="Search by name, bank, or branch..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="search-input"
                />
                <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="sort-select"
                >
                    <option value="trustScore">Sort by Trust Score</option>
                    <option value="totalFunded">Sort by Total Funded</option>
                    <option value="name">Sort by Name</option>
                    <option value="bank">Sort by Bank</option>
                </select>
            </div>

            {/* Banker List */}
            <div className="banker-list">
                {filteredBankers.map(banker => (
                    <div
                        key={banker.id}
                        className={`banker-card ${selectionMode ? 'selectable' : ''}`}
                        onClick={() => selectionMode && onSelectBanker?.(banker)}
                    >
                        <div className="banker-main">
                            <div className="banker-info">
                                <span className="banker-name">{banker.name}</span>
                                <span className="banker-title">{banker.title}</span>
                                <span className="banker-bank">{banker.bank} — {banker.branch}</span>
                            </div>
                            <div className="banker-stats">
                                <span className="trust-score" title={`Trust Score: ${banker.trustScore}/5`}>
                                    {getTrustStars(banker.trustScore)}
                                </span>
                                <span className="total-funded">{formatCurrency(banker.totalFunded)}</span>
                            </div>
                        </div>
                        <div className="banker-contact">
                            <a href={`tel:${banker.phone}`}>{banker.phone}</a>
                            <a href={`mailto:${banker.email}`}>{banker.email}</a>
                        </div>
                        {banker.notes && (
                            <div className="banker-notes">{banker.notes}</div>
                        )}
                        {!selectionMode && (
                            <div className="banker-actions">
                                <button className="btn-text" onClick={() => setEditingBanker(banker)}>Edit</button>
                                <button className="btn-text danger" onClick={() => handleDeleteBanker(banker.id)}>Remove</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add/Edit Form Modal */}
            {(showAddForm || editingBanker) && (
                <BankerForm
                    banker={editingBanker}
                    onSave={(b) => editingBanker ? handleUpdateBanker(b as Banker) : handleAddBanker(b)}
                    onCancel={() => { setShowAddForm(false); setEditingBanker(null); }}
                />
            )}

            <style>{`
                .banker-rolodex {
                    padding: 1rem;
                }
                .rolodex-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }
                .header-left {
                    display: flex;
                    align-items: baseline;
                    gap: 0.75rem;
                }
                .header-left h2 {
                    margin: 0;
                    font-size: 1.25rem;
                }
                .count {
                    color: #64748b;
                    font-size: 0.9rem;
                }
                .rolodex-controls {
                    display: flex;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                }
                .search-input {
                    flex: 1;
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 0.9rem;
                }
                .sort-select {
                    padding: 0.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    background: white;
                    font-size: 0.85rem;
                }
                .banker-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    max-height: 500px;
                    overflow-y: auto;
                }
                .banker-card {
                    background: #f8fafc;
                    border-radius: 8px;
                    padding: 1rem;
                    border-left: 4px solid #3b82f6;
                }
                .banker-card.selectable {
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .banker-card.selectable:hover {
                    background: #e0f2fe;
                    border-left-color: #0284c7;
                }
                .banker-main {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                }
                .banker-info {
                    display: flex;
                    flex-direction: column;
                }
                .banker-name {
                    font-weight: 600;
                    color: #1e293b;
                }
                .banker-title {
                    font-size: 0.85rem;
                    color: #64748b;
                }
                .banker-bank {
                    font-size: 0.85rem;
                    color: #3b82f6;
                    font-weight: 500;
                }
                .banker-stats {
                    text-align: right;
                }
                .trust-score {
                    display: block;
                    color: #f59e0b;
                    font-size: 0.9rem;
                }
                .total-funded {
                    font-size: 0.85rem;
                    color: #22c55e;
                    font-weight: 600;
                }
                .banker-contact {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.85rem;
                    margin-bottom: 0.5rem;
                }
                .banker-contact a {
                    color: #3b82f6;
                    text-decoration: none;
                }
                .banker-contact a:hover {
                    text-decoration: underline;
                }
                .banker-notes {
                    font-size: 0.85rem;
                    color: #475569;
                    font-style: italic;
                    padding: 0.5rem;
                    background: white;
                    border-radius: 4px;
                    margin-top: 0.5rem;
                }
                .banker-actions {
                    display: flex;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                    padding-top: 0.5rem;
                    border-top: 1px solid #e2e8f0;
                }
                .btn-text {
                    background: none;
                    border: none;
                    color: #3b82f6;
                    cursor: pointer;
                    font-size: 0.8rem;
                    padding: 0.25rem 0.5rem;
                }
                .btn-text:hover {
                    text-decoration: underline;
                }
                .btn-text.danger {
                    color: #ef4444;
                }
            `}</style>
        </div>
    );
};

// Banker Form Component
interface BankerFormProps {
    banker: Banker | null;
    onSave: (banker: Omit<Banker, 'id'> | Banker) => void;
    onCancel: () => void;
}

const BankerForm: React.FC<BankerFormProps> = ({ banker, onSave, onCancel }) => {
    const [form, setForm] = useState<Omit<Banker, 'id'>>({
        name: banker?.name || '',
        bank: banker?.bank || '',
        branch: banker?.branch || '',
        title: banker?.title || '',
        phone: banker?.phone || '',
        email: banker?.email || '',
        trustScore: banker?.trustScore || 3,
        totalFunded: banker?.totalFunded || 0,
        lastDealDate: banker?.lastDealDate || '',
        notes: banker?.notes || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (banker?.id) {
            onSave({ ...form, id: banker.id });
        } else {
            onSave(form);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <h3>{banker ? 'Edit Banker' : 'Add New Banker'}</h3>
                <form onSubmit={handleSubmit} className="banker-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Name *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="VP, SVP, etc."
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Bank *</label>
                            <input
                                type="text"
                                value={form.bank}
                                onChange={e => setForm({ ...form, bank: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Branch</label>
                            <input
                                type="text"
                                value={form.branch}
                                onChange={e => setForm({ ...form, branch: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Trust Score (1-5)</label>
                            <select
                                value={form.trustScore}
                                onChange={e => setForm({ ...form, trustScore: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
                            >
                                <option value={5}>★★★★★ Excellent</option>
                                <option value={4}>★★★★☆ Good</option>
                                <option value={3}>★★★☆☆ Average</option>
                                <option value={2}>★★☆☆☆ Below Avg</option>
                                <option value={1}>★☆☆☆☆ Poor</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Total Funded ($)</label>
                            <input
                                type="number"
                                value={form.totalFunded}
                                onChange={e => setForm({ ...form, totalFunded: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Notes</label>
                        <textarea
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                            rows={3}
                            placeholder="Relationship notes, preferences, deal history..."
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Banker</button>
                    </div>
                </form>
                <style>{`
                    .banker-form {
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                    }
                    .banker-form .form-row {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 1rem;
                    }
                    .banker-form .form-group {
                        display: flex;
                        flex-direction: column;
                        gap: 0.25rem;
                    }
                    .banker-form label {
                        font-size: 0.85rem;
                        font-weight: 500;
                        color: #475569;
                    }
                    .banker-form input,
                    .banker-form select,
                    .banker-form textarea {
                        padding: 0.5rem;
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        font-size: 0.9rem;
                    }
                    .banker-form textarea {
                        resize: vertical;
                    }
                    .form-actions {
                        display: flex;
                        justify-content: flex-end;
                        gap: 0.5rem;
                        margin-top: 0.5rem;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default BankerRolodex;
