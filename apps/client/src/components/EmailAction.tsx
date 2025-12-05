import React from 'react';

interface EmailActionProps {
    to: string;
    subject: string;
    body: string;
    label?: string;
    variant?: 'primary' | 'secondary' | 'icon' | 'text';
    icon?: string;
    className?: string;
}

export const EmailAction: React.FC<EmailActionProps> = ({
    to,
    subject,
    body,
    label,
    variant = 'primary',
    icon,
    className
}) => {
    // Encode components for mailto URL
    const getMailtoLink = () => {
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);
        return `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
    };

    const baseStyles: React.CSSProperties = {
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
    };

    const variantStyles: Record<string, React.CSSProperties> = {
        primary: {
            background: '#3b82f6',
            color: 'white',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 500
        },
        secondary: {
            background: 'white',
            color: '#334155',
            border: '1px solid #cbd5e1',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            fontSize: '0.85rem'
        },
        text: {
            background: 'transparent',
            color: '#3b82f6',
            border: 'none',
            padding: 0,
            fontSize: '0.85rem'
        },
        icon: {
            background: 'transparent',
            border: 'none',
            padding: '4px',
            borderRadius: '4px',
            color: '#64748b',
            fontSize: '1.1rem'
        }
    };

    const combinedStyle = { ...baseStyles, ...variantStyles[variant] };

    return (
        <a
            href={getMailtoLink()}
            className={`email-action ${className || ''}`}
            style={combinedStyle}
            target="_blank"
            rel="noopener noreferrer"
        >
            {icon && <span>{icon}</span>}
            {label && <span>{label}</span>}
        </a>
    );
};
