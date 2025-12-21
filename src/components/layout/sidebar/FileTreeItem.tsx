import React from 'react';
import { FileText, X } from 'lucide-react';
import { ProjectFile } from '@utils/projectUtils';

interface FileTreeItemProps {
    file: ProjectFile;
    projectId: string;
    onFileClick: (projectId: string, fileId: string) => void;
    onRemoveFile: (projectId: string, fileId: string) => void;
    aiStatus: {
        status: 'pending' | 'processing' | 'ready' | 'error';
        progress?: number;
        fileName?: string;
    } | undefined;
    t: (key: string) => string;
}

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
    file,
    projectId,
    onFileClick,
    onRemoveFile,
    aiStatus,
    t
}) => {
    // 兼容性处理：如果旧数据是字符串，将其视为status
    const statusValue = typeof aiStatus === 'string' ? aiStatus : aiStatus?.status;

    const renderAIStatusIcon = () => {
        if (statusValue === 'ready') {
            return <span style={{ color: 'var(--success, #10b981)', marginLeft: '4px', fontSize: '12px' }} title="AI建议已就绪">✅</span>;
        }
        if (statusValue === 'processing') {
            return <span style={{ color: 'var(--warning, #f59e0b)', marginLeft: '4px', fontSize: '12px' }} title="AI建议生成中">🔄</span>;
        }
        if (statusValue === 'error') {
            return <span style={{ color: 'var(--error, #ef4444)', marginLeft: '4px', fontSize: '12px' }} title="AI建议生成失败">⚠️</span>;
        }
        return null;
    };

    return (
        <div
            className="tree-row file-row"
            onClick={(e) => {
                e.stopPropagation();
                onFileClick(projectId, file.id);
            }}
            style={{
                height: 'var(--tree-row-height)',
                paddingLeft: 'calc(var(--tree-indent) + var(--gap-s))',
                paddingRight: 'var(--gap-s)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                background: 'transparent',
                borderLeft: '2px solid transparent',
                borderRadius: '0px',
                transition: 'background 0.1s',
                color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
                const actions = e.currentTarget.querySelector('.file-actions') as HTMLElement;
                if (actions) actions.style.display = 'flex';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
                const actions = e.currentTarget.querySelector('.file-actions') as HTMLElement;
                if (actions) actions.style.display = 'none';
            }}
        >
            <FileText size={13} style={{ opacity: 0.7 }} />
            <span style={{
                fontSize: 'var(--fs-sm)',
                flex: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }} title={file.data.fileName}>
                {file.data.fileName}
            </span>

            {renderAIStatusIcon()}

            {/* 文件操作按钮 */}
            <div className="file-actions" style={{
                display: 'none',
                marginLeft: 'auto'
            }}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(projectId, file.id);
                    }}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '2px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                    }}
                    title={t('common.delete')}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--warning)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                    <X size={12} />
                </button>
            </div>
        </div>
    );
};
