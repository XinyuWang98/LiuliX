import '../SettingsPage.css';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    id?: string;
}

const Switch = ({ checked, onChange, id }: SwitchProps) => {
    return (
        <div
            className={`switch-root ${checked ? 'checked' : ''}`}
            onClick={() => onChange(!checked)}
            role="switch"
            aria-checked={checked}
            id={id}
        >
            <div className="switch-thumb" />
        </div>
    );
};

export default Switch;
