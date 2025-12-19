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
                <p className="hypothesis-card__verification">{hypothesis.verificationMethod}</p>
            </div>

            <div className="hypothesis-card__expand-icon">
                {hypothesis.isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
        </div>
    );
}
