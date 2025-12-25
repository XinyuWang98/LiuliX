import { useState, useEffect } from 'react';
import { UploadCloud, Edit2, Trash2, FolderPlus, Database } from 'lucide-react';
import { useI18n } from '@/contexts/I18nContext';
import './DataSourceToolbar.css';

// 常量定义
const AUTO_CANCEL_TIMEOUT_MS = 3000; // 自动取消确认状态的时间（毫秒）

interface DataSourceToolbarProps {
    onUpload: () => void;
    onRename: () => void;
    onDelete: () => void;
    canRename: boolean;
    canDelete: boolean;
    selectionType: 'project' | 'file' | null;
}

/**
 * 数据源管理工具栏
 * 包含：连接数据库（预留）、上传文件/新建项目、重命名、删除
 */
export function DataSourceToolbar({
    onUpload,
    onRename,
    onDelete,
    canRename,
    canDelete,
    selectionType
}: DataSourceToolbarProps) {
    const { t } = useI18n();

    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    // 当选中项变化时，重置删除确认状态
    useEffect(() => {
        setIsConfirmingDelete(false);
    }, [selectionType, canDelete]);

    const handleDeleteClick = () => {
        if (isConfirmingDelete) {
            onDelete();
            setIsConfirmingDelete(false);
        } else {
            setIsConfirmingDelete(true);
            // 自动取消确认状态
            setTimeout(() => setIsConfirmingDelete(false), AUTO_CANCEL_TIMEOUT_MS);
        }
    };

    // 根据选中状态动态显示 tooltip
    const getUploadTooltip = () => {
        if (selectionType === 'project') return t('fileUpload.uploadButton');
        return t('dataSource.createProject');
    };

    // 动态计算删除按钮的 className
    const getDeleteButtonClass = () => {
        const classes = ['btn-ghost', 'toolbar-button'];
        if (!canDelete) {
            classes.push('disabled', 'toolbar-button--delete-disabled');
        } else if (isConfirmingDelete) {
            classes.push('toolbar-button--delete-confirming');
        } else {
            classes.push('toolbar-button--delete');
        }
        return classes.join(' ');
    };

    return (
        <div className="data-source-toolbar">
            {/* 数据库连接 (V1预留) */}
            <button
                className="btn-ghost toolbar-button toolbar-button--disabled"
                disabled
                title={t('dataSource.connectDatabase')}
            >
                <Database size={16} />
            </button>

            {/* 上传/新建按钮 */}
            <button
                className="btn-ghost toolbar-button"
                onClick={onUpload}
                title={getUploadTooltip()}
            >
                {selectionType === 'project' ? <UploadCloud size={16} /> : <FolderPlus size={16} />}
            </button>

            {/* 分隔线 */}
            <div className="toolbar-divider" />

            {/* 重命名按钮 */}
            <button
                className={`btn-ghost toolbar-button ${!canRename ? 'disabled toolbar-button--rename-disabled' : ''}`}
                onClick={canRename ? onRename : undefined}
                disabled={!canRename}
                title={t('common.rename')}
            >
                <Edit2 size={16} />
            </button>

            {/* 删除按钮 (二次确认) */}
            <button
                className={getDeleteButtonClass()}
                onClick={canDelete ? handleDeleteClick : undefined}
                onMouseLeave={() => isConfirmingDelete && setIsConfirmingDelete(false)}
                disabled={!canDelete}
                title={isConfirmingDelete ? t('common.confirm') : t('common.delete')}
            >
                {isConfirmingDelete ? (
                    <span className="toolbar-confirm-text">{t('common.confirm')}?</span>
                ) : (
                    <Trash2 size={16} />
                )}
            </button>
        </div>
    );
}
