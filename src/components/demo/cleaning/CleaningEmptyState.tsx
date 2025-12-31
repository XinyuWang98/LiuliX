import { Sparkles } from 'lucide-react';
import './CleaningEmptyState.css';

interface CleaningEmptyStateProps {
    type?: 'initial' | 'empty' | 'loading' | 'success' | 'error';
    message?: string;
}

/**
 * 数据清洗空状态组件（原子组件）
 * 遵循 LiuliX Ascension 视觉语言规范
 */
export const CleaningEmptyState = ({
    type = 'initial',
    message
}: CleaningEmptyStateProps) => {
    const getIcon = () => {
        switch (type) {
            case 'loading':
                return <div className="loading-spinner" />;
            case 'success':
                return <span className="empty-emoji">✅</span>;
            case 'error':
                return <span className="empty-emoji">⚠️</span>;
            default:
                return <Sparkles size={48} className="empty-icon" />;
        }
    };

    const getMessage = () => {
        if (message) return message;
        switch (type) {
            case 'empty':
                return '该分类下暂无建议';
            case 'loading':
                return '正在生成建议...';
            case 'success':
                return '所有建议已应用完成';
            case 'error':
                return 'AI 服务暂时不可用';
            default:
                return '暂无建议，试试让 AI 深度分析？';
        }
    };

    return (
        <div className={`cleaning-empty-state state-${type}`}>
            {getIcon()}
            <p className="empty-message">{getMessage()}</p>
        </div>
    );
};
