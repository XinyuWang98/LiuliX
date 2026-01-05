import { Download, ZoomIn, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { ImagePreviewModal } from '../common/ImagePreviewModal';
import './ChartImage.css';

interface ChartImageProps {
    /** 图片URL（必填） */
    src: string;

    /** 图片描述（用于alt和下载文件名） */
    alt?: string;

    /** 场景类型（影响最大高度） */
    variant?: 'card' | 'report' | 'thumbnail';

    /** 是否可点击全屏（默认true） */
    clickable?: boolean;

    /** 是否显示下载按钮（默认true） */
    downloadable?: boolean;

    /** 自定义className */
    className?: string;

    /** 加载回调 */
    onLoad?: () => void;

    /** 错误回调 */
    onError?: (error: Error) => void;
}

export function ChartImage({
    src,
    alt = '图表',
    variant = 'card',
    clickable = true,
    downloadable = true,
    className = '',
    onLoad,
    onError
}: ChartImageProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showToolbar, setShowToolbar] = useState(false);

    // 图片加载成功
    const handleImageLoad = () => {
        setIsLoading(false);
        setHasError(false);
        onLoad?.();
    };

    // 图片加载失败
    const handleImageError = () => {
        setIsLoading(false);
        setHasError(true);
        const error = new Error(`图片加载失败: ${src}`);
        onError?.(error);
    };

    // 点击图片 → 全屏预览
    const handleImageClick = () => {
        if (clickable && !hasError) {
            setShowPreview(true);
        }
    };

    // 下载图片
    const handleDownload = (e: React.MouseEvent) => {
        e.stopPropagation(); // 阻止触发全屏预览

        // 创建隐藏的a标签下载
        const link = document.createElement('a');
        link.href = src;
        link.download = `${alt.replace(/\s+/g, '-')}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <div
                className={`chart-image-wrapper chart-image-wrapper--${variant} ${className}`}
                onMouseEnter={() => setShowToolbar(true)}
                onMouseLeave={() => setShowToolbar(false)}
            >
                {/* 加载状态 - 骨架屏 */}
                {isLoading && (
                    <div className="chart-image-skeleton">
                        <div className="skeleton-shimmer"></div>
                    </div>
                )}

                {/* 错误状态 */}
                {hasError && (
                    <div className="chart-image-error">
                        <AlertCircle size={48} />
                        <p>图片加载失败</p>
                    </div>
                )}

                {/* 图片主体 */}
                {!hasError && (
                    <img
                        src={src}
                        alt={alt}
                        className={`chart-image chart-image--${variant} ${isLoading ? 'chart-image--loading' : ''}`}
                        onClick={handleImageClick}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        style={{ cursor: clickable ? 'var(--img-chart-cursor)' : 'default' }}
                    />
                )}

                {/* 悬停工具栏 */}
                {showToolbar && !hasError && !isLoading && (
                    <div className="chart-image-toolbar">
                        {downloadable && (
                            <button
                                className="toolbar-btn toolbar-btn--download"
                                onClick={handleDownload}
                                title="下载图片"
                            >
                                <Download size={16} />
                            </button>
                        )}
                        {clickable && (
                            <button
                                className="toolbar-btn toolbar-btn--fullscreen"
                                onClick={handleImageClick}
                                title="全屏预览"
                            >
                                <ZoomIn size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 全屏预览Modal */}
            {showPreview && (
                <ImagePreviewModal
                    imageUrl={src}
                    altText={alt}
                    onClose={() => setShowPreview(false)}
                    downloadable={downloadable}
                    downloadFileName={`${alt.replace(/\s+/g, '-')}-${Date.now()}.png`}
                />
            )}
        </>
    );
}
