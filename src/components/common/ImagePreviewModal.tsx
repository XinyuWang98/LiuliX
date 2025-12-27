import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ImagePreviewModal.css';

interface ImagePreviewModalProps {
    imageUrl: string;
    altText?: string;
    onClose: () => void;
}

export function ImagePreviewModal({ imageUrl, altText = 'Preview', onClose }: ImagePreviewModalProps) {
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
                <button className="image-preview-close-btn" onClick={onClose}>
                    <X size={24} />
                </button>
                <img src={imageUrl} alt={altText} className="image-preview-img" />
            </div>
        </div>,
        document.body
    );
}
