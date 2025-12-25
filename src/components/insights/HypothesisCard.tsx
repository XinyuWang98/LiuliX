import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { HypothesisCard as HypothesisCardType } from '@/types/insightChain';
import './HypothesisCard.css';

interface HypothesisCardProps {
    hypothesis: HypothesisCardType;
    isActive: boolean;
    onClick: () => void;
}

export function HypothesisCard({ hypothesis, isActive, onClick }: HypothesisCardProps) {
    return (
        <div
            className={`hypothesis-card ${isActive ? 'active' : ''}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
        >
            <div className="hypothesis-card__icon">
                <Lightbulb size={24} />
            </div>

            <div className="hypothesis-card__content">
                <h3 className="hypothesis-card__title">{hypothesis.title}</h3>
                {/* 🆕 元数据标签：文件名和列名 */}
                {(hypothesis.fileName || (hypothesis.columnsUsed && hypothesis.columnsUsed.length > 0)) && (
                    <div className="hypothesis-card__metadata">
                        {hypothesis.fileName && (
                            <span className="metadata-tag metadata-file">
                                📄 {hypothesis.fileName}
                            </span>
                        )}
                        {hypothesis.columnsUsed && hypothesis.columnsUsed.length > 0 && (
                            <span className="metadata-tag metadata-columns">
                                📊 {hypothesis.columnsUsed.slice(0, 3).join(', ')}
                                {hypothesis.columnsUsed.length > 3 && ` +${hypothesis.columnsUsed.length - 3}`}
                            </span>
                        )}
                    </div>
                )}
                <p className="hypothesis-card__verification">{hypothesis.verificationMethod}</p>
            </div>

            <div className="hypothesis-card__expand-icon">
                {hypothesis.isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
        </div>
    );
}
