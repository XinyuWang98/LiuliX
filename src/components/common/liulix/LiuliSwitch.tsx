import './liulix.css';

export interface LiuliSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}

export const LiuliSwitch = ({
    checked,
    onChange,
    disabled = false,
    className = ''
}: LiuliSwitchProps) => {
    return (
        <div
            className={`liuli-switch ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} ${className}`}
            onClick={() => !disabled && onChange(!checked)}
        >
            <div className="liuli-switch-thumb" />
        </div>
    );
};
