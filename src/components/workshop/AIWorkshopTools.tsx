import React, { useState } from 'react';
import { Share2, Mic, Presentation } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { Project } from '../../utils/projectUtils';
import { DuckDBEngine } from '../../db/duckdbEngine';
import { generateAICleaningSuggestions } from '../../services/aiCleaningService';
// removed DataQualityService
import { EvidencePool } from '../evidence/EvidencePool';
import './AIWorkshopTools.css';

interface AIWorkshopToolsProps {
    project: Project | null;
    onToolClick?: (toolId: string) => void;
    onSuggestionsGenerated?: (suggestions: any[]) => void;
    // removed DataQualityService
}

// 工具配置
const TOOLS = [
    {
        id: 'mindMap',
        icon: Share2,
        nameKey: 'workshop.mindMap',
        descKey: 'workshop.mindMapDesc'
    },
    {
        id: 'voiceReport',
        icon: Mic,
        nameKey: 'workshop.voiceReport',
        descKey: 'workshop.voiceReportDesc'
    },
    {
        id: 'pptReport',
        icon: Presentation,
        nameKey: 'workshop.pptReport',
        descKey: 'workshop.pptReportDesc'
    }
];

export const AIWorkshopTools: React.FC<AIWorkshopToolsProps> = ({ project, onToolClick, onSuggestionsGenerated }) => {
    const { t } = useI18n();
    const [loadingTool, setLoadingTool] = useState<string | null>(null);
    const [hoveredTool, setHoveredTool] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false); // 🚀 防重复点击

    // Auto Health Check REMOVED

    const handleToolClick = async (toolId: string) => {
        // 🚀 防重复点击保护
        if (isGenerating) {
            console.log('[AI工坊] ⏸️ 正在生成中，请勿重复点击');
            return;
        }

        // Mock Tools
        if (['mindMap', 'voiceReport', 'pptReport'].includes(toolId)) {
            alert(t('common.featureInDev'));
            return;
        }

        if (toolId === 'cleaning' && project) {
            // Keep existing cleaning logic for future restoration if needed
            // ... (Logic is preserved but currently unreachable via UI)
            setIsGenerating(true); // 🚀 标记开始生成
            setLoadingTool(toolId);
            setProgress(0);

            try {
                // 获取当前文件
                let currentFile = null;
                for (let i = project.files.length - 1; i >= 0; i--) {
                    if (project.files[i].data.tableName) {
                        currentFile = project.files[i];
                        break;
                    }
                }

                if (!currentFile) {
                    alert('❌ 未找到有效文件');
                    return;
                }

                console.log('[AI工坊] 当前文件:', currentFile.id);
                console.log('[AI工坊] tableName:', currentFile.data.tableName);
                console.log('[AI工坊] columns:', currentFile.data.columns?.length || 0);

                let columns = currentFile.data.columns;
                let tableName = currentFile.data.tableName; // 🚀 改为let，允许更新
                let columnInfos: any[] = [];

                // 1. 尝试从文件数据构建列信息
                if (columns && columns.length > 0) {
                    const types = currentFile.data.types || [];
                    columnInfos = columns.map((name, i) => ({
                        name,
                        type: types[i] || 'VARCHAR' // 默认为VARCHAR
                    }));
                }

                // DuckDB fallback
                if (!columns || columns.length === 0) {
                    console.log('[AI工坊] ⚠️ columns为空，尝试从DuckDB获取schema');
                    const engine = DuckDBEngine.getInstance();
                    const tables = await engine.queryChunk('information_schema.tables', 0, 100);
                    const latestTable = tables
                        .filter((t: any) => t.table_name && String(t.table_name).startsWith('t_'))
                        .sort((a: any, b: any) => String(b.table_name).localeCompare(String(a.table_name)))[0];

                    if (latestTable) {
                        const latestTableName = String(latestTable.table_name);
                        console.log('[AI工坊] ✅ 最新表:', latestTableName);

                        // 🚀 更新tableName为最新表名
                        if (tableName !== latestTableName) {
                            console.log('[AI工坊] 🔄 更新tableName:', tableName, '→', latestTableName);
                            tableName = latestTableName;
                        }

                        const schema = await engine.getTableColumns(latestTableName);
                        columns = schema.map((c: any) => c.name);
                        columnInfos = schema.map((c: any) => ({ name: c.name, type: c.type }));

                        await engine.queryChunk(latestTableName, 0, 100);
                        console.log('[AI工坊] ✅ 从DuckDB获取columns:', columns.length);
                    }
                }

                if (!columns || columns.length === 0) {
                    alert('❌ 无法获取数据列信息');
                    return;
                }

                console.log('[AI工坊] ✅ DuckDB fallback成功');


                const suggestions = await generateAICleaningSuggestions(
                    tableName || 'unknown',
                    columnInfos,
                    [],
                    t,
                    undefined,
                    (progressMsg: string) => {
                        console.log('[AI工坊]', progressMsg);
                        // 简单的进度估算
                        if (progressMsg.includes('Step 1')) setProgress(25);
                        else if (progressMsg.includes('Step 2')) setProgress(50);
                        else if (progressMsg.includes('Step 3')) setProgress(75);
                        else if (progressMsg.includes('JSON')) setProgress(90);
                    },
                    // Progressive Update Callback
                    (updatedSuggestions) => {
                        if (onSuggestionsGenerated) {
                            onSuggestionsGenerated(updatedSuggestions);
                        }
                    }
                );

                setProgress(100);

                console.log('[AI工坊] ✅ 成功获得', suggestions.length, '条建议');
                suggestions.forEach((sugg: any, idx: number) => {
                    console.log(`  ${idx + 1}. [${sugg.type}] ${sugg.label}`);
                    console.log(`     ${sugg.reason}`);
                });

                // Final guarantee update
                if (onSuggestionsGenerated) {
                    onSuggestionsGenerated(suggestions);
                    console.log('[AI工坊] ✅ 建议已传递到DataCleaner (Final)');
                }

            } catch (error: any) {
                console.error('[AI工坊] ❌ 失败:', error);
                alert(`❌ 失败: ${error.message}`);
            } finally {
                setLoadingTool(null);
                setIsGenerating(false); // 🚀 重置生成状态
            }
        }

        if (onToolClick) {
            onToolClick(toolId);
        }
    };

    return (
        <div className="aiWorkshopContainer">
            <div className="aiWorkshopGrid">
                {TOOLS.map(tool => {
                    const Icon = tool.icon;
                    const isLoading = loadingTool === tool.id;
                    const isHovered = hoveredTool === tool.id;

                    return (
                        <div
                            key={tool.id}
                            className={`toolGridItem ${isLoading ? 'loading' : ''}`}
                            onClick={() => !isLoading && handleToolClick(tool.id)}
                            onMouseEnter={() => setHoveredTool(tool.id)}
                            onMouseLeave={() => setHoveredTool(null)}
                        >
                            <div className="toolIcon">
                                <Icon size={24} />
                            </div>
                            <div className="toolName">{t(tool.nameKey as any)}</div>

                            {/* Health Score Badge REMOVED */}

                            {/* Loading Progress */}
                            {isLoading && (
                                <>
                                    <div className="toolProgressText">{progress}%</div>
                                    <div className="toolProgressBar">
                                        <div
                                            className="toolProgressFill"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Hover Tooltip - Hide when loading */}
                            {isHovered && !isLoading && (
                                <div className="toolTooltip">
                                    {t(tool.descKey as any)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="evidencePoolWrapper">
                <EvidencePool />
            </div>
        </div>
    );
};
