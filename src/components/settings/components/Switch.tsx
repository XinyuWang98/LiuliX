import { logger } from '@/utils/logger';
import '../SettingsPage.css';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    id?: string;
}

const Switch = ({ checked, onChange, id }: SwitchProps) => {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        logger.debug('UI', 'Switch clicked, toggling', { data: { to: !checked } });
        onChange(!checked);
    };

    return (
        <div
            className={`switch-root ${checked ? 'checked' : ''}`}
            onClick={handleClick}
            role="switch"
            aria-checked={checked}
            id={id}
            style={{ cursor: 'pointer', zIndex: 10 }} // Ensure it's clickable
        >
            <div className="switch-thumb" />
        </div>
    );
};

export default Switch;
