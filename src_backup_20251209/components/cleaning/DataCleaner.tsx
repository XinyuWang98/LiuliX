import React, { useState } from 'react';
import { Play, RefreshCw, Wand2, Trash2, ArrowRight } from 'lucide-react';
import { DuckDBEngine } from '../../db/duckdbEngine';
import { useI18n } from '../../contexts/I18nContext';
import { generateCleaningSQL } from '../../services/aiService';
import './DataCleaner.css';

interface DataCleanerProps {
    tableName: string;
    onTableUpdate: (newTableName: string) => void;
}

export const DataCleaner: React.FC<DataCleanerProps> = ({ tableName, onTableUpdate }) => {
    const { t } = useI18n();
    const [sql, setSql] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const engine = DuckDBEngine.getInstance();

    const handleGenerateSQL = async (intentKey: string) => {
        setAiLoading(true);
        setError(null);
        try {
            const columns = await engine.getTableColumns(tableName);
            const schemaStr = columns.map(c => `${c.name} (${c.type})`).join(', ');

            // 使用辅助函数生成纯净 SQL
            const generatedSQL = await generateCleaningSQL(
                tableName,
                schemaStr,
                t(intentKey) // 传入翻译后的用户意图
            );

            setSql(generatedSQL);
        } catch (err: any) {
            setError(err.message || t('common.error'));
        } finally {
            setAiLoading(false);
        }
    };

    const handleExecute = async () => {
        if (!sql) return;
        setLoading(true);
        setError(null);
        try {
            await engine.executeCleaningSQL(sql);

            // 正则解析新表名 (CREATE TABLE xxx AS ...)
            // 简单支持 CREATE OR REPLACE TABLE xxx ...
            // 或者是 ALTER TABLE ...
            // 如果没解析到，默认认为表名没变
            let newTable = tableName;
            const createMatch = sql.match(/CREATE\s+(?:OR\s+REPLACE\s+)?TABLE\s+([a-zA-Z0-9_]+)/i);
            if (createMatch && createMatch[1]) {
                newTable = createMatch[1];
            }

            onTableUpdate(newTable);
            setSql(''); // Success cleanup
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const suggestions = [
        { label: 'cleaning.dedup', icon: <RefreshCw size={14} />, intent: 'cleaning.intentDedup' },
        { label: 'cleaning.fillNull', icon: <Wand2 size={14} />, intent: 'cleaning.intentFillNull' },
        { label: 'cleaning.normalize', icon: <ArrowRight size={14} />, intent: 'cleaning.intentNormalize' },
        { label: 'cleaning.dropEmpty', icon: <Trash2 size={14} />, intent: 'cleaning.intentDropEmpty' }
    ];

    return (
        <div className="cleanerContainer">
            <div className="cleanerHeader">
                <h3 className="cleanerTitle">
                    <Wand2 size={16} />
                    {t('cleaning.title')}
                </h3>
                <span className="cleanerTableInfo">
                    {t('cleaning.currentTable')}: <code>{tableName}</code>
                </span>
            </div>

            {/* AI Suggestion Buttons */}
            <div className="cleanerSuggestions">
                {suggestions.map((s, i) => (
                    <button
                        key={i}
                        className="suggestionBtn"
                        onClick={() => handleGenerateSQL(s.intent)}
                        disabled={aiLoading || loading}
                    >
                        {aiLoading ? <span className="spin">...</span> : s.icon}
                        <span>{t(s.label)}</span>
                    </button>
                ))}
            </div>

            {/* SQL Editor Area */}
            <div className="editorContainer">
                <textarea
                    className="sqlEditor"
                    value={sql}
                    onChange={e => setSql(e.target.value)}
                    placeholder={t('cleaning.sqlPlaceholder')}
                    disabled={loading}
                />
                <div className="executeBtnWrapper">
                    <button
                        className="executeBtn"
                        onClick={handleExecute}
                        disabled={loading || !sql}
                    >
                        {loading ? <RefreshCw size={14} className="spin" /> : <Play size={14} />}
                        {t('cleaning.runSQL')}
                    </button>
                </div>
            </div>

            {error && (
                <div className="errorBox">
                    {t('common.error')}: {error}
                </div>
            )}
        </div>
    );
};
