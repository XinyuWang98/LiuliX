import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, Wand2, Trash2, ArrowRight } from 'lucide-react';
import { DuckDBEngine } from '../../db/duckdbEngine';
import { useI18n } from '../../contexts/I18nContext';
import { generateCleaningSQL } from '../../services/aiService';
import { VirtualDataGrid } from '../VirtualDataGrid';
import './DataCleaner.css';

interface DataCleanerProps {
    tableName: string;
    onTableUpdate: (newTableName: string) => void;
}

interface ColumnStat {
    name: string;
    type: string;
    total: number;
    nullCount: number;
    uniqueCount: number;
    min?: number;
    max?: number;
}

export const DataCleaner: React.FC<DataCleanerProps> = ({ tableName, onTableUpdate }) => {
    const { t } = useI18n();
    const [sql, setSql] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<ColumnStat[]>([]);
    const [rowCount, setRowCount] = useState(0);
    const [columns, setColumns] = useState<any[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const engine = DuckDBEngine.getInstance();

    // 1. Fetch Stats on mount or table update
    useEffect(() => {
        let active = true;
        const loadStats = async () => {
            try {
                // Parallel fetch for speed
                const [s, cols, rCount] = await Promise.all([
                    engine.getColumnStats(tableName),
                    engine.getTableColumns(tableName),
                    engine.queryChunk(tableName, 0, 0).then(() => {
                        return engine['conn']?.query(`SELECT count(*) as c FROM ${tableName}`).then(r => {
                            const row = r.get(0);
                            return row ? Number(row['c']) : 0;
                        }) || 0;
                    })
                ]);

                if (active) {
                    setStats(s);
                    setColumns(cols);
                    setRowCount(rCount);
                }
            } catch (e) {
                console.error("Failed to load stats", e);
            }
        };
        loadStats();
        return () => { active = false; };
    }, [tableName, refreshTrigger]);

    const handleGenerateSQL = async (intentKey: string) => {
        setAiLoading(true);
        setError(null);
        try {
            const columns = await engine.getTableColumns(tableName);
            const schemaStr = columns.map(c => `${c.name} (${c.type})`).join(', ');

            const generatedSQL = await generateCleaningSQL(
                tableName,
                schemaStr,
                t(intentKey)
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

            let newTable = tableName;
            const createMatch = sql.match(/CREATE\s+(?:OR\s+REPLACE\s+)?TABLE\s+([a-zA-Z0-9_]+)/i);
            if (createMatch && createMatch[1]) {
                newTable = createMatch[1];
            }

            onTableUpdate(newTable);
            setSql('');
            setRefreshTrigger(p => p + 1); // Force refresh stats and grid
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
            {/* 1. Header with Stats */}
            <div className="cleanerHeader">
                <div className="headerTitleRow">
                    <h3 className="cleanerTitle">
                        <Wand2 size={16} />
                        {t('cleaning.title')}
                    </h3>
                    <span className="cleanerTableInfo">{tableName}</span>
                </div>

                {/* Stats Row */}
                <div className="statsScrollContainer">
                    {stats.map(col => (
                        <div key={col.name} className="columnStatCard">
                            <div className="statName" title={col.name}>{col.name}</div>
                            <div className="statType">{col.type}</div>
                            <div className="statBar">
                                <div
                                    className="statFill"
                                    style={{
                                        width: `${Math.min(100, (col.nullCount / col.total) * 100)}%`,
                                        opacity: col.nullCount > 0 ? 1 : 0
                                    }}
                                    title={`Nulls: ${((col.nullCount / col.total) * 100).toFixed(1)}%`}
                                />
                            </div>
                            <div className="statMeta">
                                {col.min !== null && <span>Min: {Number(col.min).toFixed(1)}</span>}
                                {col.uniqueCount > 0 && <span>Uniq: {col.uniqueCount}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Main Grid */}
            <div className="cleanerGridWrapper">
                <VirtualDataGrid
                    tableName={tableName}
                    rowCount={rowCount}
                    columns={columns}
                    key={`${tableName}-${refreshTrigger}`}
                />
            </div>

            {/* 3. Actions Panel (SQL & AI) */}
            <div className="cleanerActions">
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

                <div className="editorContainer">
                    <div className="sqlInputRow">
                        <input
                            className="sqlInputOneLine"
                            value={sql}
                            onChange={e => setSql(e.target.value)}
                            placeholder={t('cleaning.sqlPlaceholder')}
                            disabled={loading}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleExecute();
                            }}
                        />
                        <button
                            className="executeBtnSmall"
                            onClick={handleExecute}
                            disabled={loading || !sql}
                        >
                            {loading ? <RefreshCw size={14} className="spin" /> : <Play size={14} />}
                        </button>
                    </div>
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
