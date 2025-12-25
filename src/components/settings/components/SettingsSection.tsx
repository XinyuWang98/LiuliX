import { ReactNode } from 'react';
import '../SettingsPage.css';

interface SettingsGroupProps {
    title?: string;
    children: ReactNode;
}

export const SettingsGroup = ({ title, children }: SettingsGroupProps) => {
    return (
        <>
            {title && <div className="settings-group-title">{title}</div>}
            <div className="settings-group">
                {children}
            </div>
        </>
    );
};

interface SettingsRowProps {
    label: string;
    description?: string;
    action?: ReactNode;
    onClick?: () => void;
    className?: string;
}

export const SettingsRow = ({ label, description, action, onClick, className = '' }: SettingsRowProps) => {
    return (
        <div className={`settings-row ${className}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div className="settings-row-info">
                <span className="settings-row-label">{label}</span>
                {description && <span className="settings-row-desc">{description}</span>}
            </div>
            {action && <div className="settings-row-action">{action}</div>}
        </div>
    );
};
