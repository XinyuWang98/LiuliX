import React, { useState, useRef, useEffect } from 'react';
import './liulix.css';

interface LiuliSelectOption {
    value: string;
    label: string;
}

interface LiuliSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: LiuliSelectOption[];
    label?: string;
    disabled?: boolean;
    className?: string;
}

export const LiuliSelect: React.FC<LiuliSelectProps> = ({
    value,
    onChange,
    options,
    label,
    disabled = false,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 点击外部关闭下拉菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={`liuli-select-container ${className}`} ref={containerRef}>
            {label && (
                <label className="liuli-select-label">
                    {label}
                </label>
            )}

            <div
                className={`liuli-select ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span className="liuli-select-value">
                    {selectedOption?.label || '请选择...'}
                </span>
                <span className="liuli-select-arrow">▼</span>
            </div>

            {isOpen && !disabled && (
                <div className="liuli-select-dropdown">
                    {options.map(option => (
                        <div
                            key={option.value}
                            className={`liuli-select-option ${option.value === value ? 'selected' : ''}`}
                            onClick={() => handleSelect(option.value)}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
