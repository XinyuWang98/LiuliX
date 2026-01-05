import { X, Download } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ImagePreviewModal.css';

interface ImagePreviewModalProps {
    imageUrl: string;
    altText?: string;
    onClose: () => void;

    /** 是否显示下载按钮（默认true） */
    downloadable?: boolean;

    /** 下载文件名 */
    downloadFileName?: string;
}

export function ImagePreviewModal({
    imageUrl,
    altText = 'Preview',
    onClose,
    downloadable = true,
    downloadFileName
}: ImagePreviewModalProps) {
    // 下载图片
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = downloadFileName || `image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // 监听 ESC 键关闭
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return createPortal(
        <div className="image-preview-modal-overlay" onClick={onClose}>
            <div className="image-preview-modal-content" onClick={e => e.stopPropagation()}>
                {/* 关闭按钮 */}
                <button className="image-preview-close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                {/* 下载按钮 */}
                {downloadable && (
                    <button className="image-preview-download-btn" onClick={handleDownload} title="下载图片">
                        <Download size={24} />
                    </button>
                )}

                <img src={imageUrl} alt={altText} className="image-preview-img" />
            </div>
        </div>,
        document.body
    );
}
