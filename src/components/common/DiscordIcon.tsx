
import React from 'react';

interface DiscordIconProps {
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const DiscordIcon: React.FC<DiscordIconProps> = ({ size = 24, className, style }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
    >
        <path d="M9 12h.01" />
        <path d="M15 12h.01" />
        <path d="M7.5 16s1.5-1 4.5-1 4.5 1 4.5 1" />
        <path d="M19.07 4.93C17.26 3.65 15.28 2.8 13.14 2.37c-.12.46-.37 1.1-.56 1.48-1.55-.26-3.15-.26-4.7 0-.2-.41-.48-1.07-.6-1.52A14.97 14.97 0 0 0 4.93 4.93C1.65 9.77 1.8 14.47 2.15 19.04c2.25 1.63 4.38 2.54 6.44 3.12.51-.67.95-1.39 1.34-2.15-1.7-.56-2.58-1.36-2.58-1.36.19-.13.38-.27.56-.41 3.25 1.5 6.77 1.5 9.98 0 .19.14.37.28.56.41 0 0-.91.8-2.67 1.36.4.75.84 1.47 1.32 2.15 2.06-.58 4.19-1.49 6.44-3.12.44-5.59-1.09-10.27-4.38-15.11z" />
    </svg>
);
