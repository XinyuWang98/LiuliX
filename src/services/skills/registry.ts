/**
 * Skills 注册表
 * 集中管理所有可用的 Skills，提供统一的查询和序列化接口
 */

import {
    SkillDefinition,
    VIZ_CREATE_CHART,
    CLEAN_REMOVE_DUPLICATES,
    CLEAN_FILL_MISSING,
    SYS_EXPORT_REPORT,
    SYS_SWITCH_THEME
} from './definitions';
import { SYS_RUN_PYTHON_SKILL } from './generic/sys_run_python';
import { SYS_RUN_SQL_SKILL } from './generic/sys_run_sql';

/** Skills 分类 */
export enum SkillCategory {
    VISUALIZATION = 'visualization',
    DATA_CLEANING = 'data_cleaning',
    SYSTEM = 'system',
    GENERIC = 'generic'  // 🆕 Generic Skills分类
}

/** Skill 注册条目 */
interface SkillRegistryEntry {
    definition: SkillDefinition;
    category: SkillCategory;
    enabled: boolean; // 用于动态挂载/卸载
}

/** Skills 注册表类 */
class SkillRegistry {
    private skills: Map<string, SkillRegistryEntry> = new Map();

    constructor() {
        this.registerDefaultSkills();
    }

    /** 注册默认 Skills */
    private registerDefaultSkills() {
        // 🆕 通用技能（Generic Skills）- 最高优先级
        this.register(SYS_RUN_PYTHON_SKILL, SkillCategory.GENERIC);
        this.register(SYS_RUN_SQL_SKILL, SkillCategory.GENERIC);

        // 可视化技能（保留示例）
        this.register(VIZ_CREATE_CHART, SkillCategory.VISUALIZATION);

        // 数据清洗技能（保留示例，未来可移除）
        this.register(CLEAN_REMOVE_DUPLICATES, SkillCategory.DATA_CLEANING);
        this.register(CLEAN_FILL_MISSING, SkillCategory.DATA_CLEANING);

        // 系统操作技能
        this.register(SYS_EXPORT_REPORT, SkillCategory.SYSTEM);
        this.register(SYS_SWITCH_THEME, SkillCategory.SYSTEM);
    }

    /** 注册单个 Skill */
    register(definition: SkillDefinition, category: SkillCategory, enabled = true) {
        this.skills.set(definition.name, {
            definition,
            category,
            enabled
        });
    }

    /** 获取单个 Skill 定义 */
    get(name: string): SkillDefinition | undefined {
        const entry = this.skills.get(name);
        return entry?.enabled ? entry.definition : undefined;
    }

    /** 获取所有启用的 Skills */
    getAllEnabled(): SkillDefinition[] {
        return Array.from(this.skills.values())
            .filter(entry => entry.enabled)
            .map(entry => entry.definition);
    }

    /** 按分类获取 Skills */
    getByCategory(category: SkillCategory): SkillDefinition[] {
        return Array.from(this.skills.values())
            .filter(entry => entry.enabled && entry.category === category)
            .map(entry => entry.definition);
    }

    /** 动态启用/禁用 Skill（用于 Token 优化） */
    setEnabled(name: string, enabled: boolean) {
        const entry = this.skills.get(name);
        if (entry) {
            entry.enabled = enabled;
        }
    }

    /**
     * 生成 OpenAI/DeepSeek Tools Schema
     * 用于 Native Function Calling API
     */
    toOpenAITools(): Array<{
        type: 'function';
        function: {
            name: string;
            description: string;
            parameters: {
                type: 'object';
                properties: Record<string, any>;
                required: string[];
            };
        };
    }> {
        return this.getAllEnabled().map(skill => ({
            type: 'function' as const,
            function: {
                name: skill.name,
                description: skill.description,
                parameters: {
                    type: 'object',
                    properties: Object.fromEntries(
                        Object.entries(skill.parameters).map(([key, param]) => [
                            key,
                            {
                                type: param.type,
                                description: param.description,
                                ...(param.enum && { enum: param.enum }),
                                ...(param.items && { items: param.items })
                            }
                        ])
                    ),
                    required: Object.entries(skill.parameters)
                        .filter(([_, param]) => param.required)
                        .map(([key]) => key)
                }
            }
        }));
    }

    /**
     * 生成 Prompt Shim 格式（用于 Qwen 等本地模型）
     * 将工具定义转为纯文本描述，注入到 System Prompt
     */
    toPromptShim(): string {
        const skills = this.getAllEnabled();
        if (skills.length === 0) return '';

        let shim = '你可以调用以下工具来完成任务，请严格按照 JSON 格式返回：\n\n';

        skills.forEach(skill => {
            shim += `【${skill.name}】\n`;
            shim += `功能：${skill.description}\n`;
            shim += `参数：\n`;

            Object.entries(skill.parameters).forEach(([key, param]) => {
                const required = param.required ? ' (必填)' : ' (可选)';
                const enumInfo = param.enum ? ` [可选值: ${param.enum.join(', ')}]` : '';
                shim += `  - ${key} (${param.type})${required}: ${param.description}${enumInfo}\n`;
            });
            shim += '\n';
        });

        shim += '返回格式示例：\n';
        shim += '```json\n';
        shim += '{\n';
        shim += '  "tool": "viz_create_chart",\n';
        shim += '  "arguments": {\n';
        shim += '    "type": "bar",\n';
        shim += '    "x": "category",\n';
        shim += '    "y": "sales",\n';
        shim += '    "agg": "sum"\n';
        shim += '  }\n';
        shim += '}\n';
        shim += '```\n';

        return shim;
    }
}

/** 全局单例 */
export const skillRegistry = new SkillRegistry();
