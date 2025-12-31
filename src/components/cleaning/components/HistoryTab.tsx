import React from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { HistoryItem } from '../types/cleaning.types';
import './HistoryTab.css';

interface HistoryTabProps {
    history: HistoryItem[];
}

/**
 * 历史记录标签页组件
 * 职责：展示数据清洗历史记录列表，包含时间戳、操作描述和行数变化
 */
export function HistoryTab({ history }: HistoryTabProps) {
    const { t } = useI18n();

    if (history.length === 0) {
        return (
            <div className="historyEmpty">
                {t('cleaning.noHistory')}
            </div>
        );
    }

    return (
        <div className="historyList">
            {history.map(record => {
                const delta = record.rowCountAfter - record.rowCountBefore;
                
                return (
                    <div key={record.id} className="historyItem">
                        <span className="historyTime">
                            [{new Date(record.timestamp).toLocaleTimeString()}]
                        </span>
                        <span className="historyAction">
                            {record.action}
                        </span>
                        <span className={`deltaTag ${delta < 0 ? 'negative' : (delta > 0 ? 'positive' : '')}`}>
                            {record.rowCountBefore} → {record.rowCountAfter} ({delta > 0 ? '+' : ''}{delta})
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
