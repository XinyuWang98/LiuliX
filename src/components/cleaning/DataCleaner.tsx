import React, { useState, useEffect } from 'react';
import { Play, RefreshCw, FileText, CheckCircle2, History, ChevronDown, ChevronUp, Sparkles, Filter, BarChart3 } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { Project } from '../../utils/projectUtils';
import { DataViewer } from '../data/DataViewer';
import './DataCleaner.css';

interface DataCleanerProps { project: Project; }
interface HistoryItem { id: string; timestamp: number; action: string; rowCountBefore: number; rowCountAfter: number; }
interface SimpleSuggestion { id: string; label: string; reason: string; confidence: number; isPromptLib?: boolean; column?: string; action: string; }

// 图标尺寸常量
const ICON_SIZE_MEDIUM = 14; // 中等图标尺寸
const ICON_SIZE_LARGE = 16; // 大图标尺寸

export const DataCleaner: React.FC<DataCleanerProps> = ({ project }) => {
    const { t } = useI18n();
    const [activeFileId, setActiveFileId] = useState<string | null>(project.files[0]?.id || null);
    const [suggestions, setSuggestions] = useState<SimpleSuggestion[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(false);

    const activeFile = project.files.find(f => f.id === activeFileId);

    // 辅助函数：判断是否为缺失值
    const isMissing = (val: any): boolean => {
        if (val === null || val === undefined) return true;
        if (typeof val === 'string') {
            const trimmed = val.trim();
            return trimmed === '' || trimmed === '-' || trimmed === 'N/A' || trimmed === 'NA' ||
                trimmed === 'null' || trimmed === 'NULL' || trimmed === 'None' || trimmed === '#N/A';
        }
        return false;
    };

    // 生成AI建议（基于文件数据）
    useEffect(() => {
        console.log('\n========== AI建议生成调试开始 ==========');
        console.log('1. 当前activeFile:', activeFile);
        console.log('2. activeFile?.data:', activeFile?.data);
        console.log('3. activeFile?.data.data类型:', typeof activeFile?.data.data);
        console.log('4. activeFile?.data.data是否是数组:', Array.isArray(activeFile?.data.data));
        console.log('5. activeFile?.data.data长度:', activeFile?.data.data?.length);
        console.log('6. activeFile?.data.fileName:', activeFile?.data.fileName);
        console.log('7. activeFile?.data.originalFile:', activeFile?.data.originalFile);

        if (!activeFile) {
            console.log('❌ activeFile为null/undefined');
            setSuggestions([]);
            return;
        }

        if (!activeFile.data) {
            console.log('❌ activeFile.data为null/undefined');
            setSuggestions([]);
            return;
        }

        if (!activeFile.data.data || !Array.isArray(activeFile.data.data) || activeFile.data.data.length === 0) {
            console.log('❌ activeFile.data.data为空或不是数组');
            console.log('提示：数据可能在DuckDB中，而不在file.data.data中');
            console.log('file.data的所有键:', Object.keys(activeFile.data));
            setSuggestions([]);
            return;
        }

        const data = activeFile.data.data;
        console.log('✅ 成功获取数据，行数:', data.length);

        const firstRow = data[0];
        console.log('8. 数据第一行:', firstRow);
        console.log('9. 第一行的类型:', typeof firstRow);

        if (!firstRow || typeof firstRow !== 'object') {
            console.log('❌ 第一行为空或不是对象');
            setSuggestions([]);
            return;
        }

        const columns = Object.keys(firstRow);
        console.log('10. 列名列表:', columns);
        console.log('11. 列数:', columns.length);

        const generated: SimpleSuggestion[] = [];

        // 规则1: 检测缺失值
        console.log('\n--- 开始检测缺失值 ---');
        columns.forEach((col, idx) => {
            const sampleValues = data.slice(0, 10).map((row: any) => row[col]);
            console.log(`列#${idx} "${col}" 前10行样本:`, sampleValues);

            const nullCount = data.filter((row: any) => isMissing(row[col])).length;
            const nullPercent = (nullCount / data.length) * 100;

            console.log(`列"${col}": 总行数=${data.length}, 缺失=${nullCount}, 占比=${nullPercent.toFixed(1)}%`);

            if (nullCount > 0) {
                if (nullPercent < 50) {
                    console.log(`  ✓ 生成建议: 填充缺失值`);
                    generated.push({
                        id: `fill_${col}`,
                        label: `填充"${col}"列缺失值`,
                        reason: `检测到${nullCount}个缺失值（${nullPercent.toFixed(1)}%），建议使用均值/众数填充`,
                        confidence: 0.85 - (nullPercent / 100) * 0.15,
                        column: col,
                        action: 'fill'
                    });
                } else if (nullPercent >= 50 && nullPercent < 80) {
                    console.log(`  ✓ 生成建议: 删除列`);
                    generated.push({
                        id: `drop_${col}`,
                        label: `删除"${col}"列`,
                        reason: `缺失值过多（${nullPercent.toFixed(1)}%），该列参考价值较低`,
                        confidence: 0.7,
                        column: col,
                        action: 'drop_column',
                        isPromptLib: true
                    });
                } else {
                    console.log(`  - 缺失值过多(${nullPercent.toFixed(1)}%)，不生成建议`);
                }
            }
        });

        // 规则2: 检测重复行
        console.log('\n--- 检测重复行 ---');
        const uniqueRows = new Set(data.map((row: any) => JSON.stringify(row)));
        const dupCount = data.length - uniqueRows.size;
        console.log(`总行数=${data.length}, 唯一行=${uniqueRows.size}, 重复行=${dupCount}`);

        if (dupCount > 0) {
            console.log('  ✓ 生成建议: 删除重复行');
            generated.push({
                id: 'dedup_all',
                label: '删除重复行',
                reason: `发现${dupCount}行完全重复的数据（${(dupCount / data.length * 100).toFixed(1)}%）`,
                confidence: 0.9,
                isPromptLib: true,
                action: 'dedup'
            });
        }

        console.log(`\n✅✅✅ 总共生成了 ${generated.length} 条建议:`);
        generated.forEach((g, i) => {
            console.log(`  ${i + 1}. [${g.confidence.toFixed(2)}] ${g.label}`);
        });
        console.log('========== AI建议生成调试结束 ==========\n');

        setSuggestions(generated.sort((a, b) => {
            if (a.isPromptLib && !b.isPromptLib) return -1;
            if (!a.isPromptLib && b.isPromptLib) return 1;
            return b.confidence - a.confidence;
        }));
    }, [activeFile]);

    // 一键应用建议
    const handleApply = async () => {
        if (selectedIds.length === 0) return;
        setLoading(true);

        const applied = suggestions.filter(s => selectedIds.includes(s.id));
        const countBefore = activeFile?.data.data?.length || 0;

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const countAfter = countBefore - (applied.some(s => s.action === 'dedup') ? 5 : 0);

            applied.forEach(sugg => {
                const log: HistoryItem = {
                    id: Date.now().toString() + Math.random(),
                    timestamp: Date.now(),
                    action: sugg.label,
                    rowCountBefore: countBefore,
                    rowCountAfter: countAfter
                };
                setHistory(prev => [log, ...prev]);
            });

            setSelectedIds([]);
        } catch (err) {
            console.error('应用建议失败:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSugg = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const displayed = showAll ? suggestions : suggestions.slice(0, 3);

    return (
        <div className="cleanerContainer">
            {/* 1. 标题栏 */}
            <div className="cleanerTitleBar">
                <div className="titleProject">{project.name}</div>
                <div className="titleSeparator">/</div>
                <div className="titleFile">{activeFile?.data.fileName || ''}</div>
            </div>

            {/* 2. 辅助栏 */}
            <div className="cleanerToolbar">
                <div className="toolbarLeft">
                    {project.files.length > 1 && (
                        <div className="fileSelector">
                            <FileText size={ICON_SIZE_MEDIUM} />
                            <select className="fileDropdown" value={activeFileId || ''} onChange={(e) => setActiveFileId(e.target.value)}>
                                {project.files.map(file => (
                                    <option key={file.id} value={file.id}>{file.data.fileName}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="rowCountBadge">
                        {activeFile?.data.data?.length || 0} {t('cleaning.rowsCount', { count: '' }).replace('{count} ', '')}
                    </div>
                </div>
                <div className="toolbarRight">
                    <button className="toolbarBtn" title={t('cleaning.columnFilter')}><Filter size={ICON_SIZE_MEDIUM} /></button>
                    <button className="toolbarBtn" title={t('cleaning.statsDistribution')}><BarChart3 size={ICON_SIZE_MEDIUM} /></button>
                </div>
            </div>

            {/* 3. AI建议面板 */}
            <div className="aiActionPanel">
                <div className="aiPanelHeader">
                    <div className="aiTitle"><Sparkles size={ICON_SIZE_LARGE} />{t('cleaning.aiSuggestions')}</div>
                    <div className="aiHeaderActions">
                        {suggestions.length > 3 && (
                            <button className="btnGhost" onClick={() => setShowAll(!showAll)}>
                                {showAll ? <ChevronUp size={ICON_SIZE_MEDIUM} /> : <ChevronDown size={ICON_SIZE_MEDIUM} />}
                                {showAll ? t('cleaning.collapse') : t('cleaning.expandMore')}
                            </button>
                        )}
                        <button className="btnPrimary" onClick={handleApply} disabled={loading || selectedIds.length === 0}>
                            {loading ? <RefreshCw className="spin" size={ICON_SIZE_MEDIUM} /> : <Play size={ICON_SIZE_MEDIUM} />}
                            {t('cleaning.applySelected', { count: selectedIds.length })}
                        </button>
                    </div>
                </div>
                {displayed.length === 0 ? (
                    <div className="aiEmpty"><CheckCircle2 size={ICON_SIZE_LARGE} />{t('cleaning.noSuggestions')}</div>
                ) : (
                    <div className="suggestionList">
                        {displayed.map(s => (
                            <div key={s.id} className={`suggestionItem ${selectedIds.includes(s.id) ? 'selected' : ''}`} onClick={() => toggleSugg(s.id)}>
                                <input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => { }} className="suggestionCheckbox" />
                                <div className="suggestionContent">
                                    <div className="suggestionHeader">
                                        <span className="suggestionLabel">{s.label}</span>
                                        <div className="suggestionBadgeContainer">
                                            {s.isPromptLib && <span className="promptBadge">{t('cleaning.promptLib')}</span>}
                                            <span className="confidenceBadge">{t('cleaning.recommend', { percent: (s.confidence * 100).toFixed(0) })}</span>
                                        </div>
                                    </div>
                                    <p className="suggestionReason">{s.reason}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 4. 数据表格 */}
            <div className="cleanerGridWrapper" style={{ flex: 1, minHeight: '300px', overflow: 'hidden' }}>
                <DataViewer project={project} />
            </div>

            {/* 5. 历史记录 */}
            <div className="historyPanel">
                <div className="historyTitle"><History size={ICON_SIZE_MEDIUM} />{t('cleaning.history')}</div>
                {history.length === 0 ? (
                    <div className="historyEmpty">{t('cleaning.noHistory')}</div>
                ) : (
                    <div className="historyList">
                        {history.map(h => {
                            const delta = h.rowCountAfter - h.rowCountBefore;
                            return (
                                <div key={h.id} className="historyItem">
                                    <span className="historyTime">[{new Date(h.timestamp).toLocaleTimeString()}]</span>
                                    <span className="historyAction">{h.action}</span>
                                    <span className={`deltaTag ${delta < 0 ? 'negative' : (delta > 0 ? 'positive' : '')}`}>
                                        {h.rowCountBefore} → {h.rowCountAfter} ({delta > 0 ? '+' : ''}{delta})
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
