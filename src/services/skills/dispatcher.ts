/**
 * Skills 调度器
 * 负责接收 LLM 的工具调用请求，进行参数校验，路由到具体执行函数
 */

import { DuckDBEngine } from '@/db/duckdbEngine';
import { logger } from '@/utils/logger';
import { pyodideManager } from '@/services/PyodideManager';
import {
    SkillDefinition,
    SkillExecutionArgs,
    SkillExecutionResult
} from './definitions';
import { skillRegistry } from './registry';

/** 调度器类 */
export class SkillsDispatcher {
    private db: DuckDBEngine;
    private currentTableName: string | null = null;

    constructor() {
        this.db = DuckDBEngine.getInstance();
    }

    /** 设置当前操作的表名（用于参数校验） */
    setCurrentTable(tableName: string) {
        this.currentTableName = tableName;
    }

    /**
     * 执行单个 Skill
     * @param skillName Skill 名称
     * @param args 执行参数
     * @returns 执行结果
     */
    async execute(skillName: string, args: SkillExecutionArgs): Promise<SkillExecutionResult> {
        const startTime = performance.now();

        try {
            logger.group('Skills', `执行 ${skillName}`);
            logger.log('Skills', '参数', args);

            // 1. 验证 Skill 是否存在
            const skill = skillRegistry.get(skillName);
            if (!skill) {
                throw new Error(`未知的 Skill: ${skillName}`);
            }

            // 2. 参数校验
            this.validateArgs(skill, args);

            // 3. 路由到具体执行函数
            let result: any;
            switch (skillName) {
                case 'viz_create_chart':
                    result = await this.executeVizCreateChart(args);
                    break;
                case 'clean_remove_duplicates':
                    result = await this.executeCleanRemoveDuplicates(args);
                    break;
                case 'clean_fill_missing':
                    result = await this.executeCleanFillMissing(args);
                    break;
                case 'sys_export_report':
                    result = await this.executeSysExportReport(args);
                    break;
                case 'sys_switch_theme':
                    result = await this.executeSysSwitchTheme(args);
                    break;
                case 'sys_run_sql':  // 🆕 Generic Skill
                    result = await this.executeSysRunSQL(args);
                    break;
                case 'sys_run_python':  // 🆕 Generic Skill - Python执行
                    result = await this.executeSysRunPython(args);
                    break;
                default:
                    throw new Error(`Skill ${skillName} 尚未实现`);
            }

            const duration = performance.now() - startTime;
            logger.log('Skills', `执行成功，耗时 ${duration.toFixed(2)}ms`);
            logger.groupEnd();

            return {
                success: true,
                data: result,
                metadata: { duration }
            };

        } catch (error: any) {
            const duration = performance.now() - startTime;
            logger.error('Skills', `执行失败: ${error.message}`, error);
            logger.groupEnd();

            return {
                success: false,
                error: error.message,
                metadata: { duration }
            };
        }
    }

    /**
     * 参数校验（基础类型检查 + 必填项检查）
     */
    private validateArgs(skill: SkillDefinition, args: SkillExecutionArgs) {
        for (const [key, param] of Object.entries(skill.parameters)) {
            const value = args[key];

            // 必填参数检查
            if (param.required && (value === undefined || value === null)) {
                throw new Error(`缺少必填参数: ${key}`);
            }

            // 枚举值校验
            if (param.enum && value !== undefined) {
                if (!param.enum.includes(value)) {
                    throw new Error(`参数 ${key} 的值必须是 [${param.enum.join(', ')}] 之一`);
                }
            }
        }
    }

    /**
     * 获取当前表的所有列名（用于白名单校验）
     */
    private async getTableColumns(): Promise<string[]> {
        if (!this.currentTableName) {
            throw new Error('未设置当前表名，无法进行列名校验');
        }

        try {
            const columns = await this.db.getTableColumns(this.currentTableName);
            return columns.map(col => col.name);
        } catch (error: any) {
            logger.error('Skills', '获取表列失败', error);
            return [];
        }
    }

