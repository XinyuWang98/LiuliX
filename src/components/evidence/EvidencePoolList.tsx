import React from 'react';
import './EvidencePoolList.css';
import { useEvidence } from '@/contexts/EvidenceContext';
import type { EvidenceRecord } from '@/types/evidence';

/**
 * 证据池列表组件
 * 简化版证据池展示，仅显示标题列表
 */

export const EvidencePoolList: React.FC = () => {
    const { records } = useEvidence();

    if (records.length === 0) {
        return (
            <div className="evidence-pool-list evidence-pool-list--empty">
                <p className="evidence-pool-list__empty-text">
                    暂无证据
                </p>
            </div>
        );
    }

    return (
        <div className="evidence-pool-list">
            <div className="evidence-pool-list__header">
                <h3 className="evidence-pool-list__title">
                    证据池 ({records.length})
                </h3>
            </div>

            <ul className="evidence-pool-list__items">
                {records.map((evidence: EvidenceRecord) => (
                    <li key={evidence.id} className="evidence-pool-list__item">
                        <span className="evidence-pool-list__item-icon">
                            {evidence.type === 'insightChain' ? '📊' : '📝'}
                        </span>
                        <span className="evidence-pool-list__item-title" title={evidence.title}>
                            {evidence.title}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
