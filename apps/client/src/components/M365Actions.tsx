import React, { useState } from 'react';
import type { Lead } from '@leads/shared';
import { authService } from '../services/authService';

interface M365ActionsProps {
    lead: Lead;
    onActionComplete?: (action: string, result: any) => void;
}

interface MeetingFormData {
    subject: string;
    date: string;
    startTime: string;
    duration: '15' | '30' | '60' | '90';
    attendees: string[];
    location: string;
    notes: string;
    isOnlineMeeting: boolean;
}

interface EmailFormData {
    to: string;
    subject: string;
    body: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const M365Actions: React.FC<M365ActionsProps> = ({ lead, onActionComplete }) => {
    const [activeAction, setActiveAction] = useState<'none' | 'meeting' | 'email' | 'task' | 'findTime'>('none');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const [meetingForm, setMeetingForm] = useState<MeetingFormData>({
        subject: `Meeting with ${lead.company}`,
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        duration: '30',
        attendees: lead.email ? [lead.email] : [],
        location: '',
        notes: '',
        isOnlineMeeting: true
    });

    const [emailForm, setEmailForm] = useState<EmailFormData>({
        to: lead.email || '',
        subject: `Follow-up: ${lead.company}`,
        body: `Hi ${lead.firstName},\n\nThank you for your time. I wanted to follow up on our conversation about your financing needs.\n\nBest regards`
    });

    const [suggestedTimes, setSuggestedTimes] = useState<any[]>([]);

    const getAccessToken = async () => {
        const scopes = ['Mail.Send', 'Calendars.ReadWrite', 'Tasks.ReadWrite'];
        const token = await authService.getAccessToken(scopes);
        if (!token) {
            throw new Error('Could not acquire access token. Please sign in.');
        }
        return token;
    };

    const executeGraphTool = async (toolName: string, args: any) => {
        const accessToken = await getAccessToken();

        const response = await fetch(`${API_BASE}/processLead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lead,
                action: 'executeGraphTool',
                accessToken,
                toolName,
                args
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || 'Graph API call failed');
        }

        return await response.json();
    };

    const handleScheduleMeeting = async () => {
        setLoading(true);
        setResult(null);
        try {
            const startDateTime = new Date(`${meetingForm.date}T${meetingForm.startTime}:00`);
            const endDateTime = new Date(startDateTime.getTime() + parseInt(meetingForm.duration) * 60 * 1000);

            await executeGraphTool('create_event', {
                subject: meetingForm.subject,
                start: startDateTime.toISOString(),
                end: endDateTime.toISOString(),
                attendees: meetingForm.attendees,
                location: meetingForm.location || (meetingForm.isOnlineMeeting ? 'Microsoft Teams Meeting' : ''),
                body: meetingForm.notes,
                isOnlineMeeting: meetingForm.isOnlineMeeting
            });

            setResult({ type: 'success', message: 'Meeting scheduled successfully!' });
            onActionComplete?.('meeting', { subject: meetingForm.subject, date: meetingForm.date });
            setTimeout(() => setActiveAction('none'), 2000);
        } catch (err: any) {
            setResult({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleSendEmail = async () => {
        setLoading(true);
        setResult(null);
        try {
            await executeGraphTool('send_email', {
                to: emailForm.to,
                subject: emailForm.subject,
                body: emailForm.body.replace(/\n/g, '<br>')
            });

            setResult({ type: 'success', message: 'Email sent successfully!' });
            onActionComplete?.('email', { to: emailForm.to, subject: emailForm.subject });
            setTimeout(() => setActiveAction('none'), 2000);
        } catch (err: any) {
            setResult({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleFindMeetingTimes = async () => {
        setLoading(true);
        setResult(null);
        setSuggestedTimes([]);
        try {
            const result = await executeGraphTool('find_meeting_times', {
                attendees: meetingForm.attendees,
                duration: `PT${meetingForm.duration}M`
            });

            if (result.toolResult?.meetingTimeSuggestions) {
                setSuggestedTimes(result.toolResult.meetingTimeSuggestions.slice(0, 5));
            }
        } catch (err: any) {
            setResult({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    const selectSuggestedTime = (suggestion: any) => {
        const start = new Date(suggestion.meetingTimeSlot.start.dateTime);
        setMeetingForm(prev => ({
            ...prev,
            date: start.toISOString().split('T')[0],
            startTime: start.toTimeString().slice(0, 5)
        }));
        setSuggestedTimes([]);
        setActiveAction('meeting');
    };

    return (
        <div style={{ marginTop: '1rem' }}>
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <button
                    onClick={() => setActiveAction(activeAction === 'meeting' ? 'none' : 'meeting')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: activeAction === 'meeting' ? '#3b82f6' : 'white',
                        color: activeAction === 'meeting' ? 'white' : '#3b82f6',
                        border: '1px solid #3b82f6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    📅 Schedule Meeting
                </button>
                <button
                    onClick={() => setActiveAction(activeAction === 'email' ? 'none' : 'email')}
                    style={{
                        padding: '0.5rem 1rem',
                        background: activeAction === 'email' ? '#3b82f6' : 'white',
                        color: activeAction === 'email' ? 'white' : '#3b82f6',
                        border: '1px solid #3b82f6',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    ✉️ Send Email
                </button>
                <button
                    onClick={async () => {
                        setLoading(true);
                        try {
                            // 1. Find times where *I* (Organizer) am free.
                            const result = await executeGraphTool('find_meeting_times', {
                                attendees: [], // Empty = Just me
                                duration: 'PT30M'
                            });

                            if (result.toolResult?.meetingTimeSuggestions) {
                                const suggestions = result.toolResult.meetingTimeSuggestions.slice(0, 3);
                                const timeOptions = suggestions.map((s: any) => {
                                    const start = new Date(s.meetingTimeSlot.start.dateTime);
                                    return `- ${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
                                }).join('\n');

                                // 2. Draft Email
                                setEmailForm({
                                    to: lead.email || '',
                                    subject: `Meeting availability - ${lead.company}`,
                                    body: `Hi ${lead.firstName || 'there'},\n\nI'd like to schedule a time to connect regarding your financing options. Here are a few times that work for me:\n\n${timeOptions || '(Checking calendar...)'}\n\nPlease let me know what works best for you, or feel free to suggest another time.\n\nBest regards,`
                                });
                                setActiveAction('email');
                            } else {
                                alert("Could not find open slots in your calendar.");
                            }
                        } catch (e: any) {
                            alert("Error finding times: " + e.message);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'white',
                        color: '#059669',
                        border: '1px solid #059669',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    🗓 Propose Times
                </button>
                <button
                    onClick={() => {
                        setActiveAction('findTime');
                        handleFindMeetingTimes();
                    }}
                    disabled={meetingForm.attendees.length === 0}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'white',
                        color: meetingForm.attendees.length === 0 ? '#94a3b8' : '#8b5cf6',
                        border: `1px solid ${meetingForm.attendees.length === 0 ? '#cbd5e1' : '#8b5cf6'}`,
                        borderRadius: '6px',
                        cursor: meetingForm.attendees.length === 0 ? 'not-allowed' : 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    ⏰ Find Mutual Time
                </button>
                <button
                    onClick={() => {
                        const subject = `Huddle: ${lead.company}`;
                        const users = meetingForm.attendees.join(','); // Or relevant internal users
                        const msg = `Let's discuss the ${lead.company} deal.`;
                        window.open(`https://teams.microsoft.com/l/chat/0/0?users=${users}&topicName=${encodeURIComponent(subject)}&message=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'white',
                        color: '#4f46e5',
                        border: '1px solid #4f46e5',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    🫂 Start Deal Huddle
                </button>
            </div>

            {/* Result Message */}
            {result && (
                <div style={{
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    borderRadius: '8px',
                    background: result.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: result.type === 'success' ? '#166534' : '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    {result.type === 'success' ? '✅' : '❌'} {result.message}
                </div>
            )}

            {/* Meeting Form */}
            {activeAction === 'meeting' && (
                <div style={{
                    padding: '1.25rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    background: '#f8fafc'
                }}>
                    <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📅</span> Schedule Meeting
                    </h4>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Subject</label>
                            <input
                                style={inputStyle}
                                value={meetingForm.subject}
                                onChange={e => setMeetingForm(p => ({ ...p, subject: e.target.value }))}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Date</label>
                                <input
                                    type="date"
                                    style={inputStyle}
                                    value={meetingForm.date}
                                    onChange={e => setMeetingForm(p => ({ ...p, date: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Time</label>
                                <input
                                    type="time"
                                    style={inputStyle}
                                    value={meetingForm.startTime}
                                    onChange={e => setMeetingForm(p => ({ ...p, startTime: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Duration</label>
                                <select
                                    style={inputStyle}
                                    value={meetingForm.duration}
                                    onChange={e => setMeetingForm(p => ({ ...p, duration: e.target.value as any }))}
                                >
                                    <option value="15">15 min</option>
                                    <option value="30">30 min</option>
                                    <option value="60">1 hour</option>
                                    <option value="90">1.5 hours</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="online-meeting"
                                checked={meetingForm.isOnlineMeeting}
                                onChange={e => setMeetingForm(p => ({ ...p, isOnlineMeeting: e.target.checked }))}
                            />
                            <label htmlFor="online-meeting" style={{ fontSize: '0.9rem', color: '#475569' }}>
                                Create as Teams meeting (online)
                            </label>
                        </div>

                        <div>
                            <label style={labelStyle}>Attendees</label>
                            <input
                                style={inputStyle}
                                placeholder="email1@example.com, email2@example.com"
                                value={meetingForm.attendees.join(', ')}
                                onChange={e => setMeetingForm(p => ({
                                    ...p,
                                    attendees: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                }))}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Notes (optional)</label>
                            <textarea
                                style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
                                value={meetingForm.notes}
                                onChange={e => setMeetingForm(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Add meeting agenda or notes..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setActiveAction('none')}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleScheduleMeeting}
                                disabled={loading || !meetingForm.subject}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    background: loading ? '#94a3b8' : '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: loading ? 'wait' : 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                {loading ? 'Scheduling...' : 'Create Meeting'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Form */}
            {activeAction === 'email' && (
                <div style={{
                    padding: '1.25rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    background: '#f8fafc'
                }}>
                    <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>✉️</span> Compose Email
                    </h4>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>To</label>
                            <input
                                style={inputStyle}
                                type="email"
                                value={emailForm.to}
                                onChange={e => setEmailForm(p => ({ ...p, to: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Subject</label>
                            <input
                                style={inputStyle}
                                value={emailForm.subject}
                                onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Message</label>
                            <textarea
                                style={{ ...inputStyle, minHeight: '120px', resize: 'vertical' }}
                                value={emailForm.body}
                                onChange={e => setEmailForm(p => ({ ...p, body: e.target.value }))}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setActiveAction('none')}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    background: 'white',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSendEmail}
                                disabled={loading || !emailForm.to || !emailForm.subject}
                                style={{
                                    padding: '0.625rem 1.25rem',
                                    background: loading ? '#94a3b8' : '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: loading ? 'wait' : 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                {loading ? 'Sending...' : 'Send Email'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Find Time Results */}
            {activeAction === 'findTime' && (
                <div style={{
                    padding: '1.25rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    background: '#f8fafc'
                }}>
                    <h4 style={{ margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>⏰</span> Available Meeting Times
                    </h4>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                            Finding available times...
                        </div>
                    ) : suggestedTimes.length > 0 ? (
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {suggestedTimes.map((suggestion, i) => {
                                const start = new Date(suggestion.meetingTimeSlot.start.dateTime);
                                const end = new Date(suggestion.meetingTimeSlot.end.dateTime);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => selectSuggestedTime(suggestion)}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            background: 'white',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 500, color: '#1e293b' }}>
                                                {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} -
                                                {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <span style={{
                                            background: suggestion.confidence === 100 ? '#dcfce7' : '#fef3c7',
                                            color: suggestion.confidence === 100 ? '#166534' : '#92400e',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem'
                                        }}>
                                            {suggestion.confidence}% match
                                        </span>
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setActiveAction('none')}
                                style={{
                                    marginTop: '0.5rem',
                                    padding: '0.5rem',
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                            No available times found. Try adjusting the duration or attendees.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#64748b',
    marginBottom: '0.25rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.025em'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box' as const
};

export default M365Actions;