    /**
     * 校验列名是否在白名单中（防止 SQL 注入）
     */
    private async validateColumnName(columnName: string) {
        const columns = await this.getTableColumns();
        if (!columns.includes(columnName)) {
            logger.error('Skills', `无效的列名: ${columnName}`, { available: columns });
            throw new Error(`列 "${columnName}" 不存在于当前表中`);
        }
    }

    /**
     * 确保 DuckDB 连接已建立
     */
    private async ensureConnected() {
        await this.db.init();
        const conn = (this.db as any).conn;
        if (!conn) {
            throw new Error('DuckDB 连接未就绪');
        }
        return conn;
    }

    // ============================================================
    // Generic Skills 执行实现
    // ============================================================

    // ============================================================
    // Generic Skills 执行实现
    // ============================================================

    /**
     * 执行 sys_run_sql（通用SQL查询）
     */
    private async executeSysRunSQL(args: SkillExecutionArgs): Promise<any> {
        const { sql, permission = 'READ_ONLY', resultLimit = 10000 } = args;

        // 确保DuckDB已连接
        await this.ensureConnected();

        if (!this.currentTableName) {
            throw new Error('未设置表名，无法执行SQL');
        }

        // 🔐 权限检查
        const sqlUpper = sql.toUpperCase().trim();
        if (permission === 'READ_ONLY' && !sqlUpper.startsWith('SELECT') && !sqlUpper.startsWith('DESCRIBE') && !sqlUpper.startsWith('SHOW')) {
            throw new Error('READ_ONLY权限仅允许查询操作(SELECT/DESCRIBE/SHOW)');
        }

        if (permission === 'CLEANING') {
            // CLEANING允许：SELECT, UPDATE, ALTER, CREATE（但不允许DELETE/DROP/TRUNCATE）
            // 注意：DuckDB WASM中如果不持久化到OPFS，DROP TABLE影响仅限于当前会话
            // 但为了安全起见，我们仍禁止破坏性操作
            const forbidden = ['DELETE FROM', 'DROP TABLE', 'DROP VIEW', 'TRUNCATE', 'DROP DATABASE'];
            if (forbidden.some(cmd => sqlUpper.includes(cmd))) {
                throw new Error('CLEANING权限禁止删除表或清空数据的操作');
            }
        }

        // P1修复：sys_run_sql 实际执行逻辑
        if (permission !== 'READ_ONLY' && permission !== 'CLEANING' && permission !== 'FULL') {
            throw new Error(`未知的权限级别: ${permission}`);
        }

        // 执行SQL
        logger.log('Skills', `执行SQL (${permission})`, sql);

        try {
            // 如果是清洗操作(UPDATE/CREATE/ALTER)，使用 executeCleaningSQL (它会记录耗时)
            // 如果是查询操作，使用 runQuery
            if (permission === 'CLEANING' && !sqlUpper.startsWith('SELECT') && !sqlUpper.startsWith('DESCRIBE') && !sqlUpper.startsWith('SHOW')) {
                const resultMsg = await this.db.executeCleaningSQL(sql);
                return {
                    message: resultMsg,
                    affectedRows: -1, // DuckDB WASM 暂时不方便获取受影响行数，或者需要解析resultMsg
                    success: true
                };
            } else {
                const result = await this.db.runQuery(sql);

                // 限制结果集大小（仅READ_ONLY）
                if (permission === 'READ_ONLY' && result.length > resultLimit) {
                    logger.warn('Skills', `结果集超限，截断 ${result.length} → ${resultLimit}`);
                    return {
                        rows: result.slice(0, resultLimit),
                        rowCount: result.length,
                        truncated: true
                    };
                }

                return {
                    rows: result,
                    rowCount: result.length,
                    truncated: false
                };
            }
        } catch (err: any) {
            logger.error('Skills', 'SQL执行错误', err);
            throw new Error(`SQL执行失败: ${err.message}`);
        }
    }


