import React, { useState } from 'react';

export const FeedbackWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState<number | null>(null);
    const [category, setCategory] = useState('bug');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        // Construct email body
        const subject = `[In-App Feedback] - ${category.toUpperCase()}`;
        const body = `Category: ${category}
Rating: ${rating ? rating + '/5' : 'N/A'}

Message:
${message}

-------------------
Sent from AmPac CRM Dev Build`;

        // Simulate "sending" delay for UX, then open mail client
        setTimeout(() => {
            const mailtoLink = `mailto:mzwin@ampac.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.open(mailtoLink, '_blank');

            // Reset and close
            setMessage('');
            setRating(null);
            setCategory('bug');
            setSending(false);
            setIsOpen(false);
            alert("Feedback prepared! Please click 'Send' in your email client.");
        }, 800);
    };

    if (!isOpen) {
        return (
            <div
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '10px',
                    left: '10px',
                    padding: '8px 12px',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    zIndex: 9999,
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s'
                }}
            >
                <span>💬</span> Feedback
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 9999,
            width: '320px',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b', fontWeight: 600 }}>Send Feedback</h3>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px', padding: '0 4px' }}
                >
                    ×
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: 500 }}>How would you rate your experience?</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                type="button"
                                key={star}
                                onClick={() => setRating(star)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                    padding: '0',
                                    opacity: rating && star <= rating ? 1 : 0.3,
                                    filter: rating && star <= rating ? 'grayscale(0%)' : 'grayscale(100%)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                ⭐
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: 500 }}>Category</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#334155'
                        }}
                    >
                        <option value="bug">🐞 Report a Bug</option>
                        <option value="feature">💡 Feature Request</option>
                        <option value="improvement">🔧 Improvement</option>
                        <option value="other">📝 Other</option>
                    </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: 500 }}>Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        placeholder="Tell us what's happening..."
                        style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '8px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '13px',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={sending || !message}
                    style={{
                        width: '100%',
                        padding: '10px',
                        background: sending ? '#94a3b8' : '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: sending || !message ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s'
                    }}
                >
                    {sending ? 'Preparing...' : 'Send Feedback'}
                </button>
            </form>
        </div>
    );
};
