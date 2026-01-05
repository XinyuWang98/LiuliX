import { UserPrompt } from '@/types/prompt';

/**
 * L2 Prompt: Top N 排名
 * 找出某列数值最大或最小的前 N 条记录
 */
export const workerTopnPrompt: UserPrompt = {
    id: 'worker-topn-v1',
    name: 'worker_topn',
    title: 'Top N 排名',
    description: '找出某列数值最大或最小的前N条记录，展示排名榜单',



    // 能力包配置 (v2.1)
    slug: 'worker-topn-v1',
    packageId: 'basic',
    requiredPackages: ['matplotlib', 'pandas'],
    outputCharts: ['bar', 'line'],
    layer: 'L2_EXECUTION',

    dimensions: [
        { category: 'industry', value: 'general', label: '通用' },
        { category: 'intent', value: 'exploration', label: '探索' },
        { category: 'method', value: 'ranking', label: '排名' },
        { category: 'output', value: 'chart', label: '图表' }
    ],

    template: `
你是一个专业的 Python 数据分析师。
请针对 DataFrame \`df\`，找出 \`{{column_name}}\` 列数值 {{#if ascending}}最小{{else}}最大{{/if}} 的前 {{n}} 条记录。

# 数据集摘要
{{df_summary}}

# 参数
- 列名: {{column_name}}
- 数量: {{n}}
- 排序方向: {{ascending}} (true=升序/最小, false=降序/最大)

# 要求
1. 确认 {{column_name}} 为数值类型。
2. 根据 ascending 参数决定排序方向：
   - ascending=true: 找最小的 N 个
   - ascending=false: 找最大的 N 个
3. 绘制水平柱状图 (Horizontal Bar Chart)，展示排名。
4. 柱状图按排名顺序排列（最大/最小在最上方）。
5. 标题: "{{column_name}} Top {{n}} 排名"。
6. 使用 matplotlib/seaborn 绘图。
7. **不要** 生成任何 plt.show()，图表对象请保留在内存中。
8. 返回 JSON 格式结果。

# 输出格式 (JSON Only)
{
  "code": "...",
  "summary": "{{column_name}} 列 Top {{n}}: 第1名为 X (值)，第{{n}}名为 Y (值)",
  "columnsUsed": ["{{column_name}}"]
}
`,

    inputVariables: ['df_summary', 'column_name', 'n', 'ascending'],

    // 开启模板模式，支持 Inflater 直接渲染
    executionMode: 'TEMPLATE_FILL',
    codeTemplate: `import pandas as pd
import matplotlib.pyplot as plt
import io
import base64
import json

def analyze(df):
    try:
        # 参数提取
        column_name = {{column_name}}
        n = int('{{n}}')
        topn = {{topn}}
        # 处理布尔值字符串 (JS true -> Python True)
        ascending_param = str({{ascending}}).lower()
        ascending = True if ascending_param == 'true' else False

        # 1. 数据准备
        df_clean = df.copy()
        
        # 转换数值类型，处理非数值
        df_clean[column_name] = pd.to_numeric(df_clean[column_name], errors='coerce')
        df_clean = df_clean.dropna(subset=[column_name])
        
        if df_clean.empty:
            return json.dumps({
                "error": f"列 {column_name} 无有效数值数据"
            })

        # 2. 核心计算 (Top N)
        top_n_df = df_clean.sort_values(by=column_name, ascending=ascending).head(n)
        
        # 为了绘图美观，如果升序找最小，最大的在上面？
        # 通常 Top N 绘图，值大的在上面。
        # 如果是 Top N (最大)，sort_values(ascending=False)。
        # 如果是 Bottom N (最小)，sort_values(ascending=True)。
        
        # 为了 barh 绘图顺序 (从上到下)，我们需要反转数据的顺序
        # 因为 barh 是从下往上画的
        plot_df = top_n_df.iloc[::-1]

        # 3. 可视化
        plt.figure(figsize=(10, 6))
        # 假设第一列是 Label，或者使用 Index
        # 尝试找到一个合适的 Label 列 (非数值列)
        label_col = plot_df.select_dtypes(include=['object', 'category']).columns
        if len(label_col) > 0:
            y_labels = plot_df[label_col[0]]
            y_col_name = label_col[0]
        else:
            y_labels = plot_df.index
            y_col_name = "Index"

        bars = plt.barh(range(len(plot_df)), plot_df[column_name], color='#4e79a7')
        plt.yticks(range(len(plot_df)), y_labels)
        
        title_suffix = "最小" if ascending else "最大"
        plt.title(f"{column_name} Top {n} ({title_suffix})")
        plt.xlabel(column_name)
        plt.ylabel(y_col_name)
        plt.grid(axis='x', linestyle='--', alpha=0.7)
        plt.tight_layout()

        # 保存图表
        img_buf = io.BytesIO()
        plt.savefig(img_buf, format='png')
        img_buf.seek(0)
        img_base64 = base64.b64encode(img_buf.read()).decode('utf-8')
        plt.close()

        # 4. 生成摘要
        first_val = top_n_df.iloc[0][column_name]
        last_val = top_n_df.iloc[-1][column_name]
        direction_str = "最小" if ascending else "最大"
        summary = f"{column_name} 列 {direction_str}的前 {n} 条记录。范围从 {first_val} 到 {last_val}。"

        # 5. 返回结果
        result = {
            "code": "", # 代码在外部展示
            "summary": summary,
            "columnsUsed": [column_name],
            "image": img_base64
        }
        return json.dumps(result)

    except Exception as e:
        return json.dumps({"error": str(e)})

# 执行分析
print(analyze(df))
`,

    author: 'System',
    version: '1.0.0',
    isBuiltIn: true,
    updatedAt: Date.now()
};