    /**
     * 执行 sys_run_python（通用Python代码执行）
     */
    private async executeSysRunPython(args: SkillExecutionArgs): Promise<any> {
        const { code } = args;

        // 确保Pyodide已初始化
        logger.log('Skills', '初始化Pyodide引擎');
        pyodideManager.initialize();
        await pyodideManager.waitForReady();

        // 执行Python代码
        logger.log('Skills', `Python代码执行 (${code.length}字符)`);
        const result = await pyodideManager.runPython(code);

        return {
            output: result,
            success: true,
            codeLength: code.length
        };
    }

    // ============================================================
    // 可视化技能实现
    // ============================================================

    private async executeVizCreateChart(args: SkillExecutionArgs) {
        if (!this.currentTableName) {
            throw new Error('未设置当前表名');
        }

        // SQL 注入防范：白名单校验列名
        await this.validateColumnName(args.x);
        await this.validateColumnName(args.y);

        const agg = args.agg || 'SUM';
        const sql = `
      SELECT "${args.x}" as x_value, 
             ${agg}("${args.y}") as y_value
      FROM ${this.currentTableName}
      GROUP BY "${args.x}"
      ORDER BY y_value DESC
      LIMIT 50
    `;

        logger.log('Skills', 'SQL查询', { data: sql });

        const conn = await this.ensureConnected();
        const result = await conn.query(sql);

        // 转为图表数据格式
        const chartData = {
            labels: [] as string[],
            values: [] as number[]
        };

        for (let i = 0; i < result.numRows; i++) {
            const row = result.get(i)!;
            chartData.labels.push(String(row['x_value']));
            chartData.values.push(Number(row['y_value']));
        }

        return {
            type: args.type,
            data: chartData,
            metadata: { sql, rowCount: result.numRows }
        };
    }

    // ============================================================
    // 数据清洗技能实现
    // ============================================================

    private async executeCleanRemoveDuplicates(args: SkillExecutionArgs) {
        if (!this.currentTableName) {
            throw new Error('未设置当前表名');
        }

        const columns = args.columns || [];
        let distinctClause = '*';

        if (columns.length > 0) {
            // 校验所有列名
            for (const col of columns) {
                await this.validateColumnName(col);
            }
            distinctClause = `DISTINCT ON (${columns.map((c: string) => `"${c}"`).join(', ')}) *`;
        } else {
            distinctClause = 'DISTINCT *';
        }

        const sql = `SELECT ${distinctClause} FROM ${this.currentTableName}`;

        return {
            message: '去重 SQL 已生成（需要前端确认执行）',
            sql,
            preview: null
        };
    }

    private async executeCleanFillMissing(args: SkillExecutionArgs) {
        await this.validateColumnName(args.column);

        let fillExpression = '';
        switch (args.strategy) {
            case 'mean':
                fillExpression = `COALESCE("${args.column}", (SELECT AVG("${args.column}") FROM ${this.currentTableName}))`;
                break;
            case 'median':
                fillExpression = `COALESCE("${args.column}", (SELECT MEDIAN("${args.column}") FROM ${this.currentTableName}))`;
                break;
            case 'zero':
                fillExpression = `COALESCE("${args.column}", 0)`;
                break;
            case 'drop':
                return {
                    message: '删除缺失值 SQL 已生成',
                    sql: `SELECT * FROM ${this.currentTableName} WHERE "${args.column}" IS NOT NULL`
                };
            default:
                throw new Error(`未知的填充策略: ${args.strategy}`);
        }

        const sql = `SELECT *, ${fillExpression} as "${args.column}_filled" FROM ${this.currentTableName}`;

        return {
            message: '填充 SQL 已生成',
            sql
        };
    }

    // ============================================================
    // 系统操作技能实现（前端直接处理，返回指令）
    // ============================================================

    private async executeSysExportReport(args: SkillExecutionArgs) {
        return {
            action: 'export_report',
            format: args.format,
            message: `请求导出 ${args.format} 格式报告`
        };
    }

    private async executeSysSwitchTheme(args: SkillExecutionArgs) {
        return {
            action: 'switch_theme',
            theme: args.theme,
            message: `请求切换到 ${args.theme} 主题`
        };
    }
}

/** 全局单例 */
export const skillsDispatcher = new SkillsDispatcher();
