import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '@contexts/I18nContext';
import { ColumnMetadata } from '@/types/duckdb';

interface ColumnSelectorButtonProps {
    selectedColumns: number[];
    totalColumns: number;
    columns: ColumnMetadata[];
    onSelectionChange: (columns: number[]) => void;
}

/**
 * 列选择器按钮组件
 * 使用 React Portal 将下拉框渲染到 body 根节点，避免层叠上下文问题
 */
export function ColumnSelectorButton({
    selectedColumns,
    totalColumns,
    columns,
    onSelectionChange
}: ColumnSelectorButtonProps) {
    const { t } = useI18n();
    const [showDropdown, setShowDropdown] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // 计算下拉框位置
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (showDropdown && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 4, // 按钮底部 + 4px间隙
                left: rect.right - 250 // 右对齐（下拉框宽度250px）
            });
        }
    }, [showDropdown]);

    // 点击外部关闭下拉框
    useEffect(() => {
        if (!showDropdown) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);

    // 全选
    const handleSelectAll = () => {
        onSelectionChange(columns.map((_, idx) => idx));
    };

    // 取消全选
    const handleDeselectAll = () => {
        onSelectionChange([]);
    };

    // 切换单个列
    const handleToggleColumn = (idx: number) => {
        if (selectedColumns.includes(idx)) {
            onSelectionChange(selectedColumns.filter(i => i !== idx));
        } else {
            onSelectionChange([...selectedColumns, idx].sort((a, b) => a - b));
        }
    };

    // 下拉框内容
    const dropdownContent = showDropdown ? (
        <div
            ref={dropdownRef}
            className="column-selector-dropdown"
            style={{
                position: 'fixed', // 使用fixed定位基于viewport
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
            }}
        >
            {/* 全选/取消全选按钮 - 固定在顶部 */}
            <div className="column-selector-actions">
                <button
                    onClick={handleSelectAll}
                    className="column-selector-action-btn"
                >
                    {t('grid.selectAll')}
                </button>
                <button
                    onClick={handleDeselectAll}
                    className="column-selector-action-btn"
                >
                    {t('grid.deselectAll')}
                </button>
            </div>

            {/* 列选择列表 - 可滚动区域 */}
            <div className="column-selector-list">
                {columns.map((col, idx) => (
                    <label
                        key={idx}
                        className="column-selector-item"
                    >
                        <input
                            type="checkbox"
                            checked={selectedColumns.includes(idx)}
                            onChange={() => handleToggleColumn(idx)}
                            className="column-selector-checkbox"
                        />
                        <span className="column-selector-col-name">
                            {col.name}
                        </span>
                        <span className="column-selector-col-type">
                            {col.type}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    ) : null;

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => setShowDropdown(!showDropdown)}
                className="data-viewer-btn"
            >
                <span>{t('grid.selectedColumns', {
                    count: selectedColumns.length,
                    total: totalColumns
                })}</span>
            </button>

            {/* 使用 Portal 将下拉框渲染到 body 根节点 */}
            {dropdownContent && createPortal(dropdownContent, document.body)}
        </>
    );
}
