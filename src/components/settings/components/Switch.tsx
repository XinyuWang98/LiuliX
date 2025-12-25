
import '../SettingsPage.css';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    id?: string;
}

export const Switch = ({ checked, onChange, id }: SwitchProps) => {
    return (
        <div
            className="ios-switch"
            data-checked={checked}
            onClick={() => onChange(!checked)}
            role="switch"
            aria-checked={checked}
            id={id}
        >
            <div className="ios-switch-thumb" />
        </div>
    );
};
