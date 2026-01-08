import { UserPrompt } from '@/types/prompt';

/**
 * L2 Prompt: 缺失值分析
 * 扫描全表，统计各列缺失情况和缺失模式
 */
export const workerMissingPrompt: UserPrompt = {
    id: 'worker-missing-v1',
    name: 'worker_missing',
    title: '缺失值分析',
    description: '扫描全表，统计各列缺失数量和比例，识别缺失模式',

    // 能力包配置 (v2.1)
    slug: 'worker-missing-v1',
    packageId: 'basic',
    requiredPackages: ['pandas', 'matplotlib', 'numpy'],
    outputCharts: ['chart'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'cleaning', label: '清洗' },
        { category: 'method', value: 'missing', label: '缺失检测' },
        { category: 'output', value: 'chart', label: '图表' }
    ],

    // ✅ Router 模式：全自动代码生成
    executionMode: 'TEMPLATE_FILL',
    template: '', // Placeholder for TS compliance

    codeTemplate: `import pandas as pd
import matplotlib.pyplot as plt
import io
import base64
import json
import numpy as np

plt.switch_backend('Agg')

def analyze(df):
    try:
        # 1. 计算缺失值
        missing = df.isnull().sum()
        missing = missing[missing > 0]
        
        if missing.empty:
             summary = "✅ 数据集完整，未发现任何缺失值。"
             # 生成一个全绿的简单图表
             fig, ax = plt.subplots(figsize=(8, 2))
             ax.text(0.5, 0.5, "100% Complete (No Missing Data)", 
                     ha='center', va='center', fontsize=14, color='#2ecc71')
             ax.axis('off')
             columns_used = []
        else:
            # 计算比例
            total_rows = len(df)
            missing_pct = (missing / total_rows) * 100
            missing_df = pd.DataFrame({'count': missing, 'pct': missing_pct})
            missing_df = missing_df.sort_values('pct', ascending=True) 
            
            # 颜色映射 (红>20%, 黄>5%, 绿<5%)
            colors = []
            for pct in missing_df['pct']:
                if pct > 20: colors.append('#e74c3c') # Red
                elif pct > 5: colors.append('#f1c40f') # Yellow
                else: colors.append('#2ecc71') # Green
            
            # 绘图
            fig_height = max(4, len(missing_df) * 0.4)
            fig, ax = plt.subplots(figsize=(10, fig_height), dpi=100)
            bars = ax.barh(missing_df.index, missing_df['pct'], color=colors)
            
            ax.set_xlabel('缺失比例 (%)')
            ax.set_title(f'发现 {len(missing_df)} 个列存在缺失值')
            ax.grid(axis='x', linestyle='--', alpha=0.3)
            
            # 标注数值
            for i, v in enumerate(missing_df['pct']):
                count = missing_df.iloc[i]['count']
                ax.text(v + 0.2, i, f'{v:.1f}% ({count})', va='center', fontsize=9)
                
            plt.tight_layout()
            
            # 摘要
            top_col = missing_df.index[-1]
            top_pct = missing_df.iloc[-1]['pct']
            summary = f"共 {len(missing_df)} 列存在缺失。缺失最严重的是 {top_col} ({top_pct:.1f}%)。"
            columns_used = list(missing.index)

        # 转 Base64
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        image_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
        
        # 兼容旧版格式 (code字段留空)
        result = {
            "image": image_base64, 
            "summary": summary,
            "columnsUsed": columns_used,
            "code": ""
        }
        return json.dumps(result)
        
    except Exception as e:
        return json.dumps({"error": str(e), "image": "", "summary": "分析失败"})

print(analyze(df))`,

    inputVariables: [],
    author: 'System',
    version: '2.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
